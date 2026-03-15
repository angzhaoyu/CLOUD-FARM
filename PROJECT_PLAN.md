

# 云端农场 · 微信小游戏团队开发文档

> 共 7 份文档，每人领取对应文档即可独立开发

---

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

# 📄 文档A：农场核心开发指南

> **负责人：A**
> **负责目录：`scripts/farm/`**
> **负责场景：`scenes/Farm.scene`**

---

## A.1 你要开发的文件清单

```
scripts/farm/
├── FarmManager.ts        # 农场主管理器（入口）
├── PlotNode.ts           # 单个地块的组件（挂在地块节点上）
├── CropGrowth.ts         # 作物生长计算（纯逻辑，不涉及显示）
├── WaterAction.ts        # 浇水操作逻辑
├── FertilizeAction.ts    # 施肥操作逻辑
├── HarvestAction.ts      # 收获操作逻辑
└── FarmAnimations.ts     # 农场相关动画效果
```

## A.2 核心类设计

### FarmManager.ts

```typescript
// ============================================================
// 文件：scripts/farm/FarmManager.ts
// 职责：农场场景的主控制器
// 挂载：Farm.scene 的根节点上
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { PlotNode } from './PlotNode'
import { IPlotData } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('FarmManager')
export class FarmManager extends Component {

  // ---- 在 Cocos Creator 编辑器中拖入 ----
  @property(Prefab)
  plotPrefab: Prefab = null!          // 地块预制体

  @property(Node)
  plotContainer: Node = null!         // 放地块的容器节点

  // ---- 内部变量 ----
  private _plotNodes: PlotNode[] = []  // 所有地块组件引用
  private _currentTool: string = ''    // 当前选中的工具 'water'|'fertilize'|''

  // ================================
  // 生命周期
  // ================================

  onLoad(): void {
    this._registerEvents()
  }

  start(): void {
    this._initPlots()
    // 每秒更新一次作物显示
    this.schedule(this._updateAllCrops.bind(this), 1.0)
  }

  onDestroy(): void {
    this._unregisterEvents()
  }

  // ================================
  // 初始化地块
  // ================================

  /**
   * 根据 UserModel.plots 创建地块节点
   * 在 Farm.scene 加载后调用
   */
  private _initPlots(): void {
    const plots: IPlotData[] = UserModel.plots
    this._plotNodes = []

    for (let i = 0; i < 8; i++) {  // 初始最多8块
      const plotData = plots.find(p => p.plotIndex === i) || {
        plotIndex: i, unlocked: false, crop: null
      }
      const node = instantiate(this.plotPrefab)
      this.plotContainer.addChild(node)

      const plotComp = node.getComponent(PlotNode)!
      plotComp.init(plotData)
      this._plotNodes.push(plotComp)
    }

    this._layoutPlots()
  }

  /**
   * 排列地块位置（4列2行 或 自定义布局）
   */
  private _layoutPlots(): void {
    const cols = 4
    const spacingX = 160
    const spacingY = 180
    const startX = -240
    const startY = 100

    this._plotNodes.forEach((plot, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      plot.node.setPosition(
        startX + col * spacingX,
        startY - row * spacingY,
        0
      )
    })
  }

  // ================================
  // 每秒更新
  // ================================

  /**
   * 每秒调用，更新所有地块的显示
   * - 更新生长进度条
   * - 检查是否有作物刚成熟
   * - 检查是否有作物刚枯萎
   */
  private _updateAllCrops(): void {
    this._plotNodes.forEach(plot => {
      plot.updateDisplay()
    })
  }

  // ================================
  // 事件监听
  // ================================

  private _registerEvents(): void {
    // C 发来的事件：用户选了种子
    EventManager.on(GameEvents.SEED_SELECTED, this._onSeedSelected, this)
    // B 发来的事件：从好友农场返回
    EventManager.on(GameEvents.LEAVE_FRIEND_FARM, this._onBackFromFriend, this)
    // 通用：升级事件（可能解锁新地块）
    EventManager.on(GameEvents.LEVEL_UP, this._onLevelUp, this)
  }

  private _unregisterEvents(): void {
    EventManager.off(GameEvents.SEED_SELECTED, this._onSeedSelected, this)
    EventManager.off(GameEvents.LEAVE_FRIEND_FARM, this._onBackFromFriend, this)
    EventManager.off(GameEvents.LEVEL_UP, this._onLevelUp, this)
  }

  /**
   * C 的种子选择框选了种子后触发
   * 数据格式：{ plotIndex: number, cropId: string }
   */
  private async _onSeedSelected(data: { plotIndex: number, cropId: string }): Promise<void> {
    const { plotIndex, cropId } = data
    try {
      const result = await CloudAPI.plant(plotIndex, cropId)
      // 更新地块显示
      const plotNode = this._plotNodes[plotIndex]
      plotNode.setCrop(result.crop)
      plotNode.playPlantAnimation()
      // 通知其他模块
      EventManager.emit(GameEvents.CROP_PLANTED, { plotIndex, cropId })
    } catch (e) {
      console.error('种植失败', e)
    }
  }

  private async _onBackFromFriend(): Promise<void> {
    // 从好友农场返回时刷新自己的数据
    await CloudAPI.refreshMyFarm()
    this._refreshAllPlots()
  }

  private _onLevelUp(data: { newLevel: number }): void {
    // 检查是否有新地块解锁
    this._plotNodes.forEach(plot => {
      plot.checkUnlock(data.newLevel)
    })
  }

  /**
   * 刷新所有地块显示（数据已在 UserModel 中更新）
   */
  private _refreshAllPlots(): void {
    this._plotNodes.forEach((plotNode, index) => {
      const plotData = UserModel.getPlot(index)
      if (plotData) {
        plotNode.refresh(plotData)
      }
    })
  }

  // ================================
  // 工具模式（浇水/施肥模式）
  // ================================

  /**
   * 由底部操作栏按钮调用（C 通过事件或直接调用）
   * 进入浇水模式：点击地块变成浇水操作
   */
  public enterWaterMode(): void {
    this._currentTool = 'water'
    // 所有有作物且可浇水的地块高亮
    this._plotNodes.forEach(p => p.setHighlight(this._currentTool))
  }

  public enterFertilizeMode(): void {
    this._currentTool = 'fertilize'
    this._plotNodes.forEach(p => p.setHighlight(this._currentTool))
  }

  public exitToolMode(): void {
    this._currentTool = ''
    this._plotNodes.forEach(p => p.clearHighlight())
  }

  public get currentTool(): string {
    return this._currentTool
  }
}
```

### PlotNode.ts

