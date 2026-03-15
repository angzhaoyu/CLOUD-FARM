// ============================================================
// 文件：scripts/farm/FertilizeAction.ts
// 职责：封装施肥操作的校验与云函数调用
// 维护人：A
// ============================================================

import { UserModel } from '../shared/UserModel'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CropGrowth } from './CropGrowth'
import { IPlotData, IWaterResult, CropStatus } from '../shared/Interfaces'

/** 施肥类型对应消耗 */
const FERTILIZER_COST: Record<string, { energy: number; coins: number }> = {
  normal:   { energy: 3, coins: 0 },
  advanced: { energy: 2, coins: 20 },
  super:    { energy: 1, coins: 50 },
}

export class FertilizeAction {

  /**
   * 前端校验：该地块是否可以施肥
   */
  static validate(plotData: IPlotData, fertilizerType: string = 'normal'): string {
    if (!plotData.unlocked) return '地块未解锁'
    if (!plotData.crop) return '空地无法施肥'
    if (plotData.crop.status !== CropStatus.GROWING) return '只有生长中的作物可以施肥'
    if (!CropGrowth.canFertilize(plotData.crop)) return '施肥次数已满'

    const cost = FERTILIZER_COST[fertilizerType]
    if (!cost) return '未知肥料类型'
    if (UserModel.energy < cost.energy) return '体力不足'
    if (UserModel.coins < cost.coins) return '金币不足'
    return ''
  }

  /**
   * 执行施肥操作
   * @param plotIndex       地块编号
   * @param fertilizerType  肥料类型 "normal" | "advanced" | "super"
   * @returns 云函数返回的结果
   */
  static async execute(
    plotIndex: number,
    fertilizerType: string = 'normal'
  ): Promise<IWaterResult> {
    const plotData = UserModel.getPlot(plotIndex)
    if (!plotData) throw new Error(`地块 ${plotIndex} 不存在`)

    const errMsg = this.validate(plotData, fertilizerType)
    if (errMsg) {
      EventManager.emit(GameEvents.API_ERROR, { code: -1, msg: errMsg })
      throw new Error(errMsg)
    }

    const result = await CloudAPI.fertilize(plotIndex, fertilizerType)

    // 更新本地数据
    if (plotData.crop) {
      plotData.crop.fertilizerCount++
      plotData.crop.speedBoost = result.newSpeedBoost
    }

    EventManager.emit(GameEvents.CROP_FERTILIZED, { plotIndex })

    return result
  }

  /** 获取某种肥料的消耗信息 */
  static getCost(fertilizerType: string): { energy: number; coins: number } {
    return FERTILIZER_COST[fertilizerType] || FERTILIZER_COST['normal']
  }
}