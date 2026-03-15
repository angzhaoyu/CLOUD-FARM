// ============================================================
// 负责人：C
// 调用方：无直接调用方，通过事件驱动
//         监听 A 发出的 PLOT_CROP_CLICKED / PLOT_EMPTY_CLICKED
//         内部调用 CloudAPI.water / fertilize / harvest（F 维护）
//         发出事件给 A：CROP_WATERED / CROP_FERTILIZED / CROP_HARVESTED / BUG_REMOVED / CROP_WITHERED
//
// 文件：scripts/ui/ToolBar.ts
// 职责：操作工具栏 —— 浇水 / 施肥 / 收获 / 除虫 / 清除枯萎
// 挂载：Farm.scene 底部（BottomNav 上方）
// 监听 PLOT_CROP_CLICKED 后根据作物状态启用/禁用按钮
// ============================================================

import { _decorator, Component, Node, Button, Label, Color } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CloudAPI } from '../shared/CloudAPI'
import { UserModel } from '../shared/UserModel'
import { UIManager } from './UIManager'
import { ICropData, CropStatus } from '../shared/Interfaces'
const { ccclass, property } = _decorator

const WATER_ENERGY_COST = 2

@ccclass('ToolBar')
export class ToolBar extends Component {

  @property(Node) waterBtn: Node = null!
  @property(Node) fertilizeBtn: Node = null!
  @property(Node) harvestBtn: Node = null!
  @property(Node) bugBtn: Node = null!
  @property(Node) removeBtn: Node = null!

  private _selectedPlotIndex: number = -1
  private _selectedCrop: ICropData | null = null

  onLoad(): void {
    EventManager.on(GameEvents.PLOT_CROP_CLICKED, this._onCropClicked, this)
    EventManager.on(GameEvents.PLOT_EMPTY_CLICKED, this._onEmptyClicked, this)

    this.waterBtn.on(Node.EventType.TOUCH_END, this._doWater, this)
    this.fertilizeBtn.on(Node.EventType.TOUCH_END, this._doFertilize, this)
    this.harvestBtn.on(Node.EventType.TOUCH_END, this._doHarvest, this)
    this.bugBtn.on(Node.EventType.TOUCH_END, this._doBugRemove, this)
    this.removeBtn.on(Node.EventType.TOUCH_END, this._doRemoveWithered, this)

    this._hideAll()
  }

  onDestroy(): void {
    EventManager.off(GameEvents.PLOT_CROP_CLICKED, this._onCropClicked, this)
    EventManager.off(GameEvents.PLOT_EMPTY_CLICKED, this._onEmptyClicked, this)
  }

  // ================================================================
  //  事件
  // ================================================================

  private _onCropClicked(data: { plotIndex: number; crop: ICropData }): void {
    this._selectedPlotIndex = data.plotIndex
    this._selectedCrop = data.crop
    this._refreshButtons()
  }

  private _onEmptyClicked(): void {
    this._selectedPlotIndex = -1
    this._selectedCrop = null
    this._hideAll()
  }

  // ================================================================
  //  按钮状态
  // ================================================================

  private _refreshButtons(): void {
    const crop = this._selectedCrop
    if (!crop) { this._hideAll(); return }

    const isGrowing = crop.status === CropStatus.GROWING
    const isMature = crop.status === CropStatus.MATURE
    const isWithered = crop.status === CropStatus.WITHERED

    this._setBtn(this.waterBtn, isGrowing)
    this._setBtn(this.fertilizeBtn, isGrowing)
    this._setBtn(this.harvestBtn, isMature)
    this._setBtn(this.bugBtn, crop.hasBug)
    this._setBtn(this.removeBtn, isWithered)
  }

  private _setBtn(btn: Node, visible: boolean): void {
    btn.active = visible
  }

  private _hideAll(): void {
    this.waterBtn.active = false
    this.fertilizeBtn.active = false
    this.harvestBtn.active = false
    this.bugBtn.active = false
    this.removeBtn.active = false
  }

  // ================================================================
  //  操作
  // ================================================================

  private async _doWater(): Promise<void> {
    if (this._selectedPlotIndex < 0) return
    if (UserModel.energy < WATER_ENERGY_COST) {
      UIManager.instance?.showToast('体力不足！')
      return
    }
    try {
      const result = await CloudAPI.water(this._selectedPlotIndex)
      EventManager.emit(GameEvents.CROP_WATERED, {
        plotIndex: this._selectedPlotIndex,
        newEnergy: result.newEnergy
      })
      UIManager.instance?.showToast('浇水成功')
    } catch (e) {
      UIManager.instance?.showToast('浇水失败')
    }
  }

  private async _doFertilize(): Promise<void> {
    if (this._selectedPlotIndex < 0) return
    try {
      const result = await CloudAPI.fertilize(this._selectedPlotIndex, 'normal')
      EventManager.emit(GameEvents.CROP_FERTILIZED, {
        plotIndex: this._selectedPlotIndex
      })
      UIManager.instance?.showToast('施肥成功')
    } catch (e) {
      UIManager.instance?.showToast('施肥失败')
    }
  }

  private async _doHarvest(): Promise<void> {
    if (this._selectedPlotIndex < 0) return
    try {
      const result = await CloudAPI.harvest(this._selectedPlotIndex)
      EventManager.emit(GameEvents.CROP_HARVESTED, result)
      this._hideAll()
    } catch (e) {
      UIManager.instance?.showToast('收获失败')
    }
  }

  private _doBugRemove(): void {
    if (this._selectedPlotIndex < 0) return
    // 除虫（本地即时操作，无需云函数）
    const plot = UserModel.getPlot(this._selectedPlotIndex)
    if (plot?.crop) {
      plot.crop.hasBug = false
    }
    EventManager.emit(GameEvents.BUG_REMOVED, {
      plotIndex: this._selectedPlotIndex
    })
    UIManager.instance?.showToast('除虫成功')
    this._refreshButtons()
  }

  private _doRemoveWithered(): void {
    if (this._selectedPlotIndex < 0) return
    UserModel.updatePlotCrop(this._selectedPlotIndex, null)
    EventManager.emit(GameEvents.CROP_WITHERED, {
      plotIndex: this._selectedPlotIndex
    })
    UIManager.instance?.showToast('已清除枯萎作物')
    this._hideAll()
  }
}