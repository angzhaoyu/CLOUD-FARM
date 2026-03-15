// ============================================================
// 文件：scripts/shared/Interfaces.ts
// 说明：所有数据结构定义（Interface / Enum），全局共享
// 负责人：F
// 调用方：所有人（A/B/C/D/E 均 import 使用）
// 规则：任何人不得私自修改，需要新增字段找 F
// ============================================================

/** 用户基础数据 */
export interface IUserData {
  openId: string
  nickname: string
  avatarUrl: string
  level: number
  exp: number
  coins: number
  diamonds: number
  energy: number
  energyMax: number
  signInDays: number
  lastSignInDate: string        // "2025-01-15"
  lastEnergyUpdate: number      // 时间戳
  createdAt: number
}

/** 地块数据 */
export interface IPlotData {
  plotIndex: number              // 0-15
  unlocked: boolean
  crop: ICropData | null         // null表示空地
}

/** 作物数据（种在地里的） */
export interface ICropData {
  cropId: string                 // "tomato"
  plantedAt: number              // 种植时间戳(ms)
  growTime: number               // 生长总时间(秒)
  status: CropStatus
  waterCount: number             // 已浇水次数
  fertilizerCount: number        // 已施肥次数
  hasBug: boolean
  speedBoost: number             // 加速比例 0-1
  stolenBy: string[]             // 被谁偷过(openId数组)
  protectedUntil: number | null  // 保护罩到期时间戳
}

/** 作物状态枚举 */
export enum CropStatus {
  GROWING = 'growing',
  MATURE = 'mature',
  WITHERED = 'withered'
}

/** 作物配置（静态数据，不会变） */
export interface ICropConfig {
  cropId: string
  name: string
  category: CropCategory
  seedPrice: number
  sellPrice: number
  growTime: number               // 秒
  needWater: number              // 需要浇水次数
  needFertilizer: number
  expReward: number
  unlockLevel: number
  harvestMin: number
  harvestMax: number
  witherTime: number             // 成熟后多久枯萎(秒)
  stages: ICropStage[]
}

export enum CropCategory {
  VEGETABLE = 'vegetable',
  FLOWER = 'flower',
  FRUIT = 'fruit',
  RARE = 'rare'
}

/** 作物生长阶段 */
export interface ICropStage {
  name: string                   // "种子","发芽","生长","开花","成熟"
  progress: number               // 0, 0.2, 0.5, 0.8, 1.0
  spriteFrame: string            // 对应图片资源名
}

/** 仓库物品 */
export interface IWarehouseItem {
  cropId: string
  count: number
}

/** 好友数据 */
export interface IFriendData {
  openId: string
  nickname: string
  avatarUrl: string
  level: number
  hasMatureCrop: boolean         // 是否有成熟作物（可偷标记）
}

/** 互动记录 */
export interface IInteraction {
  fromUserId: string
  fromNickname: string
  toUserId: string
  type: InteractionType
  cropId: string
  cropName: string
  count: number
  createdAt: number
}

export enum InteractionType {
  STEAL = 'steal',
  WATER = 'water',
  HELP_BUG = 'help_bug',
  GIFT = 'gift'
}

/** 排行榜条目 */
export interface IRankItem {
  rank: number
  openId: string
  nickname: string
  avatarUrl: string
  value: number                  // 排名依据的值
}

/** 商店商品 */
export interface IShopItem {
  itemId: string
  name: string
  description: string
  price: number
  currency: 'coins' | 'diamonds'
  category: 'seed' | 'tool' | 'decor'
  iconFrame: string
  effect: string                 // 效果描述
}

/** 任务数据 */
export interface ITaskData {
  taskId: string
  description: string
  target: number                 // 目标次数
  current: number                // 当前进度
  rewardCoins: number
  rewardExp: number
  rewardDiamonds: number
  claimed: boolean               // 是否已领取
}

/** 签到奖励 */
export interface ISignInReward {
  day: number
  coins: number
  exp: number
  diamonds: number
  itemId: string | null
}

// ============================================================
// 所有云函数的返回值类型
// ============================================================

/** 通用返回结构 */
export interface IApiResult<T = any> {
  code: number                   // 0=成功，非0=失败
  msg: string
  data?: T
}

/** login 返回 */
export interface ILoginResult {
  user: IUserData
  plots: IPlotData[]
  warehouse: IWarehouseItem[]
  isNewUser: boolean
}

/** plant 返回 */
export interface IPlantResult {
  plotIndex: number
  crop: ICropData
  newCoins: number
}

/** water 返回 */
export interface IWaterResult {
  plotIndex: number
  newEnergy: number
  newWaterCount: number
  newSpeedBoost: number
}

/** harvest 返回 */
export interface IHarvestResult {
  cropId: string
  cropName: string
  count: number
  expGained: number
  newExp: number
  newLevel: number
  leveledUp: boolean
}

/** steal 返回 */
export interface IStealResult {
  cropId: string
  cropName: string
  count: number
}

/** sell 返回 */
export interface ISellResult {
  cropId: string
  count: number
  coinsGained: number
  newCoins: number
}

/** buyItem 返回 */
export interface IBuyResult {
  itemId: string
  newCoins: number
  newDiamonds: number
}

/** signIn 返回 */
export interface ISignInResult {
  day: number
  reward: ISignInReward
  newCoins: number
  newExp: number
}

/** getRanking 返回 */
export interface IRankingResult {
  list: IRankItem[]
  myRank: number
  myValue: number
}

/** getFriendFarm 返回 */
export interface IFriendFarmResult {
  userId: string
  nickname: string
  avatarUrl: string
  level: number
  plots: IPlotData[]
}

/** waterFriend 返回 */
export interface IWaterFriendResult {
  rewardCoins: number
  rewardExp: number
  newEnergy: number
}

/** getInteractions 返回 */
export interface IInteractionsResult {
  list: IInteraction[]
}

/** getTaskStatus 返回 */
export interface ITaskStatusResult {
  dailyTasks: ITaskData[]
  weeklyTasks: ITaskData[]
  allDailyDone: boolean
}

/** claimTask 返回 */
export interface IClaimTaskResult {
  newCoins: number
  newExp: number
  newDiamonds: number
  newLevel: number
  leveledUp: boolean
}
