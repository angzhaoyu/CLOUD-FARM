// ============================================================
// 负责人：C
// 调用方：无直接调用方，通过事件驱动
//         监听 B 发出的 STEAL_SUCCESS / STEAL_FAILED → 弹窗或 Toast
//
// 文件：scripts/ui/StealResultDialog.ts
// 职责：偷菜结果弹窗
// 触发：监听 STEAL_SUCCESS / STEAL_FAILED
// ============================================================

import { _decorator, Component, Node, Label, tween, Vec3 } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IStealResult } from '../shared/Interfaces'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

@ccclass('StealResultDialog')
export class StealResultDialog extends Component {

  @property(Label) titleLabel: Label = null!
  @property(Label) cropNameLabel: Label = null!
  @property(Label) countLabel: Label = null!
  @property(Node) confirmBtn: Node = null!

  onLoad(): void {
    EventManager.on(GameEvents.STEAL_SUCCESS, this._onSuccess, this)
    EventManager.on(GameEvents.STEAL_FAILED, this._onFailed, this)
    this.confirmBtn.on(Node.EventType.TOUCH_END, this._close, this)
    this.node.active = false
  }

  onDestroy(): void {
    EventManager.off(GameEvents.STEAL_SUCCESS, this._onSuccess, this)
    EventManager.off(GameEvents.STEAL_FAILED, this._onFailed, this)
  }

  private _onSuccess(data: IStealResult): void {
    this.node.active = true
    this.titleLabel.string = '偷菜成功！'
    this.cropNameLabel.string = data.cropName
    this.countLabel.string = `×${data.count}`

    this.node.setScale(0.3, 0.3, 1)
    tween(this.node)
      .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()
  }

  private _onFailed(data: { msg: string }): void {
    UIManager.instance?.showToast(data.msg)
  }

  private _close(): void {
    tween(this.node)
      .to(0.15, { scale: new Vec3(0, 0, 1) })
      .call(() => { this.node.active = false })
      .start()
  }
}