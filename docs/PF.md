# 📄 文档0：公共规范（所有人必读）

> **每个人开发前先通读此文档，这是所有人代码能合在一起的基础**

---

## 0.1 项目技术栈

```
游戏引擎：Cocos Creator 3.8.x
开发语言：TypeScript（严格模式）
后端服务：微信云开发（云函数 + 云数据库 + 云存储）
版本管理：Git
包管理：npm（Cocos Creator 自带）
```

## 0.2 开发环境搭建（每个人都要做）

```
1. 安装 Cocos Creator 3.8（https://www.cocos.com/creator-download）
2. 安装微信开发者工具（https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html）
3. 安装 VS Code + 插件：
   - Cocos Creator 插件
   - ESLint
   - Prettier
4. 安装 Git
5. 克隆项目仓库：git clone [仓库地址]
6. 用 Cocos Creator 打开项目
7. 构建目标选择"微信小游戏"，在微信开发者工具中预览
```

## 0.3 目录结构（不可改动）

```
cloud-farm/
│
├── assets/
│   ├── resources/                    # E 放美术资源
│   │   ├── crops/                    # 作物图
│   │   ├── ui/                       # UI图
│   │   ├── farm/                     # 农场场景图
│   │   ├── effects/                  # 特效图
│   │   └── audio/                    # 音效
│   ├── scenes/                       # 场景文件
│   │   ├── Launch.scene              # C 负责
│   │   ├── Farm.scene                # A 负责
│   │   ├── FriendFarm.scene          # B 负责
│   │   └── Shop.scene                # C 负责
│   └── prefabs/                      # 预制体
│       ├── farm/                     # A 负责
│       ├── social/                   # B 负责
│       └── ui/                       # C 负责
│
├── scripts/
│   ├── shared/                       # F 负责，所有人只读不改
│   │   ├── EventManager.ts
│   │   ├── GameEvents.ts
│   │   ├── CloudAPI.ts
│   │   ├── UserModel.ts
│   │   ├── MockData.ts
│   │   ├── Timer.ts
│   │   └── Utils.ts
│   ├── config/                       # F 负责
│   │   ├── CropConfig.ts
│   │   ├── LevelConfig.ts
│   │   ├── ShopConfig.ts
│   │   └── TaskConfig.ts
│   ├── farm/                         # A 负责，只有A改这里
│   ├── social/                       # B 负责，只有B改这里
│   └── ui/                           # C 负责，只有C改这里
│
├── cloud/                            # D 负责
│   ├── login/
│   ├── getMyFarm/
│   ├── plant/
│   ├── water/
│   ├── fertilize/
│   ├── harvest/
│   ├── steal/
│   ├── waterFriend/
│   ├── sell/
│   ├── buyItem/
│   ├── signIn/
│   ├── getTaskStatus/
│   ├── claimTask/
│   ├── getFriendFarm/
│   ├── getRanking/
│   ├── getInteractions/
│   └── checkWither/
│
└── docs/                             # 本文档目录
```

**规则：每人只修改自己负责的目录，不动别人的文件。需要修改 `shared/` 联系 F。**

## 0.4 公共接口定义（所有人必须严格遵守）

### 0.4.1 数据接口（TypeScript Interface）

```typescript
// ============================================================
// 文件：scripts/shared/Interfaces.ts
// 说明：所有数据结构定义，所有人 import 此文件使用
// 维护人：F
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
```

### 0.4.2 事件系统

```typescript
// ============================================================
// 文件：scripts/shared/GameEvents.ts
// 说明：所有模块间通信的事件名称，不可私自新增
// 维护人：F
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
```

### 0.4.3 事件管理器

