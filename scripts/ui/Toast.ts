// ============================================================
// 负责人：C
// 调用方：UIManager（C）—— showToast 时动态实例化
//
// 文件：scripts/ui/Toast.ts
// 职责：轻提示组件，显示后自动上浮消失并销毁
// 挂载：由 UIManager 动态实例化到 toastLayer
// ============================================================

import { _decorator, Component, Label, UIOpacity, tween, Vec3 } from 'cc'
const { ccclass, property } = _decorator

/** 单次轻提示动画时长（秒） */
const FADE_IN_DURATION = 0.2
const FADE_OUT_DURATION = 0.3
const FLOAT_DISTANCE = 80

@ccclass('Toast')
export class Toast extends Component {

  @property(Label)
  label: Label = null!

  private _opacity: UIOpacity | null = null

  onLoad(): void {
    this._opacity = this.node.getComponent(UIOpacity)
    if (!this._opacity) {
      this._opacity = this.node.addComponent(UIOpacity)
    }
  }

  /**
   * 显示提示并在指定时长后自动消失
   * @param msg      提示文字
   * @param duration 停留时长（秒），不含动画时间
   */
  show(msg: string, duration: number = 2): void {
    this.label.string = msg
    this._opacity!.opacity = 0

    const startY = this.node.position.y

    // 淡入
    tween(this._opacity!)
      .to(FADE_IN_DURATION, { opacity: 255 })
      .delay(duration)
      // 上浮 + 淡出
      .to(FADE_OUT_DURATION, { opacity: 0 })
      .call(() => {
        this.node.removeFromParent()
        this.node.destroy()
      })
      .start()

    // 上浮位移
    tween(this.node)
      .delay(FADE_IN_DURATION + duration)
      .to(FADE_OUT_DURATION, {
        position: new Vec3(this.node.position.x, startY + FLOAT_DISTANCE, 0)
      })
      .start()
  }
}