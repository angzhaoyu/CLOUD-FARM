// ============================================================
// 文件：scripts/farm/WaterAction.ts
// 职责：封装浇水操作的校验与云函数调用
// 维护人：A
// ============================================================

import { UserModel } from '../shared/UserModel'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CropGrowth } from './CropGrowth'
import { IPlotData, IWaterResult, CropStatus } from '../shared/Interfaces'

/** 浇水所需体力 */
const WATER_ENERGY_COST = 2

export class WaterAction {

  /**
   * 前端校验：该地块是否可以执行浇水
   * @returns 空字符串表示可以，否则返回失败原因
   */
  static validate(plotData: IPlotData): string {
    if (!plotData.unlocked) return '地块未解锁'
    if (!plotData.crop) return '空地无法浇水'
    if (plotData.crop.status !== CropStatus.GROWING) return '只有生长中的作物可以浇水'
    if (!CropGrowth.canWater(plotData.crop)) return '浇水次数已满'
    if (UserModel.energy < WATER_ENERGY_COST) return '体力不足'
    return ''
  }

  /**
   * 执行浇水操作
   * @param plotIndex 地块编号
   * @returns 云函数返回的结果
   * @throws 校验失败或网络异常
   */
  static async execute(plotIndex: number): Promise<IWaterResult> {
    const plotData = UserModel.getPlot(plotIndex)
    if (!plotData) throw new Error(`地块 ${plotIndex} 不存在`)

    const errMsg = this.validate(plotData)
    if (errMsg) {
      EventManager.emit(GameEvents.API_ERROR, { code: -1, msg: errMsg })
      throw new Error(errMsg)
    }

    const result = await CloudAPI.water(plotIndex)

    // 本地数据已由 CloudAPI.water 内部更新（waterCount / speedBoost / energy）
    EventManager.emit(GameEvents.CROP_WATERED, {
      plotIndex: plotIndex,
      newEnergy: result.newEnergy
    })

    return result
  }

  /** 浇水消耗的体力值 */
  static get energyCost(): number {
    return WATER_ENERGY_COST
  }
}