```typescript
// ============================================================
// 文件：scripts/shared/EventManager.ts
// 说明：事件总线，模块间唯一的通信方式
// 维护人：F
// 使用方法见下方示例
// ============================================================

type EventCallback = (data?: any) => void

export class EventManager {
  private static _handlers: Map<string, EventCallback[]> = new Map()

  /**
   * 监听事件
   * @param eventName 事件名，必须使用 GameEvents 中定义的常量
   * @param callback  回调函数
   * @param target    可选，用于 off 时识别
   *
   * 示例：
   *   EventManager.on(GameEvents.CROP_HARVESTED, this.onCropHarvested, this)
   */
  static on(eventName: string, callback: EventCallback, target?: any): void {
    if (!this._handlers.has(eventName)) {
      this._handlers.set(eventName, [])
    }
    const cb = target ? callback.bind(target) : callback
    ;(cb as any).__target = target
    ;(cb as any).__original = callback
    this._handlers.get(eventName)!.push(cb)
  }

  /**
   * 取消监听
   * @param eventName 事件名
   * @param callback  注册时传的同一个函数引用
   * @param target    注册时传的同一个 target
   *
   * 示例：
   *   EventManager.off(GameEvents.CROP_HARVESTED, this.onCropHarvested, this)
   */
  static off(eventName: string, callback: EventCallback, target?: any): void {
    const list = this._handlers.get(eventName)
    if (!list) return
    for (let i = list.length - 1; i >= 0; i--) {
      const cb = list[i] as any
      if (cb.__original === callback && cb.__target === target) {
        list.splice(i, 1)
      }
    }
  }

  /**
   * 发送事件
   * @param eventName 事件名
   * @param data      携带的数据（类型见 GameEvents.ts 中的注释）
   *
   * 示例：
   *   EventManager.emit(GameEvents.CROP_HARVESTED, {
   *     cropId: 'tomato', cropName: '番茄', count: 3, expGained: 20,
   *     newExp: 870, newLevel: 8, leveledUp: false
   *   })
   */
  static emit(eventName: string, data?: any): void {
    console.log(`[Event] ${eventName}`, data || '')
    const list = this._handlers.get(eventName)
    if (!list) return
    // 复制一份防止回调中修改列表
    const copy = [...list]
    for (const cb of copy) {
      try {
        cb(data)
      } catch (e) {
        console.error(`[Event] Error in handler for ${eventName}:`, e)
      }
    }
  }

  /** 清除所有事件监听（场景切换时调用） */
  static clear(): void {
    this._handlers.clear()
  }
}
```

### 0.4.4 用户数据模型

```typescript
// ============================================================
// 文件：scripts/shared/UserModel.ts
// 说明：全局唯一用户数据，所有模块读取此处数据
// 维护人：F
// 规则：
//   - 读数据：任何模块可以直接读 UserModel.xxx
//   - 写数据：必须通过 UserModel 提供的方法，不可直接赋值
//   - 写入时会自动发出对应的事件
// ============================================================

import { EventManager } from './EventManager'
import { GameEvents } from './GameEvents'
import {
  IUserData, IPlotData, IWarehouseItem,
  ICropData, CropStatus, ILoginResult
} from './Interfaces'
import { LevelConfig } from '../config/LevelConfig'

export class UserModel {

  // -------- 用户基础数据 --------
  private static _user: IUserData | null = null
  private static _plots: IPlotData[] = []
  private static _warehouse: IWarehouseItem[] = []

  /** 获取用户数据（只读） */
  static get user(): IUserData { return this._user! }
  static get plots(): IPlotData[] { return this._plots }
  static get warehouse(): IWarehouseItem[] { return this._warehouse }

  // 快捷读取
  static get openId(): string { return this._user?.openId || '' }
  static get nickname(): string { return this._user?.nickname || '' }
  static get level(): number { return this._user?.level || 1 }
  static get exp(): number { return this._user?.exp || 0 }
  static get coins(): number { return this._user?.coins || 0 }
  static get diamonds(): number { return this._user?.diamonds || 0 }
  static get energy(): number { return this._user?.energy || 0 }
  static get energyMax(): number { return this._user?.energyMax || 100 }

  /**
   * 初始化用户数据（登录成功后调用，仅由 CloudAPI.login 内部调用）
   */
  static init(loginResult: ILoginResult): void {
    this._user = loginResult.user
    this._plots = loginResult.plots
    this._warehouse = loginResult.warehouse
    EventManager.emit(GameEvents.GAME_DATA_READY)
  }

  // -------- 修改金币 --------
  /**
   * 增加/减少金币
   * @param delta 正数=增加，负数=减少
   */
  static changeCoins(delta: number): void {
    this._user!.coins += delta
    EventManager.emit(GameEvents.COINS_CHANGED, {
      coins: this._user!.coins,
      delta: delta
    })
  }

  // -------- 修改钻石 --------
  static changeDiamonds(delta: number): void {
    this._user!.diamonds += delta
    EventManager.emit(GameEvents.DIAMONDS_CHANGED, {
      diamonds: this._user!.diamonds,
      delta: delta
    })
  }

  // -------- 修改体力 --------
  static changeEnergy(delta: number): void {
    this._user!.energy = Math.max(0,
      Math.min(this._user!.energy + delta, this._user!.energyMax)
    )
    EventManager.emit(GameEvents.ENERGY_CHANGED, {
      energy: this._user!.energy,
      energyMax: this._user!.energyMax
    })
  }

  // -------- 修改经验/等级 --------
  static addExp(amount: number): void {
    this._user!.exp += amount
    const needed = LevelConfig.getExpForLevel(this._user!.level)
    let leveledUp = false
    while (this._user!.exp >= needed && this._user!.level < 30) {
      this._user!.exp -= needed
      this._user!.level++
      this._user!.energyMax += 2
      leveledUp = true
    }
    EventManager.emit(GameEvents.EXP_CHANGED, {
      exp: this._user!.exp,
      level: this._user!.level
    })
    if (leveledUp) {
      EventManager.emit(GameEvents.LEVEL_UP, {
        newLevel: this._user!.level,
        unlockedContent: LevelConfig.getUnlocks(this._user!.level)
      })
    }
  }

  // -------- 地块操作 --------
  /** 获取指定地块 */
  static getPlot(plotIndex: number): IPlotData | null {
    return this._plots.find(p => p.plotIndex === plotIndex) || null
  }

  /** 更新地块的作物数据 */
  static updatePlotCrop(plotIndex: number, crop: ICropData | null): void {
    const plot = this._plots.find(p => p.plotIndex === plotIndex)
    if (plot) {
      plot.crop = crop
    }
  }

  // -------- 仓库操作 --------
  /** 向仓库添加作物 */
  static addToWarehouse(cropId: string, count: number): void {
    const existing = this._warehouse.find(w => w.cropId === cropId)
    if (existing) {
      existing.count += count
    } else {
      this._warehouse.push({ cropId, count })
    }
    EventManager.emit(GameEvents.WAREHOUSE_CHANGED, {
      warehouse: this._warehouse
    })
  }

  /** 从仓库移除作物 */
  static removeFromWarehouse(cropId: string, count: number): boolean {
    const existing = this._warehouse.find(w => w.cropId === cropId)
    if (!existing || existing.count < count) return false
    existing.count -= count
    if (existing.count <= 0) {
      this._warehouse = this._warehouse.filter(w => w.cropId !== cropId)
    }
    EventManager.emit(GameEvents.WAREHOUSE_CHANGED, {
      warehouse: this._warehouse
    })
    return true
  }

  /** 获取仓库中某作物数量 */
  static getWarehouseCount(cropId: string): number {
    const item = this._warehouse.find(w => w.cropId === cropId)
    return item ? item.count : 0
  }

  /** 获取仓库总物品数量 */
  static get warehouseTotalCount(): number {
    return this._warehouse.reduce((sum, item) => sum + item.count, 0)
  }
}
```