```typescript
// ============================================================
// 文件：scripts/farm/PlotNode.ts
// 职责：单个地块的显示和交互
// 挂载：地块预制体的根节点上
// ============================================================

import { _decorator, Component, Node, Sprite, SpriteFrame,
         Label, ProgressBar, resources, UITransform } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { CloudAPI } from '../shared/CloudAPI'
import { CropGrowth } from './CropGrowth'
import { CropConfig } from '../config/CropConfig'
import { IPlotData, ICropData, CropStatus } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('PlotNode')
export class PlotNode extends Component {

  // ---- 编辑器绑定节点 ----
  @property(Sprite)  plotSprite: Sprite = null!        // 地块底图
  @property(Sprite)  cropSprite: Sprite = null!        // 作物图片
  @property(Label)   timeLabel: Label = null!           // 剩余时间文字
  @property(ProgressBar) progressBar: ProgressBar = null! // 生长进度条
  @property(Node)    waterIcon: Node = null!            // 缺水图标💧
  @property(Node)    bugIcon: Node = null!              // 虫子图标🐛
  @property(Node)    matureEffect: Node = null!         // 成熟闪光效果
  @property(Node)    lockIcon: Node = null!             // 锁图标🔒
  @property(Label)   lockLabel: Label = null!           // "Lv.8解锁"

  // ---- 内部数据 ----
  private _plotData: IPlotData = null!
  private _hasFiredMature: boolean = false  // 防止重复触发成熟事件

  /**
   * 初始化地块
   * @param data 地块数据（来自 UserModel.plots）
   * FarmManager 创建地块时调用
   */
  init(data: IPlotData): void {
    this._plotData = data
    this._hasFiredMature = false
    this._render()
    // 注册点击事件
    this.node.on(Node.EventType.TOUCH_END, this._onClick, this)
  }

  /** 刷新数据和显示 */
  refresh(data: IPlotData): void {
    this._plotData = data
    this._hasFiredMature = false
    this._render()
  }

  /** 设置作物（种植成功后调用） */
  setCrop(crop: ICropData): void {
    this._plotData.crop = crop
    this._hasFiredMature = false
    this._render()
  }

  /**
   * 每秒调用（由 FarmManager 的 schedule 触发）
   * 更新进度条、倒计时、检查状态变化
   */
  updateDisplay(): void {
    const crop = this._plotData.crop
    if (!crop || crop.status === CropStatus.WITHERED) return

    if (crop.status === CropStatus.GROWING) {
      const progress = CropGrowth.getProgress(crop)
      const remain = CropGrowth.getRemainSeconds(crop)
      const stage = CropGrowth.getCurrentStage(crop)

      // 更新进度条
      this.progressBar.progress = progress
      // 更新倒计时文字
      this.timeLabel.string = Utils.formatTime(remain)
      // 更新作物精灵图（如果阶段变了）
      this._updateCropSprite(stage.spriteFrame)
      // 检查缺水
      this.waterIcon.active = CropGrowth.needsWater(crop)

      // 检查是否刚成熟
      if (progress >= 1.0 && !this._hasFiredMature) {
        this._hasFiredMature = true
        crop.status = CropStatus.MATURE
        this._onCropMature()
      }
    }

    if (crop.status === CropStatus.MATURE) {
      // 检查是否枯萎
      if (CropGrowth.isWithered(crop)) {
        crop.status = CropStatus.WITHERED
        this._onCropWithered()
      }
    }
  }

  // ================================
  // 点击处理
  // ================================

  private _onClick(): void {
    // 1. 地块未解锁
    if (!this._plotData.unlocked) {
      // 显示"需要X级解锁"提示（发事件给C处理）
      return
    }

    // 2. 获取当前工具模式
    const farmMgr = this.node.parent!.parent!.getComponent('FarmManager') as any
    const tool = farmMgr?.currentTool || ''

    // 3. 空地 + 无工具模式 → 弹出种子选择
    if (!this._plotData.crop && !tool) {
      EventManager.emit(GameEvents.PLOT_EMPTY_CLICKED, {
        plotIndex: this._plotData.plotIndex
      })
      return
    }

    // 4. 有作物 + 无工具模式 → 弹出作物详情
    if (this._plotData.crop && !tool) {
      if (this._plotData.crop.status === CropStatus.MATURE) {
        this._doHarvest()
      } else {
        EventManager.emit(GameEvents.PLOT_CROP_CLICKED, {
          plotIndex: this._plotData.plotIndex,
          crop: this._plotData.crop
        })
      }
      return
    }

    // 5. 有作物 + 浇水模式
    if (this._plotData.crop && tool === 'water') {
      this._doWater()
      return
    }

    // 6. 有作物 + 施肥模式
    if (this._plotData.crop && tool === 'fertilize') {
      this._doFertilize()
      return
    }
  }

  // ================================
  // 操作方法
  // ================================

  /** 执行浇水 */
  private async _doWater(): Promise<void> {
    if (UserModel.energy < 2) {
      EventManager.emit(GameEvents.API_ERROR, { code: -1, msg: '体力不足' })
      return
    }
    try {
      const result = await CloudAPI.water(this._plotData.plotIndex)
      this._plotData.crop!.waterCount = result.newWaterCount
      this._plotData.crop!.speedBoost = result.newSpeedBoost
      this.waterIcon.active = false
      this._playWaterAnimation()
      EventManager.emit(GameEvents.CROP_WATERED, {
        plotIndex: this._plotData.plotIndex,
        newEnergy: result.newEnergy
      })
    } catch (e) {
      console.error('浇水失败', e)
    }
  }

  /** 执行施肥 */
  private async _doFertilize(): Promise<void> {
    // 类似浇水逻辑
    try {
      const result = await CloudAPI.fertilize(
        this._plotData.plotIndex, 'normal'
      )
      this._plotData.crop!.fertilizerCount++
      this._plotData.crop!.speedBoost = result.newSpeedBoost
      this._playFertilizeAnimation()
      EventManager.emit(GameEvents.CROP_FERTILIZED, {
        plotIndex: this._plotData.plotIndex
      })
    } catch (e) {
      console.error('施肥失败', e)
    }
  }

  /** 执行收获 */
  private async _doHarvest(): Promise<void> {
    try {
      const result = await CloudAPI.harvest(this._plotData.plotIndex)
      this._playHarvestAnimation()
      // 清空地块
      this._plotData.crop = null
      this._render()
      // 通知 C 弹出收获结果弹窗
      EventManager.emit(GameEvents.CROP_HARVESTED, result)
    } catch (e) {
      console.error('收获失败', e)
    }
  }

  // ================================
  // 显示相关
  // ================================

  private _render(): void {
    const { unlocked, crop } = this._plotData

    // 未解锁
    if (!unlocked) {
      this.cropSprite.node.active = false
      this.progressBar.node.active = false
      this.timeLabel.node.active = false
      this.waterIcon.active = false
      this.bugIcon.active = false
      this.matureEffect.active = false
      this.lockIcon.active = true
      // lockLabel 显示解锁等级
      return
    }

    this.lockIcon.active = false

    // 空地
    if (!crop) {
      this.cropSprite.node.active = false
      this.progressBar.node.active = false
      this.timeLabel.node.active = false
      this.waterIcon.active = false
      this.bugIcon.active = false
      this.matureEffect.active = false
      return
    }

    // 有作物
    this.cropSprite.node.active = true
    this.bugIcon.active = crop.hasBug

    if (crop.status === CropStatus.GROWING) {
      this.progressBar.node.active = true
      this.timeLabel.node.active = true
      this.matureEffect.active = false
      const stage = CropGrowth.getCurrentStage(crop)
      this._updateCropSprite(stage.spriteFrame)
    }

    if (crop.status === CropStatus.MATURE) {
      this.progressBar.node.active = false
      this.timeLabel.string = '收获'
      this.timeLabel.node.active = true
      this.matureEffect.active = true
      const cfg = CropConfig.get(crop.cropId)
      this._updateCropSprite(cfg.stages[4].spriteFrame)
    }

    if (crop.status === CropStatus.WITHERED) {
      this.progressBar.node.active = false
      this.timeLabel.string = '枯萎'
      this.timeLabel.node.active = true
      this.matureEffect.active = false
      this.cropSprite.grayscale = true  // 灰色显示
    }
  }

  /** 更新作物精灵图 */
  private _updateCropSprite(frameName: string): void {
    resources.load(`crops/${frameName}/spriteFrame`, SpriteFrame,
      (err, frame) => {
        if (!err && frame) {
          this.cropSprite.spriteFrame = frame
        }
      })
  }

  /** 浇水高亮（浇水模式下可浇水的地块显示高亮边框） */
  setHighlight(tool: string): void {
    // 实现高亮显示逻辑
  }

  clearHighlight(): void {
    // 清除高亮
  }

  checkUnlock(level: number): void {
    // 检查该地块是否应该在此等级解锁
  }

  // ================================
  // 动画（简单实现，可用 tween）
  // ================================

  playPlantAnimation(): void {
    // 种子落下动画
  }

  private _playWaterAnimation(): void {
    // 水滴溅落动画
  }

  private _playFertilizeAnimation(): void {
    // 撒肥料动画
  }

  private _playHarvestAnimation(): void {
    // 作物弹出飞走动画
  }

  private _onCropMature(): void {
    this._render()
    EventManager.emit(GameEvents.CROP_MATURED, {
      plotIndex: this._plotData.plotIndex,
      cropId: this._plotData.crop!.cropId
    })
  }

  private _onCropWithered(): void {
    this._render()
    EventManager.emit(GameEvents.CROP_WITHERED, {
      plotIndex: this._plotData.plotIndex
    })
  }
}
```

