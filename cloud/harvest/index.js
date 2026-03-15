// ============================================================
// 文件：cloud/harvest/index.js
// 说明：收获成熟作物
// 负责人：D
// 调用方：A（PlotNode → CloudAPI.harvest()）
// 参数：{ plotIndex: number }
// 返回类型：IHarvestResult
// 涉及集合：plots, warehouse, users（加经验、可能升级）
// 校验：作物是否成熟、地块是否有作物
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { plotIndex } = event
  const _ = db.command

  try {
    // 1. 查地块
    const plotRes = await db.collection('plots').where({
      userId: OPENID, plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    if (!plot.crop) return H.fail(1001, '地块没有作物')

    // 刷新状态（可能刚好到成熟）
    const { crop } = H.refreshCropStatus(plot.crop)

    if (crop.status === 'growing') return H.fail(1002, '作物还没成熟')
    if (crop.status === 'withered') return H.fail(1003, '作物已枯萎')

    const cfg = CROP_CONFIGS[crop.cropId]
    if (!cfg) return H.fail(2002, '未知作物')

    // 2. 计算收获数量（减去被偷的）
    const baseCount = H.randomInt(cfg.harvestMin, cfg.harvestMax)
    const stolenCount = (crop.stolenBy || []).length
    const count = Math.max(1, baseCount - stolenCount) // 至少收获1个

    // 3. 放入仓库
    const whRes = await db.collection('warehouse').where({ userId: OPENID }).get()
    if (whRes.data.length > 0) {
      const wh = whRes.data[0]
      const items = wh.items || []
      const existing = items.find(i => i.cropId === crop.cropId)
      if (existing) {
        existing.count += count
      } else {
        items.push({ cropId: crop.cropId, count })
      }
      await db.collection('warehouse').doc(wh._id).update({ data: { items } })
    }

    // 4. 加经验 + 检查升级
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = userRes.data
    const { user: updatedUser, leveledUp } = H.addExp(user, cfg.expReward)

    await db.collection('users').doc(OPENID).update({
      data: {
        exp: updatedUser.exp,
        level: updatedUser.level,
        energyMax: updatedUser.energyMax,
        totalHarvest: _.inc(count),
      }
    })

    // 5. 清空地块
    await db.collection('plots').doc(plot._id).update({
      data: { crop: null }
    })

    // 6. 更新任务进度
    await H.incrDailyProgress(db, OPENID, 'harvest')
    await H.incrWeeklyProgress(db, OPENID, 'totalHarvest', count)

    return H.ok({
      cropId: crop.cropId,
      cropName: cfg.name,
      count,
      expGained: cfg.expReward,
      newExp: updatedUser.exp,
      newLevel: updatedUser.level,
      leveledUp,
    })
  } catch (err) {
    console.error('[harvest]', err)
    return H.fail(9006, '收获失败: ' + err.message)
  }
}
