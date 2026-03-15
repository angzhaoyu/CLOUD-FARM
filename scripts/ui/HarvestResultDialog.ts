// ============================================================
// 负责人：C
// 调用方：无直接调用方，通过事件驱动
//         监听 A / ToolBar（C）发出的 CROP_HARVESTED → 弹出收获结果
//
// 文件：scripts/ui/HarvestResultDialog.ts
// 职责：收获结果弹窗
// 触发：监听 CROP_HARVESTED
// ============================================================

import { _decorator, Component, Node, Label, tween, Vec3 } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IHarvestResult } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('HarvestResultDialog')
export class HarvestResultDialog extends Component {

  @property(Label) titleLabel: Label = null!
  @property(Label) cropNameLabel: Label = null!
  @property(Label) countLabel: Label = null!
  @property(Label) expLabel: Label = null!
  @property(Node) levelUpNode: Node = null!
  @property(Label) levelUpLabel: Label = null!
  @property(Node) confirmBtn: Node = null!

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

    this.titleLabel.string = '收获成功！'
    this.cropNameLabel.string = data.cropName
    this.countLabel.string = `×${data.count}`
    this.expLabel.string = `+${data.expGained} 经验`

    if (data.leveledUp) {
      this.levelUpNode.active = true
      this.levelUpLabel.string = `升级到 Lv.${data.newLevel}！`
    } else {
      this.levelUpNode.active = false
    }

    // 弹出动画
    this.node.setScale(0.3, 0.3, 1)
    tween(this.node)
      .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()
  }

  private _close(): void {
    tween(this.node)
      .to(0.15, { scale: new Vec3(0, 0, 1) })
      .call(() => { this.node.active = false })
      .start()
  }
}