### CropGrowth.ts

```typescript
// ============================================================
// 文件：scripts/farm/CropGrowth.ts
// 职责：纯逻辑计算，不涉及任何显示
// 其他模块也可以 import 使用（B 在好友农场也要用）
// ============================================================

import { ICropData, ICropStage, CropStatus } from '../shared/Interfaces'
import { CropConfig } from '../config/CropConfig'

export class CropGrowth {

  /**
   * 计算作物当前生长进度 0~1
   * @param crop 作物数据
   * @returns 0.0 ~ 1.0
   *
   * 示例：
   *   const progress = CropGrowth.getProgress(cropData)
   *   // progress = 0.65 表示已生长65%
   */
  static getProgress(crop: ICropData): number {
    if (crop.status === CropStatus.MATURE) return 1
    if (crop.status === CropStatus.WITHERED) return 1
    const elapsed = (Date.now() - crop.plantedAt) / 1000
    const boostedTime = crop.growTime * (1 - crop.speedBoost)
    return Math.min(1, elapsed / boostedTime)
  }

  /**
   * 获取剩余秒数
   */
  static getRemainSeconds(crop: ICropData): number {
    if (crop.status !== CropStatus.GROWING) return 0
    const elapsed = (Date.now() - crop.plantedAt) / 1000
    const boostedTime = crop.growTime * (1 - crop.speedBoost)
    return Math.max(0, boostedTime - elapsed)
  }

  /**
   * 获取当前生长阶段信息
   */
  static getCurrentStage(crop: ICropData): ICropStage {
    const progress = this.getProgress(crop)
    const config = CropConfig.get(crop.cropId)
    for (let i = config.stages.length - 1; i >= 0; i--) {
      if (progress >= config.stages[i].progress) {
        return config.stages[i]
      }
    }
    return config.stages[0]
  }

  /**
   * 是否需要浇水
   * 规则：每生长25%应该浇一次水
   */
  static needsWater(crop: ICropData): boolean {
    if (crop.status !== CropStatus.GROWING) return false
    const progress = this.getProgress(crop)
    const config = CropConfig.get(crop.cropId)
    const expectedCount = Math.floor(progress * config.needWater)
    return crop.waterCount < expectedCount
  }

  /**
   * 是否已枯萎
   */
  static isWithered(crop: ICropData): boolean {
    if (crop.status !== CropStatus.MATURE) return false
    const config = CropConfig.get(crop.cropId)
    const elapsed = (Date.now() - crop.plantedAt) / 1000
    const boostedTime = crop.growTime * (1 - crop.speedBoost)
    return (elapsed - boostedTime) > config.witherTime
  }

  /**
   * 是否成熟
   */
  static isMature(crop: ICropData): boolean {
    return this.getProgress(crop) >= 1.0
  }
}
```

## A.3 你发出的事件（其他人会监听）

| 事件名 | 何时发出 | 携带数据 | 谁监听 |
|--------|---------|---------|--------|
| `PLOT_EMPTY_CLICKED` | 点击空地 | `{plotIndex}` | C → 弹种子选择 |
| `PLOT_CROP_CLICKED` | 点击有作物地块 | `{plotIndex, crop}` | C → 弹详情 |
| `CROP_PLANTED` | 种植完成 | `{plotIndex, cropId}` | C → 提示 |
| `CROP_WATERED` | 浇水完成 | `{plotIndex, newEnergy}` | C → 更新体力 |
| `CROP_FERTILIZED` | 施肥完成 | `{plotIndex}` | C → 提示 |
| `CROP_MATURED` | 作物成熟 | `{plotIndex, cropId}` | C → 提示 |
| `CROP_HARVESTED` | 收获完成 | `IHarvestResult` | C → 弹收获框 |
| `CROP_WITHERED` | 作物枯萎 | `{plotIndex}` | C → 提示 |

## A.4 你监听的事件

| 事件名 | 谁发出 | 你要做什么 |
|--------|--------|-----------|
| `SEED_SELECTED` | C | 拿到 `{plotIndex, cropId}` → 调 `CloudAPI.plant()` → 更新地块 |
| `LEAVE_FRIEND_FARM` | B | 刷新自己农场数据 |
| `LEVEL_UP` | 通用 | 检查地块是否有新解锁 |

## A.5 你自测的方法

```
1. 打开项目，确保 CloudAPI.ts 中 USE_MOCK = true
2. 打开 Farm.scene
3. 运行游戏，MockData 会返回预设的地块数据
4. 点击空地 → 控制台应输出 [Event] PLOT_EMPTY_CLICKED {plotIndex: 2}
   （C 的种子选择框还没做，你先看控制台确认事件发出了）
5. 手动模拟 C 选了种子：
   在控制台执行：
   EventManager.emit('SEED_SELECTED', {plotIndex: 2, cropId: 'tomato'})
   → 你的种植逻辑应该被触发
6. 等待作物生长（MockData中有正在生长的作物）→ 看进度条和倒计时更新
7. 点击成熟作物 → 收获流程应该跑通
```

---

# 📄 文档B：社交系统开发指南

> **负责人：B**
> **负责目录：`scripts/social/`**
> **负责场景：`scenes/FriendFarm.scene`**

---

## B.1 你要开发的文件清单

```
scripts/social/
├── SocialManager.ts          # 社交主管理器
├── FriendListPanel.ts        # 好友列表面板
├── FriendFarmScene.ts        # 好友农场场景控制器
├── StealAction.ts            # 偷菜操作
├── FriendPlotNode.ts         # 好友农场的地块（与A的PlotNode类似但操作不同）
├── RankingPanel.ts           # 排行榜面板
└── InteractionLog.ts         # 互动记录面板
```

## B.2 核心类设计

### FriendListPanel.ts

