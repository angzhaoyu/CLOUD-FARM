// ============================================================
// 文件：cloud/plant/index.js
// 说明：种植作物到指定地块
// 负责人：D
// 调用方：A（PlotNode → CloudAPI.plant()）
// 参数：{ plotIndex: number, cropId: string }
// 返回类型：IPlantResult
// 涉及集合：plots, users（扣金币）
// 校验：地块是否为空、金币是否足够、等级是否解锁该作物
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { plotIndex, cropId } = event

  try {
    // 1. 验证作物
    const cfg = CROP_CONFIGS[cropId]
    if (!cfg) return H.fail(1001, '未知作物: ' + cropId)

    // 2. 查用户
    const userRes = await db.collection('users').doc(OPENID).get()
    const user = userRes.data

    // 3. 等级检查
    if (user.level < cfg.unlockLevel) {
      return H.fail(1002, `需要等级 ${cfg.unlockLevel} 才能种植${cfg.name}`)
    }

    // 4. 金币检查
    if (user.coins < cfg.seedPrice) {
      return H.fail(1003, '金币不足')
    }

    // 5. 查地块
    const plotRes = await db.collection('plots').where({
      userId: OPENID,
      plotIndex: plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    if (!plot.unlocked) return H.fail(1004, '地块未解锁')
    if (plot.crop) return H.fail(1005, '地块已有作物')

    // 6. 扣金币
    const newCoins = user.coins - cfg.seedPrice
    await db.collection('users').doc(OPENID).update({
      data: { coins: newCoins }
    })

    // 7. 写入作物
    const crop = {
      cropId,
      plantedAt: Date.now(),
      growTime: cfg.growTime,
      status: 'growing',
      waterCount: 0,
      fertilizerCount: 0,
      hasBug: false,
      speedBoost: 0,
      stolenBy: [],
      protectedUntil: null,
    }

    await db.collection('plots').doc(plot._id).update({
      data: { crop }
    })

    return H.ok({
      plotIndex,
      crop,
      newCoins,
    })
  } catch (err) {
    console.error('[plant]', err)
    return H.fail(9003, '种植失败: ' + err.message)
  }
}