### 0.4.5 CloudAPI 封装

```typescript
// ============================================================
// 文件：scripts/shared/CloudAPI.ts
// 说明：所有云函数调用的统一入口
// 维护人：F
// 规则：
//   - A/B/C 调用此文件的方法与后端通信
//   - USE_MOCK = true 时使用假数据，不依赖 D 的后端
//   - 联调时 F 将 USE_MOCK 改为 false
// ============================================================

import { MockData } from './MockData'
import { UserModel } from './UserModel'
import { EventManager } from './EventManager'
import { GameEvents } from './GameEvents'
import {
  IApiResult, ILoginResult, IPlantResult,
  IWaterResult, IHarvestResult, IStealResult,
  ISellResult, IBuyResult, ISignInResult,
  IRankingResult, IFriendFarmResult, IWaterFriendResult,
  IInteractionsResult, ITaskStatusResult, IClaimTaskResult,
  IFriendData
} from './Interfaces'

// 🔴 开发阶段 = true（用假数据）
// 🟢 联调阶段 = false（用真实后端）
const USE_MOCK = true

export class CloudAPI {

  /** 初始化云开发（游戏启动时调用一次） */
  static initCloud(): void {
    if (!USE_MOCK) {
      wx.cloud.init({
        env: 'cloud-farm-xxx',    // 替换为实际环境ID
        traceUser: true
      })
    }
  }

  // ================================================================
  //  登录 & 数据加载
  // ================================================================

  /**
   * 登录并获取用户全部数据
   * 调用方：C（Launch场景）
   * 返回后自动写入 UserModel
   */
  static async login(): Promise<ILoginResult> {
    const result = await this._call<ILoginResult>('login', {})
    UserModel.init(result)
    return result
  }

  /**
   * 刷新农场数据
   * 调用方：A（从好友农场返回时）
   */
  static async refreshMyFarm(): Promise<ILoginResult> {
    const result = await this._call<ILoginResult>('getMyFarm', {})
    UserModel.init(result)
    return result
  }

  // ================================================================
  //  农场操作（A 调用）
  // ================================================================

  /**
   * 种植
   * @param plotIndex 地块编号 0-15
   * @param cropId    作物ID，如 "tomato"
   */
  static async plant(plotIndex: number, cropId: string): Promise<IPlantResult> {
    const result = await this._call<IPlantResult>('plant', { plotIndex, cropId })
    // 更新本地数据
    UserModel.updatePlotCrop(plotIndex, result.crop)
    UserModel.changeCoins(-(UserModel.coins - result.newCoins))
    return result
  }

  /**
   * 给自己的作物浇水
   * @param plotIndex 地块编号
   */
  static async water(plotIndex: number): Promise<IWaterResult> {
    const result = await this._call<IWaterResult>('water', { plotIndex })
    // 更新本地数据
    const plot = UserModel.getPlot(plotIndex)
    if (plot && plot.crop) {
      plot.crop.waterCount = result.newWaterCount
      plot.crop.speedBoost = result.newSpeedBoost
    }
    UserModel.changeEnergy(-(UserModel.energy - result.newEnergy))
    return result
  }

  /**
   * 给自己的作物施肥
   * @param plotIndex 地块编号
   * @param fertilizerType 肥料类型 "normal" | "advanced" | "super"
   */
  static async fertilize(
    plotIndex: number,
    fertilizerType: string
  ): Promise<IWaterResult> {
    return this._call<IWaterResult>('fertilize', { plotIndex, fertilizerType })
  }

  /**
   * 收获
   * @param plotIndex 地块编号
   */
  static async harvest(plotIndex: number): Promise<IHarvestResult> {
    const result = await this._call<IHarvestResult>('harvest', { plotIndex })
    // 更新本地数据
    UserModel.updatePlotCrop(plotIndex, null) // 清空地块
    UserModel.addToWarehouse(result.cropId, result.count)
    UserModel.addExp(result.expGained)
    return result
  }

  // ================================================================
  //  社交操作（B 调用）
  // ================================================================

  /**
   * 获取好友列表
   */
  static async getFriends(): Promise<IFriendData[]> {
    return this._call<IFriendData[]>('getFriends', {})
  }

  /**
   * 获取好友农场数据
   * @param friendId 好友的 openId
   */
  static async getFriendFarm(friendId: string): Promise<IFriendFarmResult> {
    return this._call<IFriendFarmResult>('getFriendFarm', { friendId })
  }

  /**
   * 偷菜
   * @param targetUserId 目标用户 openId
   * @param plotIndex    目标地块编号
   */
  static async steal(
    targetUserId: string,
    plotIndex: number
  ): Promise<IStealResult> {
    const result = await this._call<IStealResult>('steal', {
      targetUserId, plotIndex
    })
    // 偷到的放入自己仓库
    UserModel.addToWarehouse(result.cropId, result.count)
    return result
  }

  /**
   * 帮好友浇水
   * @param friendId  好友 openId
   * @param plotIndex 好友的地块编号
   */
  static async waterFriend(
    friendId: string,
    plotIndex: number
  ): Promise<IWaterFriendResult> {
    const result = await this._call<IWaterFriendResult>('waterFriend', {
      friendId, plotIndex
    })
    UserModel.changeCoins(result.rewardCoins)
    UserModel.addExp(result.rewardExp)
    UserModel.changeEnergy(-(UserModel.energy - result.newEnergy))
    return result
  }

  /**
   * 获取互动记录（被偷/被浇水）
   */
  static async getInteractions(): Promise<IInteractionsResult> {
    return this._call<IInteractionsResult>('getInteractions', {})
  }

  /**
   * 获取排行榜
   * @param type 排行类型 "harvest" | "level" | "steal"
   */
  static async getRanking(
    type: 'harvest' | 'level' | 'steal'
  ): Promise<IRankingResult> {
    return this._call<IRankingResult>('getRanking', { type })
  }

  // ================================================================
  //  商店 & 仓库（C 调用）
  // ================================================================

  /**
   * 购买商品
   * @param itemId 商品ID
   * @param count  购买数量
   */
  static async buyItem(itemId: string, count: number): Promise<IBuyResult> {
    const result = await this._call<IBuyResult>('buyItem', { itemId, count })
    // 更新本地数据
    UserModel.changeCoins(-(UserModel.coins - result.newCoins))
    UserModel.changeDiamonds(-(UserModel.diamonds - result.newDiamonds))
    return result
  }

  /**
   * 卖出作物
   * @param cropId 作物ID
   * @param count  卖出数量
   */
  static async sell(cropId: string, count: number): Promise<ISellResult> {
    const result = await this._call<ISellResult>('sell', { cropId, count })
    UserModel.removeFromWarehouse(cropId, count)
    UserModel.changeCoins(result.coinsGained)
    return result
  }

  /**
   * 签到
   */
  static async signIn(): Promise<ISignInResult> {
    const result = await this._call<ISignInResult>('signIn', {})
    UserModel.changeCoins(result.reward.coins)
    UserModel.addExp(result.reward.exp)
    if (result.reward.diamonds > 0) {
      UserModel.changeDiamonds(result.reward.diamonds)
    }
    return result
  }

  /**
   * 获取任务状态
   */
  static async getTaskStatus(): Promise<ITaskStatusResult> {
    return this._call<ITaskStatusResult>('getTaskStatus', {})
  }

  /**
   * 领取任务奖励
   * @param taskId 任务ID
   */
  static async claimTask(taskId: string): Promise<IClaimTaskResult> {
    const result = await this._call<IClaimTaskResult>('claimTask', { taskId })
    UserModel.changeCoins(result.newCoins - UserModel.coins)
    UserModel.addExp(result.newExp - UserModel.exp)
    return result
  }

  // ================================================================
  //  内部方法
  // ================================================================

  private static async _call<T>(name: string, data: any): Promise<T> {
    if (USE_MOCK) {
      return this._mockCall<T>(name, data)
    }
    try {
      const res = await wx.cloud.callFunction({ name, data })
      const result = res.result as IApiResult<T>
      if (result.code !== 0) {
        EventManager.emit(GameEvents.API_ERROR, {
          code: result.code,
          msg: result.msg
        })
        throw new Error(result.msg)
      }
      return result.data!
    } catch (err) {
      console.error(`[CloudAPI] ${name} 失败:`, err)
      throw err
    }
  }

  private static async _mockCall<T>(name: string, data: any): Promise<T> {
    // 模拟200-500ms网络延迟
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const mockResult = MockData.getResponse(name, data)
    console.log(`[MockAPI] ${name}`, data, '→', mockResult)
    return JSON.parse(JSON.stringify(mockResult)) as T
  }
}
```