```typescript
// ============================================================
// 文件：scripts/social/FriendListPanel.ts
// 职责：好友列表界面
// 显示时机：用户点击底部"好友"Tab时显示
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate,
         ScrollView, Label, Sprite } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IFriendData } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('FriendListPanel')
export class FriendListPanel extends Component {

  @property(Prefab)
  friendItemPrefab: Prefab = null!     // 好友列表项预制体

  @property(Node)
  listContent: Node = null!            // ScrollView 的 content 节点

  @property(Node)
  emptyTip: Node = null!               // "暂无好友"提示

  private _friends: IFriendData[] = []

  /**
   * 打开面板时调用
   * 获取好友列表并显示
   */
  async show(): Promise<void> {
    this.node.active = true
    await this._loadFriends()
  }

  hide(): void {
    this.node.active = false
  }

  private async _loadFriends(): Promise<void> {
    try {
      this._friends = await CloudAPI.getFriends()
      this._renderList()
    } catch (e) {
      console.error('获取好友列表失败', e)
    }
  }

  private _renderList(): void {
    // 清空旧列表
    this.listContent.removeAllChildren()

    if (this._friends.length === 0) {
      this.emptyTip.active = true
      return
    }
    this.emptyTip.active = false

    this._friends.forEach(friend => {
      const item = instantiate(this.friendItemPrefab)
      this.listContent.addChild(item)

      // 设置显示内容
      const nicknameLabel = item.getChildByName('Nickname')!.getComponent(Label)!
      nicknameLabel.string = friend.nickname

      const levelLabel = item.getChildByName('Level')!.getComponent(Label)!
      levelLabel.string = `Lv.${friend.level}`

      // 可偷标记
      const stealMark = item.getChildByName('StealMark')!
      stealMark.active = friend.hasMatureCrop

      // 点击进入好友农场
      const visitBtn = item.getChildByName('VisitBtn')!
      visitBtn.on(Node.EventType.TOUCH_END, () => {
        this._visitFriend(friend.openId)
      })
    })
  }

  /**
   * 进入好友农场
   * 发出事件，由场景管理器切换到 FriendFarm.scene
   * 或者在当前场景中切换显示
   */
  private _visitFriend(friendId: string): void {
    EventManager.emit(GameEvents.ENTER_FRIEND_FARM, { friendId })
  }
}
```

### FriendFarmScene.ts

```typescript
// ============================================================
// 文件：scripts/social/FriendFarmScene.ts
// 职责：好友农场场景的控制器
// 挂载：FriendFarm.scene 根节点 或 Farm.scene 中的覆盖层
// ============================================================

import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CropGrowth } from '../farm/CropGrowth'  // ★ 复用A写的生长计算
import { UserModel } from '../shared/UserModel'
import { IFriendFarmResult, IPlotData, CropStatus } from '../shared/Interfaces'
import { FriendPlotNode } from './FriendPlotNode'
const { ccclass, property } = _decorator

@ccclass('FriendFarmScene')
export class FriendFarmScene extends Component {

  @property(Label)   friendName: Label = null!
  @property(Label)   friendLevel: Label = null!
  @property(Prefab)  plotPrefab: Prefab = null!
  @property(Node)    plotContainer: Node = null!
  @property(Node)    backBtn: Node = null!

  private _friendId: string = ''
  private _farmData: IFriendFarmResult | null = null
  private _plotNodes: FriendPlotNode[] = []

  onLoad(): void {
    this.backBtn.on(Node.EventType.TOUCH_END, this._onBack, this)
  }

  /**
   * 加载好友农场
   * @param friendId 好友openId
   */
  async loadFarm(friendId: string): Promise<void> {
    this._friendId = friendId
    this.node.active = true

    try {
      this._farmData = await CloudAPI.getFriendFarm(friendId)
      this._render()
    } catch (e) {
      console.error('加载好友农场失败', e)
    }
  }

  private _render(): void {
    if (!this._farmData) return

    this.friendName.string = this._farmData.nickname
    this.friendLevel.string = `Lv.${this._farmData.level}`

    // 清空旧地块
    this.plotContainer.removeAllChildren()
    this._plotNodes = []

    this._farmData.plots.forEach(plotData => {
      const node = instantiate(this.plotPrefab)
      this.plotContainer.addChild(node)

      const comp = node.getComponent(FriendPlotNode)!
      comp.init(plotData, this._friendId)
      this._plotNodes.push(comp)
    })
  }

  private _onBack(): void {
    this.node.active = false
    EventManager.emit(GameEvents.LEAVE_FRIEND_FARM)
  }
}
```

### FriendPlotNode.ts（好友农场的地块）

```typescript
// ============================================================
// 文件：scripts/social/FriendPlotNode.ts
// 职责：好友农场中单个地块的显示和交互
// 与 A 的 PlotNode 类似，但操作不同：
//   - 成熟作物 → 偷菜
//   - 缺水作物 → 帮浇水
//   - 有虫 → 帮除虫
// ============================================================

import { _decorator, Component, Node, Sprite, Label } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { CropGrowth } from '../farm/CropGrowth'  // ★ 复用A的生长计算
import { CropConfig } from '../config/CropConfig'
import { IPlotData, CropStatus } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('FriendPlotNode')
export class FriendPlotNode extends Component {

  @property(Sprite)  cropSprite: Sprite = null!
  @property(Label)   statusLabel: Label = null!
  @property(Node)    stealIcon: Node = null!      // "可偷"手掌图标
  @property(Node)    waterIcon: Node = null!       // 缺水图标
  @property(Node)    bugIcon: Node = null!         // 虫子图标
  @property(Node)    stolenMark: Node = null!      // "已偷"灰色标记

  private _plotData: IPlotData = null!
  private _friendId: string = ''

  init(plotData: IPlotData, friendId: string): void {
    this._plotData = plotData
    this._friendId = friendId
    this._render()
    this.node.on(Node.EventType.TOUCH_END, this._onClick, this)
  }

  private _render(): void {
    const crop = this._plotData.crop
    if (!crop) {
      this.cropSprite.node.active = false
      this.stealIcon.active = false
      this.waterIcon.active = false
      this.bugIcon.active = false
      this.stolenMark.active = false
      this.statusLabel.string = '空地'
      return
    }

    this.cropSprite.node.active = true
    this.bugIcon.active = crop.hasBug

    // 成熟 → 显示"可偷"
    if (crop.status === CropStatus.MATURE) {
      const alreadyStolen = crop.stolenBy.includes(UserModel.openId)
      this.stealIcon.active = !alreadyStolen
      this.stolenMark.active = alreadyStolen
      this.waterIcon.active = false
      this.statusLabel.string = alreadyStolen ? '已偷过' : '可偷取'
    }
    // 生长中 → 显示缺水
    else if (crop.status === CropStatus.GROWING) {
      this.stealIcon.active = false
      this.stolenMark.active = false
      this.waterIcon.active = CropGrowth.needsWater(crop)
      const remain = CropGrowth.getRemainSeconds(crop)
      this.statusLabel.string = Utils.formatTime(remain)
    }
  }

  private async _onClick(): Promise<void> {
    const crop = this._plotData.crop
    if (!crop) return

    // 成熟且未偷过 → 偷菜
    if (crop.status === CropStatus.MATURE &&
        !crop.stolenBy.includes(UserModel.openId)) {
      await this._doSteal()
      return
    }

    // 缺水 → 帮浇水
    if (crop.status === CropStatus.GROWING &&
        CropGrowth.needsWater(crop)) {
      await this._doWaterFriend()
      return
    }

    // 有虫 → 帮除虫（简化处理）
    if (crop.hasBug) {
      // 可以加帮除虫接口
      return
    }
  }

  /**
   * 偷菜
   */
  private async _doSteal(): Promise<void> {
    try {
      const result = await CloudAPI.steal(
        this._friendId,
        this._plotData.plotIndex
      )
      // 更新显示
      this._plotData.crop!.stolenBy.push(UserModel.openId)
      this.stealIcon.active = false
      this.stolenMark.active = true
      this.statusLabel.string = '已偷过'

      // 播放偷菜动画（TODO）

      // 通知C弹出偷菜成功弹窗
      EventManager.emit(GameEvents.STEAL_SUCCESS, result)
    } catch (e: any) {
      EventManager.emit(GameEvents.STEAL_FAILED, { msg: e.message || '偷菜失败' })
    }
  }

  /**
   * 帮好友浇水
   */
  private async _doWaterFriend(): Promise<void> {
    if (UserModel.energy < 2) {
      EventManager.emit(GameEvents.API_ERROR, { code: -1, msg: '体力不足' })
      return
    }
    try {
      const result = await CloudAPI.waterFriend(
        this._friendId,
        this._plotData.plotIndex
      )
      this.waterIcon.active = false

      // 播放浇水动画（TODO）

      EventManager.emit(GameEvents.FRIEND_WATERED, result)
    } catch (e) {
      console.error('帮浇水失败', e)
    }
  }
}
```

