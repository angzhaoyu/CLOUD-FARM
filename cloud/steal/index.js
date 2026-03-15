// ============================================================
// 文件：cloud/steal/index.js
// 说明：偷取好友的成熟作物
// 负责人：D
// 调用方：B（FriendPlotNode/StealAction → CloudAPI.steal()）
// 参数：{ targetUserId: string, plotIndex: number }
// 返回类型：IStealResult
// 涉及集合：plots（目标用户）, warehouse（自己）, interactions
// 校验：作物是否成熟、是否已偷过、是否有保护罩、每日次数限制
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { CROP_CONFIGS, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { targetUserId, plotIndex } = event

  try {
    // 1. 不能偷自己
    if (targetUserId === OPENID) {
      return H.fail(3001, '不能偷自己的菜')
    }

    // 2. 查目标地块
    const plotRes = await db.collection('plots').where({
      userId: targetUserId, plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    // 3. 刷新状态后检查
    if (!plot.crop) return H.fail(1001, '地块没有作物')
    const { crop } = H.refreshCropStatus(plot.crop)
    if (crop.status !== 'mature') return H.fail(1002, '作物还没成熟')

    // 4. 保护罩检查
    if (crop.protectedUntil && crop.protectedUntil > Date.now()) {
      return H.fail(1003, '对方有保护罩')
    }

    // 5. 是否已偷过这块地
    if (crop.stolenBy && crop.stolenBy.includes(OPENID)) {
      return H.fail(1004, '你已经偷过这块地了')
    }

    // 6. 每日偷同一好友上限
    const todayStr = H.today()
    const countRes = await db.collection('interactions').where({
      fromUser: OPENID,
      toUser: targetUserId,
      type: 'steal',
      date: todayStr,
    }).count()

    if (countRes.total >= GAME.MAX_STEAL_PER_FRIEND) {
      return H.fail(1005, `今天已偷过该好友${GAME.MAX_STEAL_PER_FRIEND}次了`)
    }

    // 7. 执行偷菜
    const cfg = CROP_CONFIGS[crop.cropId]
    const cropName = cfg ? cfg.name : crop.cropId
    const stolenCount = 1

    // 标记被偷
    await db.collection('plots').doc(plot._id).update({
      data: { 'crop.stolenBy': _.push(OPENID) }
    })

    // 放入偷菜者仓库
    const whRes = await db.collection('warehouse').where({ userId: OPENID }).get()
    if (whRes.data.length > 0) {
      const wh = whRes.data[0]
      const items = wh.items || []
      const existing = items.find(i => i.cropId === crop.cropId)
      if (existing) {
        existing.count += stolenCount
      } else {
        items.push({ cropId: crop.cropId, count: stolenCount })
      }
      await db.collection('warehouse').doc(wh._id).update({ data: { items } })
    }

    // 更新偷菜统计
    await db.collection('users').doc(OPENID).update({
      data: { totalSteal: _.inc(stolenCount) }
    })

    // 8. 记录互动日志
    const myInfo = await db.collection('users').doc(OPENID).get()
    await db.collection('interactions').add({
      data: {
        fromUser: OPENID,
        fromNickname: myInfo.data.nickname || '某人',
        toUser: targetUserId,
        type: 'steal',
        cropId: crop.cropId,
        cropName,
        count: stolenCount,
        date: todayStr,
        createdAt: Date.now(),
      }
    })

    return H.ok({
      cropId: crop.cropId,
      cropName,
      count: stolenCount,
    })
  } catch (err) {
    console.error('[steal]', err)
    return H.fail(9007, '偷菜失败: ' + err.message)
  }
}
