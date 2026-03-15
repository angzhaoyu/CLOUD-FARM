// ============================================================
// 文件：scripts/farm/CropGrowth.ts
// 职责：作物生长的纯逻辑计算，不涉及任何显示
// 维护人：A
// 其他模块也可 import 使用（B 在好友农场场景中复用）
// ============================================================

import { ICropData, ICropStage, CropStatus } from '../shared/Interfaces'
import { CropConfig } from '../config/CropConfig'

export class CropGrowth {

  // ================================================================
  //  进度 & 时间
  // ================================================================

  /**
   * 计算作物当前生长进度 0 ~ 1
   * speedBoost 会缩短总生长时间：实际时长 = growTime × (1 - speedBoost)
   *
   * @param crop 作物数据
   * @returns 0.0 ~ 1.0
   *
   * 示例：
   *   const p = CropGrowth.getProgress(cropData) // 0.65 → 已生长 65%
   */
  static getProgress(crop: ICropData): number {
    if (crop.status === CropStatus.MATURE || crop.status === CropStatus.WITHERED) {
      return 1
    }
    const elapsedSec = (Date.now() - crop.plantedAt) / 1000
    const effectiveGrowTime = this._effectiveGrowTime(crop)
    return Math.min(1, Math.max(0, elapsedSec / effectiveGrowTime))
  }

  /**
   * 获取距离成熟的剩余秒数（≥ 0）
   */
  static getRemainSeconds(crop: ICropData): number {
    if (crop.status !== CropStatus.GROWING) return 0
    const elapsedSec = (Date.now() - crop.plantedAt) / 1000
    const effectiveGrowTime = this._effectiveGrowTime(crop)
    return Math.max(0, Math.ceil(effectiveGrowTime - elapsedSec))
  }

  /**
   * 获取成熟后距离枯萎的剩余秒数（≥ 0）
   * 仅在 MATURE 状态下有意义
   */
  static getWitherRemainSeconds(crop: ICropData): number {
    if (crop.status !== CropStatus.MATURE) return 0
    const config = CropConfig.get(crop.cropId)
    const effectiveGrowTime = this._effectiveGrowTime(crop)
    const elapsedSec = (Date.now() - crop.plantedAt) / 1000
    const timeSinceMature = elapsedSec - effectiveGrowTime
    return Math.max(0, Math.ceil(config.witherTime - timeSinceMature))
  }

  // ================================================================
  //  阶段
  // ================================================================

  /**
   * 获取当前生长阶段信息（用于决定显示哪张精灵图）
   */
  static getCurrentStage(crop: ICropData): ICropStage {
    const progress = this.getProgress(crop)
    const config = CropConfig.get(crop.cropId)
    // 从后往前找到第一个 progress ≤ 当前进度的阶段
    for (let i = config.stages.length - 1; i >= 0; i--) {
      if (progress >= config.stages[i].progress) {
        return config.stages[i]
      }
    }
    return config.stages[0]
  }

  /**
   * 获取当前阶段索引 0 ~ stages.length-1
   */
  static getCurrentStageIndex(crop: ICropData): number {
    const progress = this.getProgress(crop)
    const config = CropConfig.get(crop.cropId)
    for (let i = config.stages.length - 1; i >= 0; i--) {
      if (progress >= config.stages[i].progress) {
        return i
      }
    }
    return 0
  }

  // ================================================================
  //  状态判断
  // ================================================================

  /**
   * 是否需要浇水
   * 规则：把整个生长周期平均分成 needWater 段，
   *       每进入新的一段就需要浇水一次
   */
  static needsWater(crop: ICropData): boolean {
    if (crop.status !== CropStatus.GROWING) return false
    const config = CropConfig.get(crop.cropId)
    if (config.needWater <= 0) return false
    const progress = this.getProgress(crop)
    // 当前应该已经浇水的最低次数
    const expectedCount = Math.min(
      config.needWater,
      Math.floor(progress * config.needWater + 0.001) // 加epsilon避免浮点误差
    )
    return crop.waterCount < expectedCount
  }

  /**
   * 是否需要施肥（逻辑与浇水类似）
   */
  static needsFertilizer(crop: ICropData): boolean {
    if (crop.status !== CropStatus.GROWING) return false
    const config = CropConfig.get(crop.cropId)
    if (config.needFertilizer <= 0) return false
    const progress = this.getProgress(crop)
    const expectedCount = Math.min(
      config.needFertilizer,
      Math.floor(progress * config.needFertilizer + 0.001)
    )
    return crop.fertilizerCount < expectedCount
  }

  /**
   * 是否可以浇水（正在生长 & 浇水次数 < 需求上限）
   */
  static canWater(crop: ICropData): boolean {
    if (crop.status !== CropStatus.GROWING) return false
    const config = CropConfig.get(crop.cropId)
    return crop.waterCount < config.needWater
  }

  /**
   * 是否可以施肥
   */
  static canFertilize(crop: ICropData): boolean {
    if (crop.status !== CropStatus.GROWING) return false
    const config = CropConfig.get(crop.cropId)
    return crop.fertilizerCount < config.needFertilizer
  }

  /**
   * 是否已成熟
   */
  static isMature(crop: ICropData): boolean {
    return this.getProgress(crop) >= 1.0
  }

  /**
   * 是否已枯萎
   * 条件：状态为 MATURE 且 成熟后经过时间 > witherTime
   */
  static isWithered(crop: ICropData): boolean {
    if (crop.status === CropStatus.WITHERED) return true
    if (crop.status !== CropStatus.MATURE) return false
    const config = CropConfig.get(crop.cropId)
    const effectiveGrowTime = this._effectiveGrowTime(crop)
    const elapsedSec = (Date.now() - crop.plantedAt) / 1000
    return (elapsedSec - effectiveGrowTime) >= config.witherTime
  }

  /**
   * 是否受保护（有保护罩）
   */
  static isProtected(crop: ICropData): boolean {
    if (!crop.protectedUntil) return false
    return Date.now() < crop.protectedUntil
  }

  /**
   * 是否可以被偷（成熟 + 未被该玩家偷过 + 未受保护）
   */
  static canBeStolen(crop: ICropData, thievesOpenId: string): boolean {
    if (crop.status !== CropStatus.MATURE) return false
    if (this.isProtected(crop)) return false
    if (crop.stolenBy.includes(thievesOpenId)) return false
    return true
  }

  // ================================================================
  //  内部工具
  // ================================================================

  /**
   * 考虑加速后的实际生长总时间（秒）
   */
  private static _effectiveGrowTime(crop: ICropData): number {
    const boost = Math.min(Math.max(crop.speedBoost, 0), 0.99) // 最多加速99%
    return crop.growTime * (1 - boost)
  }
}