### RankingPanel.ts

```typescript
// ============================================================
// 文件：scripts/social/RankingPanel.ts
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate, Label } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { IRankItem } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('RankingPanel')
export class RankingPanel extends Component {

  @property(Prefab)  rankItemPrefab: Prefab = null!
  @property(Node)    listContent: Node = null!
  @property(Label)   myRankLabel: Label = null!
  @property([Node])  tabBtns: Node[] = []         // 3个Tab按钮节点

  private _currentType: 'harvest' | 'level' | 'steal' = 'harvest'

  async show(): Promise<void> {
    this.node.active = true
    await this._loadRanking()

    // 绑定Tab切换
    const types: Array<'harvest' | 'level' | 'steal'> = ['harvest', 'level', 'steal']
    this.tabBtns.forEach((btn, i) => {
      btn.on(Node.EventType.TOUCH_END, () => {
        this._currentType = types[i]
        this._loadRanking()
      })
    })
  }

  hide(): void {
    this.node.active = false
  }

  private async _loadRanking(): Promise<void> {
    try {
      const result = await CloudAPI.getRanking(this._currentType)
      this.myRankLabel.string = `我的排名：第${result.myRank}名`
      this._renderList(result.list)
    } catch (e) {
      console.error('获取排行榜失败', e)
    }
  }

  private _renderList(list: IRankItem[]): void {
    this.listContent.removeAllChildren()
    list.forEach(item => {
      const node = instantiate(this.rankItemPrefab)
      this.listContent.addChild(node)

      node.getChildByName('Rank')!.getComponent(Label)!.string = `${item.rank}`
      node.getChildByName('Nickname')!.getComponent(Label)!.string = item.nickname
      node.getChildByName('Value')!.getComponent(Label)!.string = `${item.value}`
    })
  }
}
```

## B.3 你发出和监听的事件

**你发出的事件：**

| 事件名 | 何时发出 | 携带数据 | 谁监听 |
|--------|---------|---------|--------|
| `STEAL_SUCCESS` | 偷菜成功 | `IStealResult` | C → 弹成功提示 |
| `STEAL_FAILED` | 偷菜失败 | `{msg}` | C → 弹失败提示 |
| `FRIEND_WATERED` | 帮浇水完成 | `IWaterFriendResult` | C → 弹提示 |
| `ENTER_FRIEND_FARM` | 要进入好友农场 | `{friendId}` | 场景管理器 |
| `LEAVE_FRIEND_FARM` | 返回自己农场 | 无 | A → 刷新数据 |

**你监听的事件：**

| 事件名 | 谁发出 | 你要做什么 |
|--------|--------|-----------|
| `NAV_TAB_CHANGED` | C | tab=='friends'时显示好友列表 |

## B.4 你可以 import A 的文件

```typescript
// B 可以直接引用 A 的 CropGrowth（纯计算逻辑）
import { CropGrowth } from '../farm/CropGrowth'

// 用于在好友农场中计算作物生长进度、判断是否缺水等
// CropGrowth 不依赖任何场景节点，是纯函数，可以安全引用
```

## B.5 自测方法

```
1. USE_MOCK = true
2. 直接调用：
   const friends = await CloudAPI.getFriends()
   console.log(friends)  // 应该返回 MockData 中的5个好友

3. 调用获取好友农场：
   const farm = await CloudAPI.getFriendFarm('f001')
   // 应返回小红的农场，有成熟草莓可偷

4. 调用偷菜：
   const result = await CloudAPI.steal('f001', 0)
   // 应返回偷到1个草莓

5. 好友农场场景可以独立运行测试
```

---

# 📄 文档C：UI系统开发指南

> **负责人：C**
> **负责目录：`scripts/ui/`**
> **负责场景：`scenes/Launch.scene`, `scenes/Shop.scene`**

---

## C.1 你要开发的文件清单

```
scripts/ui/
├── UIManager.ts              # UI管理器（弹窗的打开/关闭/层级）
├── LaunchScene.ts            # 启动场景（登录+加载）
├── TopBar.ts                 # 顶部信息栏（金币/钻石/体力/等级）
├── BottomNav.ts              # 底部导航栏（5个Tab）
├── ToolBar.ts                # 操作工具栏（浇水/施肥/收获按钮）
├── DialogBase.ts             # 弹窗基类
├── PlantSelectDialog.ts      # 种子选择弹窗
├── CropDetailDialog.ts       # 作物详情弹窗
├── HarvestResultDialog.ts    # 收获结果弹窗
├── StealResultDialog.ts      # 偷菜结果弹窗
├── ShopPanel.ts              # 商店面板
├── BagPanel.ts               # 背包/仓库面板
├── TaskPanel.ts              # 任务面板
├── SignInPanel.ts            # 签到面板
├── Toast.ts                  # 轻提示组件
└── NewbieGuide.ts            # 新手引导
```

## C.2 核心类设计

### UIManager.ts

```typescript
// ============================================================
// 文件：scripts/ui/UIManager.ts
// 职责：统一管理所有弹窗/面板的显示和隐藏
// 挂载：常驻节点上（不随场景切换销毁）
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate } from 'cc'
const { ccclass, property } = _decorator

@ccclass('UIManager')
export class UIManager extends Component {

  @property(Node) dialogLayer: Node = null!    // 弹窗层
  @property(Node) toastLayer: Node = null!     // Toast层
  @property(Node) maskNode: Node = null!       // 遮罩背景

  private static _instance: UIManager
  static get instance(): UIManager { return this._instance }

  onLoad(): void {
    UIManager._instance = this
  }

  /**
   * 打开弹窗
   * @param prefab 弹窗预制体
   * @param data   传递给弹窗的数据
   * @returns 弹窗节点
   *
   * 示例：
   *   const node = UIManager.instance.openDialog(this.harvestDialogPrefab, {
   *     cropName: '番茄', count: 3, expGained: 20
   *   })
   */
  openDialog(prefab: Prefab, data?: any): Node {
    this.maskNode.active = true
    const node = instantiate(prefab)
    this.dialogLayer.addChild(node)

    // 如果弹窗组件有 setup 方法，调用它传数据
    const comp = node.getComponent('DialogBase') as any
    if (comp && comp.setup) {
      comp.setup(data)
    }

    // 弹窗打开动画（缩放弹出）
    node.setScale(0.3, 0.3, 1)
    // 用 tween 做缩放动画...

    return node
  }

  /**
   * 关闭弹窗
   * @param node 要关闭的弹窗节点
   */
  closeDialog(node: Node): void {
    node.removeFromParent()
    node.destroy()
    // 如果没有其他弹窗了，关闭遮罩
    if (this.dialogLayer.children.length === 0) {
      this.maskNode.active = false
    }
  }

  /**
   * 显示Toast轻提示
   * @param msg 提示文字
   * @param duration 显示时长（秒），默认2秒
   *
   * 示例：
   *   UIManager.instance.showToast('金币不足！')
   *   UIManager.instance.showToast('种植成功', 1.5)
   */
  showToast(msg: string, duration: number = 2): void {
    // 创建Toast节点，显示文字，duration秒后自动消失
    // 简单实现：用Label + 背景 + tween动画
  }
}
```

