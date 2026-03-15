// ============================================================
// 文件：cloud/getTaskStatus/index.js
// 说明：获取每日/每周任务进度与领取状态
// 负责人：D
// 调用方：C（TaskPanel → CloudAPI.getTaskStatus()）
// 参数：无
// 返回类型：ITaskStatusResult
// 涉及集合：daily_progress, weekly_progress
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { DAILY_TASKS, WEEKLY_TASKS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const todayStr = H.today()
    const ws = H.weekStart()

    // 1. 查每日进度
    const dailyRes = await db.collection('daily_progress').where({
      userId: OPENID, date: todayStr,
    }).get()

    const daily = dailyRes.data.length > 0
      ? dailyRes.data[0]
      : { login: 0, water: 0, harvest: 0, visitFriend: 0, helpWater: 0, claimedTasks: [] }

    // 2. 查每周进度
    const weeklyRes = await db.collection('weekly_progress').where({
      userId: OPENID, weekStart: ws,
    }).get()

    const weekly = weeklyRes.data.length > 0
      ? weeklyRes.data[0]
      : { totalHarvest: 0, loginDays: [], claimedTasks: [] }

    // 3. 组装每日任务
    const dailyTasks = DAILY_TASKS.map(def => ({
      taskId: def.taskId,
      description: def.description,
      target: def.target,
      current: Math.min(daily[def.field] || 0, def.target),
      rewardCoins: def.rewardCoins,
      rewardExp: def.rewardExp,
      rewardDiamonds: def.rewardDiamonds,
      claimed: (daily.claimedTasks || []).includes(def.taskId),
    }))

    // 4. 组装每周任务
    const weeklyTasks = WEEKLY_TASKS.map(def => {
      let current = 0
      if (def.field === 'loginDays') {
        current = (weekly.loginDays || []).length
      } else {
        current = weekly[def.field] || 0
      }
      return {
        taskId: def.taskId,
        description: def.description,
        target: def.target,
        current: Math.min(current, def.target),
        rewardCoins: def.rewardCoins,
        rewardExp: def.rewardExp,
        rewardDiamonds: def.rewardDiamonds,
        claimed: (weekly.claimedTasks || []).includes(def.taskId),
      }
    })

    const allDailyDone = dailyTasks.every(t => t.current >= t.target)

    return H.ok({
      dailyTasks,
      weeklyTasks,
      allDailyDone,
    })
  } catch (err) {
    console.error('[getTaskStatus]', err)
    return H.fail(9012, '获取任务失败: ' + err.message)
  }
}