### 0.4.6 MockData（假数据）

```typescript
// ============================================================
// 文件：scripts/shared/MockData.ts
// 说明：开发阶段的假数据，让前端不依赖后端就能自测
// 维护人：F
// ============================================================

import {
  ILoginResult, IPlantResult, IWaterResult,
  IHarvestResult, IStealResult, ISellResult,
  IBuyResult, ISignInResult, IRankingResult,
  IFriendFarmResult, IWaterFriendResult,
  IInteractionsResult, IFriendData,
  ITaskStatusResult, IClaimTaskResult,
  CropStatus, InteractionType, ICropData
} from './Interfaces'
import { CropConfig } from '../config/CropConfig'

export class MockData {

  /**
   * 根据云函数名称返回模拟数据
   * A/B/C 不需要关心此函数内部实现
   * 只要 CloudAPI 返回的格式正确即可
   */
  static getResponse(funcName: string, params: any): any {
    switch (funcName) {
      case 'login':
      case 'getMyFarm':
        return this._loginResult()
      case 'plant':
        return this._plantResult(params)
      case 'water':
        return this._waterResult(params)
      case 'harvest':
        return this._harvestResult(params)
      case 'steal':
        return this._stealResult(params)
      case 'sell':
        return this._sellResult(params)
      case 'buyItem':
        return this._buyResult(params)
      case 'signIn':
        return this._signInResult()
      case 'getFriends':
        return this._friendsList()
      case 'getFriendFarm':
        return this._friendFarm(params)
      case 'waterFriend':
        return this._waterFriendResult()
      case 'getRanking':
        return this._rankingResult()
      case 'getInteractions':
        return this._interactionsResult()
      case 'getTaskStatus':
        return this._taskStatusResult()
      case 'claimTask':
        return this._claimTaskResult()
      default:
        return { code: 0, msg: 'mock ok' }
    }
  }

  private static _loginResult(): ILoginResult {
    return {
      user: {
        openId: 'mock_user_001',
        nickname: '测试玩家',
        avatarUrl: '',
        level: 8,
        exp: 850,
        coins: 3280,
        diamonds: 50,
        energy: 80,
        energyMax: 116,
        signInDays: 3,
        lastSignInDate: '2025-01-14',
        lastEnergyUpdate: Date.now(),
        createdAt: Date.now() - 86400000 * 30
      },
      plots: [
        {
          plotIndex: 0, unlocked: true,
          crop: {
            cropId: 'lettuce',
            plantedAt: Date.now() - 5400000,
            growTime: 10800,
            status: CropStatus.GROWING,
            waterCount: 1, fertilizerCount: 0,
            hasBug: false, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        {
          plotIndex: 1, unlocked: true,
          crop: {
            cropId: 'tomato',
            plantedAt: Date.now() - 30000000,
            growTime: 28800,
            status: CropStatus.MATURE,
            waterCount: 3, fertilizerCount: 1,
            hasBug: false, speedBoost: 0.15,
            stolenBy: [], protectedUntil: null
          }
        },
        { plotIndex: 2, unlocked: true, crop: null },
        { plotIndex: 3, unlocked: true, crop: null },
        { plotIndex: 4, unlocked: true, crop: null },
        { plotIndex: 5, unlocked: true, crop: null },
        { plotIndex: 6, unlocked: true, crop: null },
        { plotIndex: 7, unlocked: false, crop: null },
      ],
      warehouse: [
        { cropId: 'lettuce', count: 12 },
        { cropId: 'tomato', count: 5 },
        { cropId: 'sunflower', count: 3 }
      ],
      isNewUser: false
    }
  }

  private static _plantResult(p: any): IPlantResult {
    const cfg = CropConfig.get(p.cropId)
    return {
      plotIndex: p.plotIndex,
      crop: {
        cropId: p.cropId,
        plantedAt: Date.now(),
        growTime: cfg.growTime,
        status: CropStatus.GROWING,
        waterCount: 0, fertilizerCount: 0,
        hasBug: false, speedBoost: 0,
        stolenBy: [], protectedUntil: null
      },
      newCoins: 3280 - cfg.seedPrice
    }
  }

  private static _waterResult(p: any): IWaterResult {
    return {
      plotIndex: p.plotIndex,
      newEnergy: 78,
      newWaterCount: 2,
      newSpeedBoost: 0.05
    }
  }

  private static _harvestResult(p: any): IHarvestResult {
    return {
      cropId: 'tomato',
      cropName: '番茄',
      count: 3,
      expGained: 20,
      newExp: 870,
      newLevel: 8,
      leveledUp: false
    }
  }

  private static _stealResult(p: any): IStealResult {
    return {
      cropId: 'strawberry',
      cropName: '草莓',
      count: 1
    }
  }

  private static _sellResult(p: any): ISellResult {
    const cfg = CropConfig.get(p.cropId)
    const total = cfg.sellPrice * p.count
    return {
      cropId: p.cropId,
      count: p.count,
      coinsGained: total,
      newCoins: 3280 + total
    }
  }

  private static _buyResult(p: any): IBuyResult {
    return {
      itemId: p.itemId,
      newCoins: 3180,
      newDiamonds: 50
    }
  }

  private static _signInResult(): ISignInResult {
    return {
      day: 4,
      reward: { day: 4, coins: 40, exp: 20, diamonds: 0, itemId: null },
      newCoins: 3320,
      newExp: 870
    }
  }

  private static _friendsList(): IFriendData[] {
    return [
      { openId: 'f001', nickname: '小红', avatarUrl: '', level: 10, hasMatureCrop: true },
      { openId: 'f002', nickname: '大明', avatarUrl: '', level: 6, hasMatureCrop: false },
      { openId: 'f003', nickname: '阿花', avatarUrl: '', level: 15, hasMatureCrop: true },
      { openId: 'f004', nickname: '老王', avatarUrl: '', level: 12, hasMatureCrop: false },
      { openId: 'f005', nickname: '小李', avatarUrl: '', level: 3, hasMatureCrop: true },
    ]
  }

  private static _friendFarm(p: any): IFriendFarmResult {
    return {
      userId: p.friendId,
      nickname: '小红',
      avatarUrl: '',
      level: 10,
      plots: [
        {
          plotIndex: 0, unlocked: true,
          crop: {
            cropId: 'strawberry',
            plantedAt: Date.now() - 50000000,
            growTime: 43200,
            status: CropStatus.MATURE,
            waterCount: 3, fertilizerCount: 2,
            hasBug: false, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        {
          plotIndex: 1, unlocked: true,
          crop: {
            cropId: 'tomato',
            plantedAt: Date.now() - 10000000,
            growTime: 28800,
            status: CropStatus.GROWING,
            waterCount: 1, fertilizerCount: 0,
            hasBug: true, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        { plotIndex: 2, unlocked: true, crop: null },
        { plotIndex: 3, unlocked: true, crop: null },
        {
          plotIndex: 4, unlocked: true,
          crop: {
            cropId: 'rose',
            plantedAt: Date.now() - 60000000,
            growTime: 57600,
            status: CropStatus.MATURE,
            waterCount: 4, fertilizerCount: 2,
            hasBug: false, speedBoost: 0.15,
            stolenBy: ['mock_user_001'], protectedUntil: null
          }
        },
        { plotIndex: 5, unlocked: true, crop: null },
      ]
    }
  }

  private static _waterFriendResult(): IWaterFriendResult {
    return { rewardCoins: 5, rewardExp: 3, newEnergy: 76 }
  }

  private static _rankingResult(): IRankingResult {
    return {
      list: [
        { rank: 1, openId: 'r001', nickname: '农场大亨', avatarUrl: '', value: 1520 },
        { rank: 2, openId: 'f003', nickname: '阿花', avatarUrl: '', value: 960 },
        { rank: 3, openId: 'f001', nickname: '小红', avatarUrl: '', value: 860 },
        { rank: 4, openId: 'mock_user_001', nickname: '测试玩家', avatarUrl: '', value: 350 },
        { rank: 5, openId: 'f002', nickname: '大明', avatarUrl: '', value: 220 },
      ],
      myRank: 4,
      myValue: 350
    }
  }

  private static _interactionsResult(): IInteractionsResult {
    return {
      list: [
        {
          fromUserId: 'f001', fromNickname: '小红',
          toUserId: 'mock_user_001',
          type: InteractionType.STEAL,
          cropId: 'tomato', cropName: '番茄', count: 1,
          createdAt: Date.now() - 600000
        },
        {
          fromUserId: 'f002', fromNickname: '大明',
          toUserId: 'mock_user_001',
          type: InteractionType.WATER,
          cropId: '', cropName: '', count: 0,
          createdAt: Date.now() - 3600000
        },
      ]
    }
  }

  private static _taskStatusResult(): ITaskStatusResult {
    return {
      dailyTasks: [
        { taskId: 'd1', description: '登录游戏', target: 1, current: 1, rewardCoins: 20, rewardExp: 10, rewardDiamonds: 0, claimed: false },
        { taskId: 'd2', description: '浇水3次', target: 3, current: 1, rewardCoins: 15, rewardExp: 10, rewardDiamonds: 0, claimed: false },
        { taskId: 'd3', description: '收获1次', target: 1, current: 0, rewardCoins: 10, rewardExp: 15, rewardDiamonds: 0, claimed: false },
        { taskId: 'd4', description: '访问好友农场', target: 1, current: 0, rewardCoins: 10, rewardExp: 5, rewardDiamonds: 0, claimed: false },
        { taskId: 'd5', description: '帮好友浇水', target: 1, current: 0, rewardCoins: 10, rewardExp: 5, rewardDiamonds: 0, claimed: false },
      ],
      weeklyTasks: [
        { taskId: 'w1', description: '累计收获20个', target: 20, current: 8, rewardCoins: 200, rewardExp: 50, rewardDiamonds: 0, claimed: false },
        { taskId: 'w2', description: '连续登录7天', target: 7, current: 3, rewardCoins: 100, rewardExp: 30, rewardDiamonds: 5, claimed: false },
      ],
      allDailyDone: false
    }
  }

  private static _claimTaskResult(): IClaimTaskResult {
    return {
      newCoins: 3300,
      newExp: 860,
      newDiamonds: 50,
      newLevel: 8,
      leveledUp: false
    }
  }
}
```

