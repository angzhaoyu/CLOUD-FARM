// ============================================================
// 负责人：C
// 调用方：所有弹窗子类继承（C）；UIManager（C）调用 playOpenAnim / close
//
// 文件：scripts/ui/DialogBase.ts
// 职责：弹窗基类，提供打开/关闭动画与通用方法
// 继承：所有弹窗组件可继承此类
// ============================================================

import { _decorator, Component, Node, tween, Vec3, UIOpacity } from 'cc'
const { ccclass, property } = _decorator

const ANIM_OPEN_DURATION = 0.25
const ANIM_CLOSE_DURATION = 0.2

@ccclass('DialogBase')
export class DialogBase extends Component {

  @property(Node)
  closeBtn: Node = null!

  protected _data: Record<string, unknown> = {}

  onLoad(): void {
    if (this.closeBtn) {
      this.closeBtn.on(Node.EventType.TOUCH_END, this.close, this)
    }
  }

  /**
   * 外部传入数据，在子类中覆写以解析具体字段
   * @param data 任意键值数据
   */
  setup(data: Record<string, unknown>): void {
    this._data = data || {}
  }

  /** 弹出动画（UIManager.openDialog 调用后自动执行） */
  playOpenAnim(): void {
    this.node.setScale(0.3, 0.3, 1)
    tween(this.node)
      .to(ANIM_OPEN_DURATION, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()
  }

  /** 关闭弹窗（带缩小动画） */
  close(): void {
    tween(this.node)
      .to(ANIM_CLOSE_DURATION, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
      .call(() => {
        // 通过 UIManager 统一销毁
        const uiMgr = (this.node as any).__uiMgr
        if (uiMgr) {
          uiMgr.closeDialog(this.node)
        } else {
          this.node.removeFromParent()
          this.node.destroy()
        }
      })
      .start()
  }

  onDestroy(): void {
    if (this.closeBtn) {
      this.closeBtn.off(Node.EventType.TOUCH_END, this.close, this)
    }
  }
}