// ============================================================
// 负责人：C
// 调用方：无直接调用方，挂载到 Farm.scene 常驻节点
//         自动判断新用户后启动引导，监听 A 发出的 PLOT_EMPTY_CLICKED / CROP_WATERED 等事件推进步骤
//
// 文件：scripts/ui/NewbieGuide.ts
// 职责：新手引导 —— 分步高亮 + 指引气泡
// 挂载：Farm.scene 常驻节点
// 引导步骤：
//   1. 指引点击空地 → 弹出种子选择
//   2. 指引选择白菜种子
//   3. 指引浇水
//   4. 介绍顶部信息栏
//   5. 介绍底部导航栏
//   6. 引导完成
// ============================================================

import {
  _decorator, Component, Node, Label, tween, Vec3, UIOpacity
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
const { ccclass, property } = _decorator

/** 引导步骤定义 */
interface IGuideStep {
  /** 高亮目标节点名 */
  targetName: string
  /** 提示文字 */
  tip: string
  /** 等待的事件名称（触发后进入下一步），为空则点击任意区域继续 */
  waitEvent: string
}

const GUIDE_STEPS: IGuideStep[] = [
  {
    targetName: 'Plot_2',
    tip: '点击空地开始种植吧！',
    waitEvent: GameEvents.PLOT_EMPTY_CLICKED
  },
  {
    targetName: 'PlantSelectDialog',
    tip: '选一颗白菜种子试试~',
    waitEvent: GameEvents.SEED_SELECTED
  },
  {
    targetName: 'WaterBtn',
    tip: '作物需要浇水才能长得快哦！',
    waitEvent: GameEvents.CROP_WATERED
  },
  {
    targetName: 'TopBar',
    tip: '这里可以查看你的金币、体力和等级',
    waitEvent: ''
  },
  {
    targetName: 'BottomNav',
    tip: '通过底部导航访问好友、商店和背包',
    waitEvent: ''
  },
]

const GUIDE_LOCAL_KEY = '__newbieGuideDone'

@ccclass('NewbieGuide')
export class NewbieGuide extends Component {

  @property(Node) maskNode: Node = null!
  @property(Node) highlightFrame: Node = null!
  @property(Label) tipLabel: Label = null!
  @property(Node) handIcon: Node = null!
  @property(Node) skipBtn: Node = null!

  private _currentStep: number = 0
  private _running: boolean = false

  onLoad(): void {
    this.node.active = false

    // 判断是否需要引导
    const isNewUser = (globalThis as Record<string, unknown>).__isNewUser === true
    const guideDone = !!localStorage.getItem(GUIDE_LOCAL_KEY)

    if (isNewUser && !guideDone) {
      // 等数据就绪后启动引导
      EventManager.on(GameEvents.GAME_DATA_READY, this._start, this)
    }

    if (this.skipBtn) {
      this.skipBtn.on(Node.EventType.TOUCH_END, this._skip, this)
    }
  }

  onDestroy(): void {
    EventManager.off(GameEvents.GAME_DATA_READY, this._start, this)
    this._clearCurrentListener()
  }

  // ================================================================
  //  引导控制
  // ================================================================

  private _start(): void {
    EventManager.off(GameEvents.GAME_DATA_READY, this._start, this)
    this._running = true
    this._currentStep = 0
    this.node.active = true
    this._showStep()
  }

  private _showStep(): void {
    if (this._currentStep >= GUIDE_STEPS.length) {
      this._finish()
      return
    }

    const step = GUIDE_STEPS[this._currentStep]

    // 提示文字
    this.tipLabel.string = step.tip

    // 高亮目标（尝试查找节点）
    this._positionHighlight(step.targetName)

    // 手指动画
    this._playHandAnim()

    // 监听完成事件
    if (step.waitEvent) {
      EventManager.on(step.waitEvent, this._onStepDone, this)
    } else {
      // 无事件要求 → 点击任意区域继续
      this.maskNode.once(Node.EventType.TOUCH_END, () => {
        this._nextStep()
      })
    }
  }

  private _onStepDone(): void {
    this._clearCurrentListener()
    // 延迟一帧再进入下一步，防止同帧事件冲突
    this.scheduleOnce(() => {
      this._nextStep()
    }, 0.3)
  }

  private _nextStep(): void {
    this._currentStep++
    this._showStep()
  }

  private _finish(): void {
    this._running = false
    this.node.active = false
    localStorage.setItem(GUIDE_LOCAL_KEY, '1')
    ;(globalThis as Record<string, unknown>).__isNewUser = false
  }

  private _skip(): void {
    this._clearCurrentListener()
    this._finish()
  }

  // ================================================================
  //  视觉
  // ================================================================

  /** 将高亮框移动到目标节点位置 */
  private _positionHighlight(targetName: string): void {
    // 从场景根节点递归查找
    const target = this._findNode(this.node.scene, targetName)
    if (target && this.highlightFrame) {
      const worldPos = target.worldPosition
      this.highlightFrame.setWorldPosition(worldPos)
      this.highlightFrame.active = true
    } else {
      if (this.highlightFrame) this.highlightFrame.active = false
    }
  }

  /** 手指指示动画 */
  private _playHandAnim(): void {
    if (!this.handIcon) return
    this.handIcon.active = true
    tween(this.handIcon)
      .to(0.5, {
        position: new Vec3(
          this.handIcon.position.x,
          this.handIcon.position.y - 15,
          0
        )
      })
      .to(0.5, {
        position: new Vec3(
          this.handIcon.position.x,
          this.handIcon.position.y + 15,
          0
        )
      })
      .union()
      .repeatForever()
      .start()
  }

  /** 递归查找节点 */
  private _findNode(root: Node, name: string): Node | null {
    if (root.name === name) return root
    for (const child of root.children) {
      const found = this._findNode(child, name)
      if (found) return found
    }
    return null
  }

  /** 清除当前步骤的事件监听 */
  private _clearCurrentListener(): void {
    if (this._currentStep < GUIDE_STEPS.length) {
      const step = GUIDE_STEPS[this._currentStep]
      if (step.waitEvent) {
        EventManager.off(step.waitEvent, this._onStepDone, this)
      }
    }
  }
}