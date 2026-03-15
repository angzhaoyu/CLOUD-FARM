// ============================================================
// 文件：cloud/fertilize/index.js
// 说明：给自己的作物施肥
// 负责人：D
// 调用方：A（PlotNode → CloudAPI.fertilize()）
// 参数：{ plotIndex: number, fertilizerType: "normal"|"advanced"|"super" }
// 返回类型：IWaterResult
// 涉及集合：plots, users（扣道具/金币）
// 校验：地块是否有作物、肥料是否拥有
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS, FERTILIZER_BOOST, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { plotIndex, fertilizerType } = event

  try {
    // 1. 验证肥料类型
    const boost = FERTILIZER_BOOST[fertilizerType]
    if (boost === undefined) return H.fail(1001, '未知肥料类型')

    // 2. 查用户 + 恢复体力
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = H.recoverEnergy(userRes.data)

    if (user.energy < GAME.ENERGY_PER_FERTILIZE) {
      return H.fail(1002, '体力不足')
    }

    // 3. 检查道具背包
    const invRes = await db.collection('inventory').where({ userId: OPENID }).get()
    if (invRes.data.length === 0) return H.fail(1003, '没有肥料')

    const inv = invRes.data[0]
    const count = (inv.items && inv.items[fertilizerType]) || 0
    if (count <= 0) return H.fail(1003, '没有肥料')

    // 4. 查地块
    const plotRes = await db.collection('plots').where({
      userId: OPENID, plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    if (!plot.crop) return H.fail(1004, '地块没有作物')
    if (plot.crop.status !== 'growing') return H.fail(1005, '作物不在生长中')

    const cfg = CROP_CONFIGS[plot.crop.cropId]
    if (plot.crop.fertilizerCount >= cfg.needFertilizer) {
      return H.fail(1006, '已施够肥了')
    }

    // 5. 扣体力 + 扣道具
    const newEnergy = user.energy - GAME.ENERGY_PER_FERTILIZE
    await db.collection('users').doc(OPENID).update({
      data: { energy: newEnergy, lastEnergyUpdate: Date.now() }
    })

    const _ = db.command
    await db.collection('inventory').doc(inv._id).update({
      data: { [`items.${fertilizerType}`]: _.inc(-1) }
    })

    // 6. 更新作物
    const newSpeedBoost = Math.min(
      GAME.MAX_SPEED_BOOST,
      (plot.crop.speedBoost || 0) + boost
    )
    const newFertilizerCount = plot.crop.fertilizerCount + 1

    await db.collection('plots').doc(plot._id).update({
      data: {
        'crop.fertilizerCount': newFertilizerCount,
        'crop.speedBoost': newSpeedBoost,
      }
    })

    return H.ok({
      plotIndex,
      newEnergy,
      newWaterCount: plot.crop.waterCount,  // 不变，保持接口一致
      newSpeedBoost,
    })
  } catch (err) {
    console.error('[fertilize]', err)
    return H.fail(9005, '施肥失败: ' + err.message)
  }
}