### TopBar.ts

```typescript
// ============================================================
// 文件：scripts/ui/TopBar.ts
// 职责：顶部信息栏，实时显示金币/钻石/体力/等级
// 挂载：Farm.scene 顶部节点
// 关键：监听数据变化事件，自动刷新显示
// ============================================================

import { _decorator, Component, Label, ProgressBar } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { Utils } from '../shared/Utils'
const { ccclass, property } = _decorator

@ccclass('TopBar')
export class TopBar extends Component {

  @property(Label) levelLabel: Label = null!
  @property(Label) nicknameLabel: Label = null!
  @property(Label) coinsLabel: Label = null!
  @property(Label) diamondsLabel: Label = null!
  @property(Label) energyLabel: Label = null!
  @property(ProgressBar) energyBar: ProgressBar = null!

  onLoad(): void {
    // 监听所有数据变化事件
    EventManager.on(GameEvents.COINS_CHANGED, this._onCoinsChanged, this)
    EventManager.on(GameEvents.DIAMONDS_CHANGED, this._onDiamondsChanged, this)
    EventManager.on(GameEvents.ENERGY_CHANGED, this._onEnergyChanged, this)
    EventManager.on(GameEvents.EXP_CHANGED, this._onExpChanged, this)
    EventManager.on(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.on(GameEvents.GAME_DATA_READY, this._refresh, this)
  }

  onDestroy(): void {
    EventManager.off(GameEvents.COINS_CHANGED, this._onCoinsChanged, this)
    EventManager.off(GameEvents.DIAMONDS_CHANGED, this._onDiamondsChanged, this)
    EventManager.off(GameEvents.ENERGY_CHANGED, this._onEnergyChanged, this)
    EventManager.off(GameEvents.EXP_CHANGED, this._onExpChanged, this)
    EventManager.off(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.off(GameEvents.GAME_DATA_READY, this._refresh, this)
  }

  /** 刷新全部显示 */
  private _refresh(): void {
    this.levelLabel.string = `Lv.${UserModel.level}`
    this.nicknameLabel.string = UserModel.nickname
    this.coinsLabel.string = Utils.formatNumber(UserModel.coins)
    this.diamondsLabel.string = `${UserModel.diamonds}`
    this.energyLabel.string = `${UserModel.energy}/${UserModel.energyMax}`
    this.energyBar.progress = UserModel.energy / UserModel.energyMax
  }

  private _onCoinsChanged(data: {coins: number, delta: number}): void {
    this.coinsLabel.string = Utils.formatNumber(data.coins)
    if (data.delta > 0) {
      // 播放金币飞入动画（TODO）
    }
  }

  private _onDiamondsChanged(data: {diamonds: number}): void {
    this.diamondsLabel.string = `${data.diamonds}`
  }

  private _onEnergyChanged(data: {energy: number, energyMax: number}): void {
    this.energyLabel.string = `${data.energy}/${data.energyMax}`
    this.energyBar.progress = data.energy / data.energyMax
  }

  private _onExpChanged(data: {exp: number, level: number}): void {
    this.levelLabel.string = `Lv.${data.level}`
  }

  private _onLevelUp(data: {newLevel: number}): void {
    this.levelLabel.string = `Lv.${data.newLevel}`
    // 播放升级特效动画（TODO）
    UIManager.instance.showToast(`恭喜升到 Lv.${data.newLevel}！`)
  }
}
```

### PlantSelectDialog.ts

```typescript
// ============================================================
// 文件：scripts/ui/PlantSelectDialog.ts
// 职责：种子选择弹窗
// 触发：监听 PLOT_EMPTY_CLICKED 事件后弹出
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate,
         Label, Sprite, Button } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { CropConfig } from '../config/CropConfig'
import { ICropConfig } from '../shared/Interfaces'
import { Utils } from '../shared/Utils'
const { ccclass, property } = _decorator

@ccclass('PlantSelectDialog')
export class PlantSelectDialog extends Component {

  @property(Prefab) seedItemPrefab: Prefab = null!
  @property(Node)   listContent: Node = null!
  @property(Node)   closeBtn: Node = null!

  private _plotIndex: number = -1

  onLoad(): void {
    // 监听点击空地事件
    EventManager.on(GameEvents.PLOT_EMPTY_CLICKED, this._onPlotClicked, this)
    this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    this.node.active = false // 默认隐藏
  }

  onDestroy(): void {
    EventManager.off(GameEvents.PLOT_EMPTY_CLICKED, this._onPlotClicked, this)
  }

  /**
   * A 发出 PLOT_EMPTY_CLICKED 后触发
   */
  private _onPlotClicked(data: { plotIndex: number }): void {
    this._plotIndex = data.plotIndex
    this._show()
  }

  private _show(): void {
    this.node.active = true
    this.listContent.removeAllChildren()

    // 获取当前等级已解锁的种子
    const seeds = CropConfig.getUnlocked(UserModel.level)

    seeds.forEach(cfg => {
      const item = instantiate(this.seedItemPrefab)
      this.listContent.addChild(item)

      // 填充数据
      item.getChildByName('Name')!.getComponent(Label)!.string = cfg.name
      item.getChildByName('Price')!.getComponent(Label)!.string = `${cfg.seedPrice}`
      item.getChildByName('Time')!.getComponent(Label)!.string =
        Utils.formatTime(cfg.growTime)
      item.getChildByName('Sell')!.getComponent(Label)!.string = `卖${cfg.sellPrice}`

      // 金币不足时显示红色
      const priceLabel = item.getChildByName('Price')!.getComponent(Label)!
      if (UserModel.coins < cfg.seedPrice) {
        priceLabel.color = new Color(255, 80, 80, 255)
      }

      // 点击选择
      const btn = item.getComponent(Button) || item.addComponent(Button)
      item.on(Node.EventType.TOUCH_END, () => {
        this._onSelectSeed(cfg)
      })
    })
  }

  /**
   * 用户选了一个种子
   * 发出 SEED_SELECTED 事件 → A 监听并执行种植
   */
  private _onSelectSeed(cfg: ICropConfig): void {
    // 前端预检查
    if (UserModel.coins < cfg.seedPrice) {
      UIManager.instance.showToast('金币不足！')
      return
    }

    // 发出事件给 A
    EventManager.emit(GameEvents.SEED_SELECTED, {
      plotIndex: this._plotIndex,
      cropId: cfg.cropId
    })

    this._close()
  }

  private _close(): void {
    this.node.active = false
  }
}
```

### HarvestResultDialog.ts

