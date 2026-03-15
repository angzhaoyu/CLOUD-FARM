// ============================================================
// 文件：scripts/shared/GameEvents.ts
// 说明：所有模块间通信的事件名称常量
// 负责人：F
// 调用方：A/B/C（发出和监听事件时引用）
// 规则：不可私自新增事件，需要新增联系 F
// ============================================================

export const GameEvents = {

  // ======== A 发出的事件 ========
  /** 玩家点击了空地块，请求弹出种子选择 */
  PLOT_EMPTY_CLICKED: 'PLOT_EMPTY_CLICKED',
  // 携带数据：{ plotIndex: number }

  /** 玩家点击了有作物的地块，请求显示作物详情 */
  PLOT_CROP_CLICKED: 'PLOT_CROP_CLICKED',
  // 携带数据：{ plotIndex: number, crop: ICropData }

  /** 种植完成 */
  CROP_PLANTED: 'CROP_PLANTED',
  // 携带数据：{ plotIndex: number, cropId: string }

  /** 浇水完成 */
  CROP_WATERED: 'CROP_WATERED',
  // 携带数据：{ plotIndex: number, newEnergy: number }

  /** 施肥完成 */
  CROP_FERTILIZED: 'CROP_FERTILIZED',
  // 携带数据：{ plotIndex: number }

  /** 作物成熟（定时检测到的） */
  CROP_MATURED: 'CROP_MATURED',
  // 携带数据：{ plotIndex: number, cropId: string }

  /** 收获完成 */
  CROP_HARVESTED: 'CROP_HARVESTED',
  // 携带数据：IHarvestResult

  /** 作物枯萎 */
  CROP_WITHERED: 'CROP_WITHERED',
  // 携带数据：{ plotIndex: number }

  /** 出现虫子 */
  BUG_APPEARED: 'BUG_APPEARED',
  // 携带数据：{ plotIndex: number }

  /** 除虫完成 */
  BUG_REMOVED: 'BUG_REMOVED',
  // 携带数据：{ plotIndex: number }

  // ======== B 发出的事件 ========
  /** 偷菜成功 */
  STEAL_SUCCESS: 'STEAL_SUCCESS',
  // 携带数据：IStealResult

  /** 偷菜失败 */
  STEAL_FAILED: 'STEAL_FAILED',
  // 携带数据：{ msg: string }

  /** 帮好友浇水完成 */
  FRIEND_WATERED: 'FRIEND_WATERED',
  // 携带数据：IWaterFriendResult

  /** 请求进入好友农场场景 */
  ENTER_FRIEND_FARM: 'ENTER_FRIEND_FARM',
  // 携带数据：{ friendId: string }

  /** 从好友农场返回自己农场 */
  LEAVE_FRIEND_FARM: 'LEAVE_FRIEND_FARM',
  // 携带数据：无

  // ======== C 发出的事件 ========
  /** 用户在种子选择框中选了一个种子 */
  SEED_SELECTED: 'SEED_SELECTED',
  // 携带数据：{ plotIndex: number, cropId: string }

  /** 用户在商店买了东西 */
  ITEM_BOUGHT: 'ITEM_BOUGHT',
  // 携带数据：IBuyResult

  /** 用户卖出了作物 */
  CROP_SOLD: 'CROP_SOLD',
  // 携带数据：ISellResult

  /** 底部Tab切换 */
  NAV_TAB_CHANGED: 'NAV_TAB_CHANGED',
  // 携带数据：{ tab: 'farm' | 'friends' | 'shop' | 'bag' | 'me' }

  /** 签到完成 */
  SIGNED_IN: 'SIGNED_IN',
  // 携带数据：ISignInResult

  /** 任务奖励领取完成 */
  TASK_CLAIMED: 'TASK_CLAIMED',
  // 携带数据：IClaimTaskResult

  // ======== 通用数据变化事件 ========
  /** 金币数量变化 */
  COINS_CHANGED: 'COINS_CHANGED',
  // 携带数据：{ coins: number, delta: number }

  /** 钻石数量变化 */
  DIAMONDS_CHANGED: 'DIAMONDS_CHANGED',
  // 携带数据：{ diamonds: number, delta: number }

  /** 体力数量变化 */
  ENERGY_CHANGED: 'ENERGY_CHANGED',
  // 携带数据：{ energy: number, energyMax: number }

  /** 经验变化 */
  EXP_CHANGED: 'EXP_CHANGED',
  // 携带数据：{ exp: number, level: number }

  /** 升级 */
  LEVEL_UP: 'LEVEL_UP',
  // 携带数据：{ newLevel: number, unlockedContent: string[] }

  /** 仓库变化 */
  WAREHOUSE_CHANGED: 'WAREHOUSE_CHANGED',
  // 携带数据：{ warehouse: IWarehouseItem[] }

  // ======== 系统事件 ========
  /** 登录成功，数据加载完毕 */
  GAME_DATA_READY: 'GAME_DATA_READY',
  // 携带数据：无（数据已写入 UserModel）

  /** API调用出错 */
  API_ERROR: 'API_ERROR',
  // 携带数据：{ code: number, msg: string }
}
