// ============================================================
// 文件：cloud/common/config.js
// 说明：所有云函数共享的游戏配置常量（作物/商店/等级/签到/任务）
// 负责人：D
// 调用方：所有云函数通过 require('cloud-farm-common/config') 引用
// 规则：前端 CropConfig.ts / ShopConfig.ts 等静态数据必须与此文件保持一致
// ============================================================

/** 作物配置（与前端 CropConfig.ts 保持一致） */
const CROP_CONFIGS = {
  cabbage:     { name: '白菜',   seedPrice: 5,  sellPrice: 10, growTime: 7200,  needWater: 2, needFertilizer: 1, expReward: 8,  unlockLevel: 1,  harvestMin: 2, harvestMax: 4, witherTime: 7200  },
  lettuce:     { name: '生菜',   seedPrice: 8,  sellPrice: 15, growTime: 10800, needWater: 2, needFertilizer: 1, expReward: 10, unlockLevel: 1,  harvestMin: 2, harvestMax: 5, witherTime: 7200  },
  radish:      { name: '萝卜',   seedPrice: 10, sellPrice: 20, growTime: 14400, needWater: 3, needFertilizer: 1, expReward: 15, unlockLevel: 3,  harvestMin: 2, harvestMax: 4, witherTime: 7200  },
  tomato:      { name: '番茄',   seedPrice: 15, sellPrice: 35, growTime: 28800, needWater: 3, needFertilizer: 2, expReward: 20, unlockLevel: 5,  harvestMin: 2, harvestMax: 4, witherTime: 7200  },
  sunflower:   { name: '向日葵', seedPrice: 12, sellPrice: 25, growTime: 21600, needWater: 2, needFertilizer: 1, expReward: 15, unlockLevel: 2,  harvestMin: 1, harvestMax: 3, witherTime: 10800 },
  strawberry:  { name: '草莓',   seedPrice: 25, sellPrice: 60, growTime: 43200, needWater: 4, needFertilizer: 2, expReward: 30, unlockLevel: 7,  harvestMin: 2, harvestMax: 5, witherTime: 7200  },
  rose:        { name: '玫瑰',   seedPrice: 30, sellPrice: 80, growTime: 57600, needWater: 4, needFertilizer: 2, expReward: 35, unlockLevel: 10, harvestMin: 1, harvestMax: 3, witherTime: 10800 },
}

/** 商店道具配置 */
const SHOP_ITEMS = {
  fertilizer_normal:   { name: '普通肥料',     price: 20, currency: 'coins',    category: 'tool', effect: '加速生长5%'    },
  fertilizer_advanced: { name: '高级肥料',     price: 50, currency: 'coins',    category: 'tool', effect: '加速生长10%'   },
  fertilizer_super:    { name: '超级肥料',     price: 5,  currency: 'diamonds', category: 'tool', effect: '加速生长20%'   },
  bug_spray:           { name: '杀虫剂',       price: 10, currency: 'coins',    category: 'tool', effect: '清除害虫'      },
  shield_24h:          { name: '保护罩(24h)',   price: 30, currency: 'diamonds', category: 'tool', effect: '防偷24小时'    },
  energy_potion:       { name: '体力药水',     price: 10, currency: 'diamonds', category: 'tool', effect: '恢复50体力'    },
}

/** 肥料 speedBoost 增量 */
const FERTILIZER_BOOST = {
  fertilizer_normal:   0.05,
  fertilizer_advanced: 0.10,
  fertilizer_super:    0.20,
}

/** 等级经验需求表 */
const LEVEL_EXP = {
  1: 100,  2: 150,  3: 220,  4: 300,  5: 400,
  6: 520,  7: 660,  8: 820,  9: 1000, 10: 1200,
  11: 1420, 12: 1660, 13: 1920, 14: 2200, 15: 2500,
  16: 2820, 17: 3160, 18: 3520, 19: 3900, 20: 4300,
  21: 4720, 22: 5160, 23: 5620, 24: 6100, 25: 6600,
  26: 7120, 27: 7660, 28: 8220, 29: 8800, 30: 9999999,
}