```typescript
// ============================================================
// 文件：scripts/ui/HarvestResultDialog.ts
// 职责：收获结果弹窗
// 触发：监听 CROP_HARVESTED 事件
// ============================================================

import { _decorator, Component, Node, Label, Sprite } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IHarvestResult } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('HarvestResultDialog')
export class HarvestResultDialog extends Component {

  @property(Label)  titleLabel: Label = null!       // "收获成功！"
  @property(Sprite) cropIcon: Sprite = null!        // 作物图标
  @property(Label)  cropName: Label = null!         // "番茄"
  @property(Label)  countLabel: Label = null!       // "×3"
  @property(Label)  expLabel: Label = null!         // "+20经验"
  @property(Node)   levelUpNode: Node = null!       // 升级提示（默认隐藏）
  @property(Label)  levelUpLabel: Label = null!     // "升到Lv.9！"
  @property(Node)   confirmBtn: Node = null!

  onLoad(): void {
    EventManager.on(GameEvents.CROP_HARVESTED, this._onHarvested, this)
    this.confirmBtn.on(Node.EventType.TOUCH_END, this._close, this)
    this.node.active = false
  }

  onDestroy(): void {
    EventManager.off(GameEvents.CROP_HARVESTED, this._onHarvested, this)
  }

  private _onHarvested(data: IHarvestResult): void {
    this.node.active = true
    this.cropName.string = data.cropName
    this.countLabel.string = `×${data.count}`
    this.expLabel.string = `+${data.expGained} 经验`

    if (data.leveledUp) {
      this.levelUpNode.active = true
      this.levelUpLabel.string = `升级到 Lv.${data.newLevel}！`
    } else {
      this.levelUpNode.active = false
    }
  }

  private _close(): void {
    this.node.active = false
  }
}
```

## C.3 你发出和监听的完整事件表

**你发出的事件：**

| 事件名 | 何时发出 | 携带数据 | 谁监听 |
|--------|---------|---------|--------|
| `SEED_SELECTED` | 种子选择框点选后 | `{plotIndex, cropId}` | A |
| `ITEM_BOUGHT` | 商店购买完成 | `IBuyResult` | - |
| `CROP_SOLD` | 卖出作物 | `ISellResult` | - |
| `NAV_TAB_CHANGED` | 底部Tab切换 | `{tab}` | A, B |
| `SIGNED_IN` | 签到完成 | `ISignInResult` | - |
| `TASK_CLAIMED` | 领取任务奖励 | `IClaimTaskResult` | - |

**你监听的事件：**

| 事件名 | 谁发出 | 你要做什么 |
|--------|--------|-----------|
| `PLOT_EMPTY_CLICKED` | A | 弹出种子选择框 |
| `PLOT_CROP_CLICKED` | A | 弹出作物详情 |
| `CROP_HARVESTED` | A | 弹出收获结果弹窗 |
| `CROP_MATURED` | A | 顶部提示"有作物成熟了" |
| `CROP_WITHERED` | A | 提示"作物枯萎了" |
| `STEAL_SUCCESS` | B | 弹出偷菜成功提示 |
| `STEAL_FAILED` | B | Toast显示失败原因 |
| `FRIEND_WATERED` | B | Toast"浇水成功+5金币" |
| `COINS_CHANGED` | 通用 | TopBar更新金币 |
| `DIAMONDS_CHANGED` | 通用 | TopBar更新钻石 |
| `ENERGY_CHANGED` | 通用 | TopBar更新体力 |
| `LEVEL_UP` | 通用 | TopBar播放升级效果 |
| `GAME_DATA_READY` | 系统 | TopBar首次刷新 |
| `API_ERROR` | 系统 | Toast显示错误 |

---

# 📄 文档D：后端开发指南

> **负责人：D**
> **负责目录：`cloud/`**
> **核心工作：所有云函数 + 数据库设计**

---

## D.1 云函数清单

```
cloud/
├── login/index.js              # 登录+初始化
├── getMyFarm/index.js          # 获取我的农场数据
├── plant/index.js              # 种植
├── water/index.js              # 浇水（自己的）
├── fertilize/index.js          # 施肥
├── harvest/index.js            # 收获
├── steal/index.js              # 偷菜
├── waterFriend/index.js        # 帮好友浇水
├── sell/index.js               # 卖出作物
├── buyItem/index.js            # 购买商品
├── signIn/index.js             # 签到
├── getTaskStatus/index.js      # 获取任务状态
├── claimTask/index.js          # 领取任务奖励
├── getFriendFarm/index.js      # 获取好友农场
├── getRanking/index.js         # 排行榜
├── getInteractions/index.js    # 互动记录
└── checkWither/index.js        # 定时检查枯萎（定时触发器）
```

## D.2 数据库集合设计

```javascript
// ==================== users 集合 ====================
// 每个用户一条记录，_id 使用 openId
{
  _id: "oXXXXX",                  // openId
  nickname: "小明",
  avatarUrl: "https://...",
  level: 8,
  exp: 850,
  coins: 3280,
  diamonds: 50,
  energy: 80,
  energyMax: 116,
  signInDays: 3,
  lastSignInDate: "2025-01-15",
  lastEnergyUpdate: 1705312000000,  // 上次体力更新时间戳
  totalHarvest: 156,                // 总收获数（排行榜用）
  totalSteal: 23,                   // 总偷菜数
  createdAt: 1705000000000
}
// 索引：无需额外索引（_id 默认索引）

// ==================== plots 集合 ====================
// 每个地块一条记录
{
  _id: "auto",
  userId: "oXXXXX",
  plotIndex: 0,                     // 0-15
  unlocked: true,
  crop: {                           // null 表示空地
    cropId: "tomato",
    plantedAt: 1705312000000,
    growTime: 28800,
    status: "growing",              // growing/mature/withered
    waterCount: 2,
    fertilizerCount: 1,
    hasBug: false,
    speedBoost: 0.15,
    stolenBy: ["oYYYYY"],
    protectedUntil: null
  }
}
// 索引：userId + plotIndex 联合索引

// ==================== warehouse 集合 ====================
// 每个用户一条记录
{
  _id: "auto",
  userId: "oXXXXX",
  items: [
    { cropId: "tomato", count: 8 },
    { cropId: "lettuce", count: 12 }
  ]
}
// 索引：userId

// ==================== interactions 集合 ====================
{
  _id: "auto",
  fromUser: "oXXXXX",
  fromNickname: "小明",
  toUser: "oYYYYY",
  type: "steal",                    // steal/water/help_bug
  cropId: "tomato",
  cropName: "番茄",
  count: 1,
  date: "2025-01-15",              // 日期字符串（用于每日限制查询）
  createdAt: 1705312000000
}
// 索引：toUser + createdAt, fromUser + toUser + date + type
```

## D.3 统一返回格式

```javascript
// 所有云函数必须使用此格式返回

// 成功
return {
  code: 0,
  msg: 'ok',
  data: { ... }   // 具体数据，类型见 Interfaces.ts
}

// 失败
return {
  code: 1001,     // 错误码
  msg: '金币不足', // 错误描述
  data: null
}

// 错误码规范：
// 1xxx - 业务错误（金币不足、等级不够等）
// 2xxx - 数据错误（找不到用户、找不到地块等）
// 3xxx - 权限错误（不能偷自己等）
// 9xxx - 系统错误
```

## D.4 关键云函数实现

### steal（偷菜）完整实现

