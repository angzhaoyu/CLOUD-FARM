// ============================================================
// 文件：cloud/checkWither/index.js
// 说明：检查并处理作物枯萎（定时触发器或客户端调用）
// 负责人：D
// 调用方：定时触发器 / A（FarmManager 定时调用）
// 参数：无（或 { openId: string }）
// 返回类型：IApiResult
// 涉及集合：plots（更新枯萎状态）
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  console.log('[checkWither] 定时任务开始')

  try {
    // 查所有有作物的地块（分批处理）
    let skip = 0
    const batchSize = 100
    let totalUpdated = 0
    let totalBugged = 0

    while (true) {
      const res = await db.collection('plots')
        .where({ crop: db.command.neq(null) })
        .skip(skip)
        .limit(batchSize)
        .get()

      if (res.data.length === 0) break

      for (const plot of res.data) {
        const crop = plot.crop
        if (!crop) continue

        let needUpdate = false
        const updateData = {}

        // ---- 状态刷新 ----
        const { crop: refreshed, changed } = H.refreshCropStatus(crop)
        if (changed) {
          updateData.crop = refreshed
          needUpdate = true
          totalUpdated++
        }

        // ---- 随机生虫（仅生长中且无虫的） ----
        if (refreshed.status === 'growing' && !refreshed.hasBug) {
          if (Math.random() < GAME.BUG_CHANCE) {
            if (!updateData.crop) updateData.crop = { ...refreshed }
            updateData.crop.hasBug = true
            needUpdate = true
            totalBugged++
          }
        }

        if (needUpdate) {
          await db.collection('plots').doc(plot._id).update({ data: updateData })
        }
      }

      skip += batchSize
      if (res.data.length < batchSize) break
    }

    console.log(`[checkWither] 完成: ${totalUpdated} 状态变更, ${totalBugged} 生虫`)
    return { updated: totalUpdated, bugged: totalBugged }
  } catch (err) {
    console.error('[checkWither]', err)
    return { error: err.message }
  }
}
