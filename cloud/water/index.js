// ============================================================
// 文件：cloud/water/index.js
// 说明：给自己的作物浇水
// 负责人：D
// 调用方：A（PlotNode → CloudAPI.water()）
// 参数：{ plotIndex: number }
// 返回类型：IWaterResult
// 涉及集合：plots, users（扣体力）
// 校验：地块是否有作物、是否处于生长中、体力是否足够
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { plotIndex } = event

  try {
    // 1. 查用户 + 恢复体力
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = H.recoverEnergy(userRes.data)

    // 2. 体力检查
    if (user.energy < GAME.ENERGY_PER_WATER) {
      return H.fail(1001, '体力不足')
    }

    // 3. 查地块
    const plotRes = await db.collection('plots').where({
      userId: OPENID,
      plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    if (!plot.crop) return H.fail(1002, '地块没有作物')
    if (plot.crop.status !== 'growing') return H.fail(1003, '作物不在生长中')

    const cfg = CROP_CONFIGS[plot.crop.cropId]
    if (plot.crop.waterCount >= cfg.needWater) {
      return H.fail(1004, '已浇够水了')
    }

    // 4. 扣体力
    const newEnergy = user.energy - GAME.ENERGY_PER_WATER
    await db.collection('users').doc(OPENID).update({
      data: {
        energy: newEnergy,
        lastEnergyUpdate: Date.now(),
      }
    })

    // 5. 更新作物
    const newWaterCount = plot.crop.waterCount + 1
    const newSpeedBoost = Math.min(
      GAME.MAX_SPEED_BOOST,
      (plot.crop.speedBoost || 0) + GAME.WATER_SPEED_BOOST
    )

    await db.collection('plots').doc(plot._id).update({
      data: {
        'crop.waterCount': newWaterCount,
        'crop.speedBoost': newSpeedBoost,
      }
    })

    // 6. 更新任务进度
    await H.incrDailyProgress(db, OPENID, 'water')

    return H.ok({
      plotIndex,
      newEnergy,
      newWaterCount,
      newSpeedBoost,
    })
  } catch (err) {
    console.error('[water]', err)
    return H.fail(9004, '浇水失败: ' + err.message)
  }
}
