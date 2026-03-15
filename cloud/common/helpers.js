// ============================================================
// 文件：cloud/common/helpers.js
// 说明：所有云函数共享的工具函数（响应构造/日期/体力恢复/作物状态刷新/经验升级/任务进度）
// 负责人：D
// 调用方：所有云函数通过 require('cloud-farm-common/helpers') 引用
// 规则：任何新增工具方法统一加在此文件，不要在单个云函数里重复实现
// ============================================================

const { CROP_CONFIGS, LEVEL_EXP, PLOT_UNLOCKS, GAME } = require('./config')

// ======================== 响应构造 ========================

/** 成功响应 */
function ok(data) {
  return { code: 0, msg: 'ok', data }
}

/** 失败响应 */
function fail(code, msg) {
  return { code, msg, data: null }
}

// ======================== 日期工具 ========================

/** 返回今天日期字符串 "2025-01-15" */
function today() {
  return new Date().toISOString().split('T')[0]
}

/** 返回本周一日期字符串 */
function weekStart() {
  const d = new Date()
  const day = d.getDay() || 7 // 周日=7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}

/** 随机整数 [min, max] */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ======================== 体力恢复 ========================

/**
 * 根据 lastEnergyUpdate 计算恢复后的体力
 * 返回 { energy, lastEnergyUpdate } 更新后的值
 */
function recoverEnergy(user) {
  const now = Date.now()
  const elapsed = now - (user.lastEnergyUpdate || now)
  const recovered = Math.floor(elapsed / GAME.ENERGY_RECOVERY_MS)
  if (recovered > 0 && user.energy < user.energyMax) {
    user.energy = Math.min(user.energyMax, user.energy + recovered)
    user.lastEnergyUpdate = now
  }
  return user
}

// ======================== 作物状态刷新 ========================

/**
 * 检查并更新单个作物状态 (growing → mature → withered)
 * @param {Object} crop  作物数据
 * @returns {Object} { crop, changed } changed=true 表示状态有变
 */
function refreshCropStatus(crop) {
  if (!crop) return { crop: null, changed: false }
  if (crop.status === 'withered') return { crop, changed: false }

  const cfg = CROP_CONFIGS[crop.cropId]
  if (!cfg) return { crop, changed: false }

  const now = Date.now()
  const elapsed = (now - crop.plantedAt) / 1000 // 秒
  const effectiveGrowTime = crop.growTime * (1 - (crop.speedBoost || 0))
  let changed = false

  if (crop.status === 'growing' && elapsed >= effectiveGrowTime) {
    crop.status = 'mature'
    changed = true
  }

  if (crop.status === 'mature') {
    const matureElapsed = elapsed - effectiveGrowTime
    if (matureElapsed >= cfg.witherTime) {
      crop.status = 'withered'
      changed = true
    }
  }

  return { crop, changed }
}

/**
 * 批量刷新地块中的作物状态
 * @param {Array} plots 地块数组
 * @returns {Object} { plots, changedIndexes }
 */
function refreshAllCropStatuses(plots) {
  const changedIndexes = []
  for (const plot of plots) {
    if (plot.crop) {
      const { crop, changed } = refreshCropStatus(plot.crop)
      plot.crop = crop
      if (changed) changedIndexes.push(plot.plotIndex)
    }
  }
  return { plots, changedIndexes }
}

// ======================== 等级与经验 ========================

/**
 * 增加经验并处理升级
 * @param {Object} user 用户数据
 * @param {number} amount 增加的经验值
 * @returns {Object} { user, leveledUp, oldLevel }
 */
function addExp(user, amount) {
  const oldLevel = user.level
  user.exp += amount

  let needed = LEVEL_EXP[user.level] || 9999999
  while (user.exp >= needed && user.level < 30) {
    user.exp -= needed
    user.level++
    user.energyMax += GAME.ENERGY_PER_LEVEL
    needed = LEVEL_EXP[user.level] || 9999999
  }

  return { user, leveledUp: user.level > oldLevel, oldLevel }
}

// ======================== 地块初始化 ========================

/**
 * 为新用户生成初始地块数据
 * @param {string} userId
 * @returns {Array} 地块文档数组（用于批量插入）
 */
function createInitialPlots(userId) {
  const plots = []
  for (let i = 0; i < GAME.DEFAULT_PLOT_COUNT; i++) {
    plots.push({
      userId,
      plotIndex: i,
      unlocked: (PLOT_UNLOCKS[i] || 99) <= 1,
      crop: null,
    })
  }
  return plots
}

// ======================== 任务进度 ========================

/**
 * 更新每日任务进度（增量）
 * @param {Object} db       数据库实例
 * @param {string} userId
 * @param {string} field    进度字段名 (login/water/harvest/visitFriend/helpWater)
 * @param {number} delta    增量，默认 1
 */
async function incrDailyProgress(db, userId, field, delta = 1) {
  const _ = db.command
  const dateStr = today()

  const res = await db.collection('daily_progress').where({
    userId,
    date: dateStr,
  }).get()

  if (res.data.length === 0) {
    // 首条记录
    const doc = {
      userId,
      date: dateStr,
      login: 0, water: 0, harvest: 0,
      visitFriend: 0, helpWater: 0,
      claimedTasks: [],
    }
    doc[field] = delta
    await db.collection('daily_progress').add({ data: doc })
  } else {
    await db.collection('daily_progress').doc(res.data[0]._id).update({
      data: { [field]: _.inc(delta) }
    })
  }
}

/**
 * 更新每周任务进度
 */
async function incrWeeklyProgress(db, userId, field, delta = 1) {
  const _ = db.command
  const ws = weekStart()

  const res = await db.collection('weekly_progress').where({
    userId,
    weekStart: ws,
  }).get()

  if (res.data.length === 0) {
    const doc = {
      userId,
      weekStart: ws,
      totalHarvest: 0,
      loginDays: [],
      claimedTasks: [],
    }
    if (field === 'loginDays') {
      doc.loginDays = [today()]
    } else {
      doc[field] = delta
    }
    await db.collection('weekly_progress').add({ data: doc })
  } else {
    if (field === 'loginDays') {
      const days = res.data[0].loginDays || []
      if (!days.includes(today())) {
        await db.collection('weekly_progress').doc(res.data[0]._id).update({
          data: { loginDays: _.push(today()) }
        })
      }
    } else {
      await db.collection('weekly_progress').doc(res.data[0]._id).update({
        data: { [field]: _.inc(delta) }
      })
    }
  }
}

module.exports = {
  ok, fail,
  today, weekStart, randomInt,
  recoverEnergy,
  refreshCropStatus, refreshAllCropStatuses,
  addExp,
  createInitialPlots,
  incrDailyProgress, incrWeeklyProgress,
}