// ============================================================
// 文件：scripts/farm/HarvestAction.ts
// 职责：封装收获操作的校验与云函数调用
// 维护人：A
// ============================================================

import { UserModel } from '../shared/UserModel'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IPlotData, IHarvestResult, CropStatus } from '../shared/Interfaces'

export class HarvestAction {

  /**
   * 前端校验：该地块是否可以收获
   */
  static validate(plotData: IPlotData): string {
    if (!plotData.unlocked) return '地块未解锁'
    if (!plotData.crop) return '空地无法收获'
    if (plotData.crop.status === CropStatus.GROWING) return '作物尚未成熟'
    if (plotData.crop.status === CropStatus.WITHERED) return '作物已枯萎，请清除后重新种植'
    if (plotData.crop.status !== CropStatus.MATURE) return '作物状态异常'
    return ''
  }

  /**
   * 执行收获操作
   * @param plotIndex 地块编号
   * @returns 收获结果（作物名称、数量、经验等）
   */
  static async execute(plotIndex: number): Promise<IHarvestResult> {
    const plotData = UserModel.getPlot(plotIndex)
    if (!plotData) throw new Error(`地块 ${plotIndex} 不存在`)

    const errMsg = this.validate(plotData)
    if (errMsg) {
      EventManager.emit(GameEvents.API_ERROR, { code: -1, msg: errMsg })
      throw new Error(errMsg)
    }

    // CloudAPI.harvest 内部会更新 UserModel（清空地块、加仓库、加经验）
    const result = await CloudAPI.harvest(plotIndex)

    EventManager.emit(GameEvents.CROP_HARVESTED, result)

    return result
  }

  /**
   * 清除枯萎作物（无收益，只清空地块）
   * 注意：当前 CloudAPI 未单独提供 clearWithered 接口，
   *       暂用本地清除 + 下次同步覆盖的方式处理。
   *       如需后端支持请联系 D / F 新增云函数。
   */
  static clearWithered(plotIndex: number): void {
    UserModel.updatePlotCrop(plotIndex, null)
  }
}