// ============================================================
// 负责人：C
// 调用方：无直接调用方，通过事件驱动
//         监听 A 发出的 PLOT_CROP_CLICKED → 弹出作物详情
// 文件：scripts/ui/CropDetailDialog.ts
// 职责：作物详情弹窗 —— 显示作物信息、生长进度、操作按钮
// 触发：监听 PLOT_CROP_CLICKED
// ============================================================

import {
  _decorator, Component, Node, Label, ProgressBar, Sprite, Color
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CropConfig } from '../config/CropConfig'
import { ICropData, ICropConfig, CropStatus } from '../shared/Interfaces'
import { Utils } from '../shared/Utils'
const { ccclass, property } = _decorator

@ccclass('CropDetailDialog')
export class CropDetailDialog extends Component {

  @property(Node) closeBtn: Node = null!

  // ---- 信息区 ----
  @property(Label) cropNameLabel: Label = null!
  @property(Label) statusLabel: Label = null!
  @property(Label) timeLabel: Label = null!
  @property(ProgressBar) growthBar: ProgressBar = null!
  @property(Label) waterLabel: Label = null!
  @property(Label) fertilizerLabel: Label = null!

  // ---- 状态图标 ----
  @property(Node) bugIcon: Node = null!
  @property(Node) protectedIcon: Node = null!

  private _plotIndex: number = -1
  private _crop: ICropData | null = null
  private _config: ICropConfig | null = null

  onLoad(): void {
    EventManager.on(GameEvents.PLOT_CROP_CLICKED, this._onCropClicked, this)
    this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    this.node.active = false
  }

  onDestroy(): void {
    EventManager.off(GameEvents.PLOT_CROP_CLICKED, this._onCropClicked, this)
  }

  // ================================================================
  //  事件
  // ================================================================

  private _onCropClicked(data: { plotIndex: number; crop: ICropData }): void {
    this._plotIndex = data.plotIndex
    this._crop = data.crop
    this._config = CropConfig.get(data.crop.cropId)
    this._show()
  }

  // ================================================================
  //  显示
  // ================================================================

  private _show(): void {
    this.node.active = true
    this._refresh()
  }

  private _refresh(): void {
    const crop = this._crop!
    const cfg = this._config!

    // 名称
    this.cropNameLabel.string = cfg.name

    // 状态文字
    this.statusLabel.string = this._statusText(crop.status)
    this.statusLabel.color = this._statusColor(crop.status)

    // 生长进度
    const progress = this._calcProgress(crop, cfg)
    this.growthBar.progress = progress

    // 剩余时间
    if (crop.status === CropStatus.GROWING) {
      const elapsed = (Date.now() - crop.plantedAt) / 1000
      const effectiveGrowTime = cfg.growTime * (1 - crop.speedBoost)
      const remaining = Math.max(0, effectiveGrowTime - elapsed)
      this.timeLabel.string = Utils.formatTime(Math.ceil(remaining))
    } else if (crop.status === CropStatus.MATURE) {
      this.timeLabel.string = '已成熟'
    } else {
      this.timeLabel.string = '已枯萎'
    }

    // 浇水 / 施肥
    this.waterLabel.string = `${crop.waterCount}/${cfg.needWater}`
    this.fertilizerLabel.string = `${crop.fertilizerCount}/${cfg.needFertilizer}`

    // 特殊状态图标
    if (this.bugIcon) this.bugIcon.active = crop.hasBug
    if (this.protectedIcon) {
      this.protectedIcon.active = crop.protectedUntil !== null &&
        crop.protectedUntil > Date.now()
    }
  }

  update(_dt: number): void {
    // 实时刷新倒计时（仅在可见时）
    if (!this.node.active || !this._crop) return
    if (this._crop.status === CropStatus.GROWING) {
      const elapsed = (Date.now() - this._crop.plantedAt) / 1000
      const effectiveGrowTime = this._config!.growTime * (1 - this._crop.speedBoost)
      const remaining = Math.max(0, effectiveGrowTime - elapsed)
      this.timeLabel.string = Utils.formatTime(Math.ceil(remaining))
      this.growthBar.progress = Math.min(elapsed / effectiveGrowTime, 1)
    }
  }

  // ================================================================
  //  工具
  // ================================================================

  private _calcProgress(crop: ICropData, cfg: ICropConfig): number {
    if (crop.status === CropStatus.MATURE) return 1
    if (crop.status === CropStatus.WITHERED) return 1
    const elapsed = (Date.now() - crop.plantedAt) / 1000
    const effective = cfg.growTime * (1 - crop.speedBoost)
    return Math.min(elapsed / effective, 1)
  }

  private _statusText(status: CropStatus): string {
    switch (status) {
      case CropStatus.GROWING: return '生长中'
      case CropStatus.MATURE: return '已成熟'
      case CropStatus.WITHERED: return '已枯萎'
      default: return ''
    }
  }

  private _statusColor(status: CropStatus): Color {
    switch (status) {
      case CropStatus.GROWING: return new Color(76, 175, 80, 255)
      case CropStatus.MATURE: return new Color(255, 193, 7, 255)
      case CropStatus.WITHERED: return new Color(158, 158, 158, 255)
      default: return new Color(255, 255, 255, 255)
    }
  }

  private _close(): void {
    this.node.active = false
  }
}