/** 地块解锁等级 (plotIndex → 解锁所需等级) */
const PLOT_UNLOCKS = {
  0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1,   // 前6块默认解锁
  6: 5,  7: 8,  8: 10, 9: 12,
  10: 15, 11: 15, 12: 18, 13: 18,
  14: 22, 15: 22,
}

/** 签到奖励表 (day 1-7 循环) */
const SIGN_IN_REWARDS = [
  { day: 1, coins: 10,  exp: 5,  diamonds: 0, itemId: null },
  { day: 2, coins: 20,  exp: 10, diamonds: 0, itemId: null },
  { day: 3, coins: 30,  exp: 15, diamonds: 0, itemId: null },
  { day: 4, coins: 40,  exp: 20, diamonds: 0, itemId: null },
  { day: 5, coins: 50,  exp: 25, diamonds: 1, itemId: null },
  { day: 6, coins: 60,  exp: 30, diamonds: 2, itemId: null },
  { day: 7, coins: 100, exp: 50, diamonds: 5, itemId: 'fertilizer_advanced' },
]

/** 每日任务定义 */
const DAILY_TASKS = [
  { taskId: 'd1', description: '登录游戏',     field: 'login',       target: 1, rewardCoins: 20,  rewardExp: 10, rewardDiamonds: 0 },
  { taskId: 'd2', description: '浇水3次',      field: 'water',       target: 3, rewardCoins: 15,  rewardExp: 10, rewardDiamonds: 0 },
  { taskId: 'd3', description: '收获1次',      field: 'harvest',     target: 1, rewardCoins: 10,  rewardExp: 15, rewardDiamonds: 0 },
  { taskId: 'd4', description: '访问好友农场',  field: 'visitFriend', target: 1, rewardCoins: 10,  rewardExp: 5,  rewardDiamonds: 0 },
  { taskId: 'd5', description: '帮好友浇水',    field: 'helpWater',   target: 1, rewardCoins: 10,  rewardExp: 5,  rewardDiamonds: 0 },
]

/** 周任务定义 */
const WEEKLY_TASKS = [
  { taskId: 'w1', description: '累计收获20个',  field: 'totalHarvest', target: 20, rewardCoins: 200, rewardExp: 50, rewardDiamonds: 0 },
  { taskId: 'w2', description: '连续登录7天',   field: 'loginDays',    target: 7,  rewardCoins: 100, rewardExp: 30, rewardDiamonds: 5 },
]

/** 游戏常量 */
const GAME = {
  ENERGY_RECOVERY_MS:       300000, // 每5分钟恢复1点体力
  ENERGY_PER_WATER:         2,      // 浇水消耗体力
  ENERGY_PER_FERTILIZE:     1,      // 施肥消耗体力
  MAX_STEAL_PER_FRIEND:     3,      // 每天每个好友最多偷3次
  MAX_SPEED_BOOST:          0.50,   // speedBoost 上限
  WATER_SPEED_BOOST:        0.05,   // 每次浇水加速5%
  WATER_FRIEND_REWARD_COINS: 5,
  WATER_FRIEND_REWARD_EXP:   3,
  BUG_CHANCE:               0.03,   // 定时检查时3%概率出虫
  INITIAL_COINS:            200,
  INITIAL_ENERGY:           100,
  INITIAL_ENERGY_MAX:       100,
  ENERGY_PER_LEVEL:         2,      // 每升一级体力上限+2
  DEFAULT_PLOT_COUNT:       8,      // 新用户初始地块数
}

module.exports = {
  CROP_CONFIGS,
  SHOP_ITEMS,
  FERTILIZER_BOOST,
  LEVEL_EXP,
  PLOT_UNLOCKS,
  SIGN_IN_REWARDS,
  DAILY_TASKS,
  WEEKLY_TASKS,
  GAME,
}