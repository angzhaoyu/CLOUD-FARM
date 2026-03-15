// ============================================================
// 文件：cloud/claimTask/index.js
// 说明：领取已完成任务的奖励
// 负责人：D
// 调用方：C（TaskPanel → CloudAPI.claimTask()）
// 参数：{ taskId: string }
// 返回类型：IClaimTaskResult
// 涉及集合：daily_progress/weekly_progress, users（加金币/经验/钻石）
// 校验：任务是否已完成、奖励是否已领取
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { DAILY_TASKS, WEEKLY_TASKS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { taskId } = event

  try {
    const todayStr = H.today()
    const ws = H.weekStart()

    // 1. 判断是日任务还是周任务
    let taskDef = DAILY_TASKS.find(t => t.taskId === taskId)
    let isDaily = !!taskDef
    if (!taskDef) {
      taskDef = WEEKLY_TASKS.find(t => t.taskId === taskId)
    }
    if (!taskDef) return H.fail(1001, '未知任务')

    // 2. 查进度
    let progressDoc, progressData, collection
    if (isDaily) {
      collection = 'daily_progress'
      const res = await db.collection(collection).where({
        userId: OPENID, date: todayStr,
      }).get()
      if (res.data.length === 0) return H.fail(1002, '今日无进度')
      progressDoc = res.data[0]
      progressData = progressDoc
    } else {
      collection = 'weekly_progress'
      const res = await db.collection(collection).where({
        userId: OPENID, weekStart: ws,
      }).get()
      if (res.data.length === 0) return H.fail(1002, '本周无进度')
      progressDoc = res.data[0]
      progressData = progressDoc
    }

    // 3. 是否已领取
    if ((progressData.claimedTasks || []).includes(taskId)) {
      return H.fail(1003, '奖励已领取')
    }

    // 4. 检查是否完成
    let current = 0
    if (isDaily) {
      current = progressData[taskDef.field] || 0
    } else {
      current = taskDef.field === 'loginDays'
        ? (progressData.loginDays || []).length
        : (progressData[taskDef.field] || 0)
    }

    if (current < taskDef.target) {
      return H.fail(1004, '任务未完成')
    }

    // 5. 标记已领取
    await db.collection(collection).doc(progressDoc._id).update({
      data: { claimedTasks: _.push(taskId) }
    })

    // 6. 发放奖励
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = userRes.data
    const { user: updatedUser, leveledUp } = H.addExp(user, taskDef.rewardExp)
    updatedUser.coins += taskDef.rewardCoins
    updatedUser.diamonds += taskDef.rewardDiamonds

    await db.collection('users').doc(OPENID).update({
      data: {
        coins: updatedUser.coins,
        diamonds: updatedUser.diamonds,
        exp: updatedUser.exp,
        level: updatedUser.level,
        energyMax: updatedUser.energyMax,
      }
    })

    return H.ok({
      newCoins: updatedUser.coins,
      newExp: updatedUser.exp,
      newDiamonds: updatedUser.diamonds,
      newLevel: updatedUser.level,
      leveledUp,
    })
  } catch (err) {
    console.error('[claimTask]', err)
    return H.fail(9013, '领取失败: ' + err.message)
  }
}
