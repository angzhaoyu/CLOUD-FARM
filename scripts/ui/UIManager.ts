// ============================================================
// 负责人：C
// 调用方：A（Farm模块）—— 通过 UIManager.instance.showToast 提示
//         B（Social模块）—— 通过 UIManager.instance.showToast 提示
//         C（UI模块内部）—— openDialog / closeDialog / showToast
//
// 文件：scripts/ui/UIManager.ts
// 职责：统一管理所有弹窗 / 面板的显示和隐藏
// 挂载：常驻节点上（不随场景切换销毁）
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc'
import { DialogBase } from './DialogBase'
import { Toast } from './Toast'
const { ccclass, property } = _decorator

/** 同时最多显示的 Toast 数量 */
const MAX_TOAST_COUNT = 5
/** 多条 Toast 纵向间隔 */
const TOAST_SPACING = 60

@ccclass('UIManager')
export class UIManager extends Component {

  @property(Node) dialogLayer: Node = null!
  @property(Node) toastLayer: Node = null!
  @property(Node) maskNode: Node = null!
  @property(Prefab) toastPrefab: Prefab = null!

  private static _instance: UIManager
  /** 全局唯一实例 */
  static get instance(): UIManager { return this._instance }

  onLoad(): void {
    UIManager._instance = this
    this.maskNode.active = false
    this.maskNode.on(Node.EventType.TOUCH_END, this._onMaskClick, this)
  }

  // ================================================================
  //  弹窗管理
  // ================================================================

  /**
   * 打开弹窗
   * @param prefab 弹窗预制体
   * @param data   传递给弹窗的数据
   * @returns 弹窗节点
   */
  openDialog(prefab: Prefab, data?: Record<string, unknown>): Node {
    this.maskNode.active = true
    const node = instantiate(prefab)
    this.dialogLayer.addChild(node)

    // 保存引用便于 DialogBase.close 回调
    ;(node as any).__uiMgr = this

    // 如果挂了 DialogBase（或子类），调用 setup + 动画
    const comp = node.getComponent(DialogBase)
    if (comp) {
      comp.setup(data || {})
      comp.playOpenAnim()
    } else {
      // 无基类时做默认缩放动画
      node.setScale(0.3, 0.3, 1)
      tween(node)
        .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .start()
    }

    return node
  }

  /**
   * 关闭弹窗并销毁
   * @param node 弹窗节点
   */
  closeDialog(node: Node): void {
    node.removeFromParent()
    node.destroy()
    if (this.dialogLayer.children.length === 0) {
      this.maskNode.active = false
    }
  }

  /** 关闭所有弹窗 */
  closeAllDialogs(): void {
    const children = [...this.dialogLayer.children]
    children.forEach(c => {
      c.removeFromParent()
      c.destroy()
    })
    this.maskNode.active = false
  }

  // ================================================================
  //  Toast
  // ================================================================

  /**
   * 显示轻提示
   * @param msg      提示文字
   * @param duration 停留时长（秒），默认 2
   */
  showToast(msg: string, duration: number = 2): void {
    if (!this.toastPrefab) {
      console.warn('[UIManager] toastPrefab 未绑定，无法显示 Toast')
      return
    }

    // 超出上限时移除最早的
    while (this.toastLayer.children.length >= MAX_TOAST_COUNT) {
      const oldest = this.toastLayer.children[0]
      oldest.removeFromParent()
      oldest.destroy()
    }

    // 已有 toast 上移
    this.toastLayer.children.forEach(child => {
      tween(child)
        .to(0.15, {
          position: new Vec3(
            child.position.x,
            child.position.y + TOAST_SPACING,
            0
          )
        })
        .start()
    })

    const node = instantiate(this.toastPrefab)
    this.toastLayer.addChild(node)
    const toast = node.getComponent(Toast)!
    toast.show(msg, duration)
  }

  // ================================================================
  //  内部
  // ================================================================

  /** 点击遮罩关闭最上层弹窗 */
  private _onMaskClick(): void {
    const count = this.dialogLayer.children.length
    if (count === 0) return
    const topNode = this.dialogLayer.children[count - 1]
    const comp = topNode.getComponent(DialogBase)
    if (comp) {
      comp.close()
    } else {
      this.closeDialog(topNode)
    }
  }

  onDestroy(): void {
    this.maskNode.off(Node.EventType.TOUCH_END, this._onMaskClick, this)
  }
}