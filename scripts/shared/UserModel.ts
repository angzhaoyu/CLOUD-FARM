// ============================================================
// 文件：scripts/shared/UserModel.ts
// 说明：全局唯一用户数据模型，所有模块读取此处数据
// 负责人：F
// 调用方：
//   - A（读取地块数据、体力等）
//   - B（读取 openId 判断是否已偷、读取体力等）
//   - C（读取金币/钻石/等级等显示在 UI 上）
//   - CloudAPI 内部（登录后写入数据）
// 规则：读数据：任何模块可直接读；写数据：必须通过 UserModel 提供的方法
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