```javascript
// cloud/steal/index.js

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { targetUserId, plotIndex } = event

  // 1. 不能偷自己
  if (targetUserId === OPENID) {
    return { code: 3001, msg: '不能偷自己的菜', data: null }
  }

  // 2. 查询目标地块
  const plotRes = await db.collection('plots').where({
    userId: targetUserId,
    plotIndex: plotIndex
  }).get()

  if (plotRes.data.length === 0) {
    return { code: 2001, msg: '地块不存在', data: null }
  }
  const plot = plotRes.data[0]

  // 3. 检查是否有作物且成熟
  if (!plot.crop || plot.crop.status !== 'mature') {
    return { code: 1001, msg: '作物还没成熟', data: null }
  }

  // 4. 检查保护罩
  if (plot.crop.protectedUntil && plot.crop.protectedUntil > Date.now()) {
    return { code: 1002, msg: '对方有保护罩', data: null }
  }

  // 5. 检查是否已偷过
  if (plot.crop.stolenBy && plot.crop.stolenBy.includes(OPENID)) {
    return { code: 1003, msg: '你已经偷过这块地了', data: null }
  }

  // 6. 检查今天偷此好友的次数（每天最多3次）
  const today = new Date().toISOString().split('T')[0]
  const countRes = await db.collection('interactions').where({
    fromUser: OPENID,
    toUser: targetUserId,
    type: 'steal',
    date: today
  }).count()

  if (countRes.total >= 3) {
    return { code: 1004, msg: '今天已偷过这个好友3次了', data: null }
  }

  // 7. 查询作物配置获取名称
  // 这里简化处理，在云函数中也维护一份作物名称映射
  const cropNames = {
    'cabbage': '白菜', 'lettuce': '生菜', 'radish': '萝卜',
    'tomato': '番茄', 'sunflower': '向日葵', 'strawberry': '草莓',
    'rose': '玫瑰'
  }
  const cropId = plot.crop.cropId
  const cropName = cropNames[cropId] || cropId
  const stolenCount = 1

  // 8. 更新被偷地块（添加到 stolenBy）
  await db.collection('plots').doc(plot._id).update({
    data: {
      'crop.stolenBy': _.push(OPENID)
    }
  })

  // 9. 放入偷菜者仓库
  const whRes = await db.collection('warehouse').where({
    userId: OPENID
  }).get()

  if (whRes.data.length > 0) {
    const warehouse = whRes.data[0]
    const items = warehouse.items || []
    const existing = items.find(i => i.cropId === cropId)
    if (existing) {
      existing.count += stolenCount
    } else {
      items.push({ cropId, count: stolenCount })
    }
    await db.collection('warehouse').doc(warehouse._id).update({
      data: { items }
    })
  }

  // 10. 查询偷菜者昵称
  const myInfo = await db.collection('users').doc(OPENID).get()
  const myNickname = myInfo.data.nickname || '某人'

  // 11. 记录互动日志
  await db.collection('interactions').add({
    data: {
      fromUser: OPENID,
      fromNickname: myNickname,
      toUser: targetUserId,
      type: 'steal',
      cropId: cropId,
      cropName: cropName,
      count: stolenCount,
      date: today,
      createdAt: Date.now()
    }
  })

  // 12. 返回结果
  return {
    code: 0,
    msg: 'ok',
    data: {
      cropId: cropId,
      cropName: cropName,
      count: stolenCount
    }
  }
}
```

## D.5 自测方法

```
1. 在微信开发者工具的"云开发"控制台中测试
2. 点击云函数 → 右键"在终端中调试"
3. 手动传入参数测试每个函数
4. 在云开发控制台查看数据库数据是否正确写入
5. 特别测试边界情况：
   - 金币刚好等于种子价格
   - 连续偷同一块地
   - 体力恰好为0时浇水
   - 已枯萎的作物尝试收获
```

---

# 📄 文档E：美术资源规范

> **负责人：E**

## E.1 规范

```
画风：扁平卡通风（或像素风，统一一种）
设计尺寸：基于 750×1334
图片格式：PNG（透明背景）
命名规则：类别_名称_状态.png

交付目录结构：
resources/
├── crops/                    # 作物图
│   ├── crop_cabbage_seed.png
│   ├── crop_cabbage_sprout.png
│   ├── crop_cabbage_grow.png
│   ├── crop_cabbage_ball.png
│   ├── crop_cabbage_mature.png
│   ├── icon_crop_cabbage.png     # 图标（80×80）
│   ├── crop_tomato_seed.png
│   └── ...（7种作物 × 5阶段 + 7个图标 = 42张）
├── ui/
│   ├── btn_green_normal.png
│   ├── btn_green_pressed.png
│   ├── dialog_bg.9.png           # 九宫格
│   ├── topbar_bg.png
│   ├── nav_bg.png
│   ├── nav_farm_on/off.png
│   ├── icon_coin.png
│   ├── icon_diamond.png
│   ├── icon_energy.png
│   └── ...（约30张）
├── farm/
│   ├── plot_empty.png
│   ├── plot_locked.png
│   ├── bg_sky.png
│   ├── bg_ground.png
│   └── ...（约10张）
└── effects/
    ├── water_01~08.png           # 浇水动画帧
    ├── harvest_01~06.png         # 收获动画帧
    └── ...（约20张）
```

## E.2 交付优先级

```
第1周（最紧急）：UI基础组件 → A/B/C 搭界面需要
第2周：地块+农场场景 → A 搭农场需要
第2-3周：作物图（42张）→ 最大工作量
第4周：动画帧+音效+图标
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

# 总结：事件通信全景图

```
┌──────────────────────────────────────────────────────────────┐
│                      事件流向全景图                            │
│                                                               │
│     A (农场)                    B (社交)                      │
│     ┌──────┐                   ┌──────┐                      │
│     │种植  │                   │好友  │                      │
│     │浇水  │                   │偷菜  │                      │
│     │收获  │                   │排行  │                      │
│     └──┬───┘                   └──┬───┘                      │
│        │                          │                           │
│  PLOT_EMPTY_CLICKED ──────→ │         STEAL_SUCCESS ────→ │  │
│  CROP_HARVESTED ──────────→ │         STEAL_FAILED ─────→ │  │
│  CROP_MATURED ────────────→ │         FRIEND_WATERED ───→ │  │
│        │                    │                           │    │
│        │              ┌─────┴───────────────────────────┘    │
│        │              │                                       │
│        │              ▼                                       │
│        │         C (UI)                                      │
│        │         ┌──────┐                                    │
│        │         │TopBar│  ← COINS_CHANGED                   │
│  SEED_SELECTED ←─│弹窗  │  ← ENERGY_CHANGED                  │
│        │         │商店  │  ← LEVEL_UP                        │
│        │         │任务  │                                    │
│        │         └──┬───┘                                    │
│        │            │                                        │
│        │  NAV_TAB_CHANGED                                    │
│        │            │                                        │
│        ▼            ▼                                        │
│     ┌────────────────────┐                                   │
│     │   D (后端/CloudAPI) │                                   │
│     │   所有数据存取       │                                   │
│     └────────────────────┘                                   │
│                                                               │
│     ┌────────────────────┐     ┌──────────────────┐          │
│     │  E (美术资源)       │     │  F (公共/管理)    │          │
│     │  提供图片给ABC      │     │  shared/ 代码     │          │
│     │  不参与事件通信     │     │  config/ 配置     │          │
│     └────────────────────┘     │  测试/合并        │          │
│                                └──────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

**每个人拿着自己的文档（文档0 + 自己的文档），就可以独立开发。开发完成后通过事件系统和统一接口无缝合并。**