### 0.4.7 工具函数

```typescript
// ============================================================
// 文件：scripts/shared/Utils.ts
// 说明：通用工具函数
// 维护人：F
// ============================================================

export class Utils {

  /**
   * 格式化秒数为可读时间
   * @param seconds 秒数
   * @returns "2时30分" / "45分" / "已成熟"
   *
   * 示例：
   *   Utils.formatTime(9000)  → "2时30分"
   *   Utils.formatTime(300)   → "5分"
   *   Utils.formatTime(0)     → "已成熟"
   */
  static formatTime(seconds: number): string {
    if (seconds <= 0) return '已成熟'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}时${m}分`
    return `${m}分`
  }

  /**
   * 格式化时间戳为"多久前"
   * @param timestamp 毫秒时间戳
   * @returns "刚刚" / "5分钟前" / "2小时前" / "昨天"
   */
  static formatTimeAgo(timestamp: number): string {
    const diff = (Date.now() - timestamp) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  /**
   * 格式化数字，超过10000显示为"1.5万"
   */
  static formatNumber(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万'
    return n.toString()
  }

  /**
   * 随机整数 [min, max]（含两端）
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * 深拷贝
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }
}
```

### 0.4.8 配置数据（示例）

```typescript
// ============================================================
// 文件：scripts/config/CropConfig.ts
// 说明：所有作物的静态配置
// 维护人：F
// A/B/C/D 通过 CropConfig.get("tomato") 读取配置
// ============================================================

import { ICropConfig, CropCategory } from '../shared/Interfaces'

const CROP_LIST: ICropConfig[] = [
  {
    cropId: 'cabbage',
    name: '白菜',
    category: CropCategory.VEGETABLE,
    seedPrice: 5,
    sellPrice: 10,
    growTime: 7200,       // 2小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 8,
    unlockLevel: 1,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,     // 成熟后2小时枯萎
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_cabbage_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_cabbage_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_cabbage_grow' },
      { name: '结球',  progress: 0.8, spriteFrame: 'crop_cabbage_ball' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_cabbage_mature' },
    ]
  },
  {
    cropId: 'lettuce',
    name: '生菜',
    category: CropCategory.VEGETABLE,
    seedPrice: 8,
    sellPrice: 15,
    growTime: 10800,      // 3小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 10,
    unlockLevel: 1,
    harvestMin: 2,
    harvestMax: 5,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_lettuce_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_lettuce_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_lettuce_grow' },
      { name: '茂盛',  progress: 0.8, spriteFrame: 'crop_lettuce_lush' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_lettuce_mature' },
    ]
  },
  {
    cropId: 'radish',
    name: '萝卜',
    category: CropCategory.VEGETABLE,
    seedPrice: 10,
    sellPrice: 20,
    growTime: 14400,      // 4小时
    needWater: 3,
    needFertilizer: 1,
    expReward: 15,
    unlockLevel: 3,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_radish_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_radish_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_radish_grow' },
      { name: '膨大',  progress: 0.8, spriteFrame: 'crop_radish_big' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_radish_mature' },
    ]
  },
  {
    cropId: 'tomato',
    name: '番茄',
    category: CropCategory.VEGETABLE,
    seedPrice: 15,
    sellPrice: 35,
    growTime: 28800,      // 8小时
    needWater: 3,
    needFertilizer: 2,
    expReward: 20,
    unlockLevel: 5,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_tomato_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_tomato_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_tomato_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_tomato_flower' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_tomato_mature' },
    ]
  },
  {
    cropId: 'sunflower',
    name: '向日葵',
    category: CropCategory.FLOWER,
    seedPrice: 12,
    sellPrice: 25,
    growTime: 21600,      // 6小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 15,
    unlockLevel: 2,
    harvestMin: 1,
    harvestMax: 3,
    witherTime: 10800,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_sunflower_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_sunflower_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_sunflower_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_sunflower_bloom' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_sunflower_mature' },
    ]
  },
  {
    cropId: 'strawberry',
    name: '草莓',
    category: CropCategory.FRUIT,
    seedPrice: 25,
    sellPrice: 60,
    growTime: 43200,      // 12小时
    needWater: 4,
    needFertilizer: 2,
    expReward: 30,
    unlockLevel: 7,
    harvestMin: 2,
    harvestMax: 5,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_strawberry_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_strawberry_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_strawberry_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_strawberry_flower' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_strawberry_mature' },
    ]
  },
  {
    cropId: 'rose',
    name: '玫瑰',
    category: CropCategory.FLOWER,
    seedPrice: 30,
    sellPrice: 80,
    growTime: 57600,      // 16小时
    needWater: 4,
    needFertilizer: 2,
    expReward: 35,
    unlockLevel: 10,
    harvestMin: 1,
    harvestMax: 3,
    witherTime: 10800,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_rose_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_rose_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_rose_grow' },
      { name: '含苞',  progress: 0.8, spriteFrame: 'crop_rose_bud' },
      { name: '盛开',  progress: 1.0, spriteFrame: 'crop_rose_mature' },
    ]
  },
]

export class CropConfig {

  private static _map: Map<string, ICropConfig> = new Map()

  /** 初始化（游戏启动时调用一次） */
  static init(): void {
    CROP_LIST.forEach(c => this._map.set(c.cropId, c))
  }

  /**
   * 获取某作物配置
   * @param cropId 作物ID
   *
   * 示例：
   *   const cfg = CropConfig.get('tomato')
   *   console.log(cfg.name)       // "番茄"
   *   console.log(cfg.growTime)   // 28800
   *   console.log(cfg.sellPrice)  // 35
   */
  static get(cropId: string): ICropConfig {
    const cfg = this._map.get(cropId)
    if (!cfg) throw new Error(`未知作物: ${cropId}`)
    return cfg
  }

  /** 获取所有作物列表 */
  static getAll(): ICropConfig[] {
    return CROP_LIST
  }

  /** 获取指定等级已解锁的作物 */
  static getUnlocked(level: number): ICropConfig[] {
    return CROP_LIST.filter(c => c.unlockLevel <= level)
  }

  /** 获取指定分类的作物 */
  static getByCategory(category: CropCategory): ICropConfig[] {
    return CROP_LIST.filter(c => c.category === category)
  }
}
```

### 0.4.9 编码规范

```
1. 文件命名：PascalCase（如 FarmManager.ts）
2. 类名：PascalCase（如 class FarmManager）
3. 函数/变量：camelCase（如 getPlotData()）
4. 常量：UPPER_SNAKE_CASE（如 MAX_PLOT_COUNT）
5. 接口：I前缀+PascalCase（如 IUserData）
6. 枚举：PascalCase（如 CropStatus.GROWING）
7. 私有属性：_前缀（如 private _energy）
8. 注释：每个 public 方法必须写 JSDoc 注释
9. 每个文件开头写文件说明注释
10. 禁止使用 any 类型（MockData除外）
11. 禁止修改 shared/ 目录（联系F修改）
```

---
# 📄 文档F：项目管理指南

> **负责人：F**

## F.1 你的核心工作

```
1. 开工前：搭好项目骨架（shared/ 所有文件）
2. 第1天：确保所有人能拉代码、能运行项目
3. 每天：15分钟站会（微信群语音）
4. 每周五：合并各分支到 develop，检查冲突
5. 第3周起：写测试用例，开始测试
6. 第4周：主导联调合并
7. 全程：维护任务看板、协调进度、解决阻塞
```

## F.2 联调步骤

```
1. 将 CloudAPI.ts 中 USE_MOCK 改为 false
2. 确认 D 的所有云函数已部署
3. 合并 E → F → D → A → B → C 的代码（按此顺序）
4. 解决冲突
5. 全流程测试
6. 分配 bug 给对应的人
7. 回归测试
8. 提交微信审核
```

---
