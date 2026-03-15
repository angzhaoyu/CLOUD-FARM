// ============================================================
// 文件：scripts/ui/SignInPanel.ts
// 说明：签到面板，展示连续签到天数和奖励
// 负责人：C
// 发出事件：SIGNED_IN → 签到完成
// 调用CloudAPI：CloudAPI.signIn()
// ============================================================

import {
  _decorator, Component, Node, Label, Color, tween, Vec3
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CloudAPI } from '../shared/CloudAPI'
import { UserModel } from '../shared/UserModel'
import { ISignInResult, ISignInReward } from '../shared/Interfaces'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

/** 7 天固定奖励（与后端保持一致，仅用于前端展示） */
const SIGN_IN_REWARDS: ISignInReward[] = [
  { day: 1, coins: 20, exp: 10, diamonds: 0, itemId: null },
  { day: 2, coins: 30, exp: 15, diamonds: 0, itemId: null },
  { day: 3, coins: 40, exp: 20, diamonds: 0, itemId: null },
  { day: 4, coins: 40, exp: 20, diamonds: 0, itemId: null },
  { day: 5, coins: 50, exp: 25, diamonds: 2, itemId: null },
  { day: 6, coins: 60, exp: 30, diamonds: 0, itemId: null },
  { day: 7, coins: 100, exp: 50, diamonds: 5, itemId: null },
]

const COLOR_SIGNED = new Color(158, 158, 158, 255)
const COLOR_TODAY = new Color(76, 175, 80, 255)
const COLOR_FUTURE = new Color(255, 255, 255, 255)

@ccclass('SignInPanel')
export class SignInPanel extends Component {

  @property([Node])
  dayNodes: Node[] = []             // 7 个日期格子

  @property(Node) signInBtn: Node = null!
  @property(Label) signInBtnLabel: Label = null!
  @property(Node) closeBtn: Node = null!
  @property(Label) streakLabel: Label = null!

  private _todaySignedIn: boolean = false
  private _isSigning: boolean = false

  onLoad(): void {
    this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    this.signInBtn.on(Node.EventType.TOUCH_END, this._doSignIn, this)
    this.node.active = false
  }

  /** 打开签到面板 */
  open(): void {
    this.node.active = true
    this._refresh()
  }

  // ================================================================
  //  渲染
  // ================================================================

  private _refresh(): void {
    const signedDays = UserModel.user.signInDays
    const todayStr = this._todayString()
    this._todaySignedIn = UserModel.user.lastSignInDate === todayStr

    if (this.streakLabel) {
      this.streakLabel.string = `已连续签到 ${signedDays} 天`
    }

    // 渲染 7 个格子
    for (let i = 0; i < 7 && i < this.dayNodes.length; i++) {
      const dayNode = this.dayNodes[i]
      const reward = SIGN_IN_REWARDS[i]
      const dayIndex = i + 1

      const dayLabel = dayNode.getChildByName('Day')
      const rewardLabel = dayNode.getChildByName('Reward')
      const checkNode = dayNode.getChildByName('Check')

      if (dayLabel) dayLabel.getComponent(Label)!.string = `第${dayIndex}天`
      if (rewardLabel) {
        const parts: string[] = []
        if (reward.coins > 0) parts.push(`${reward.coins}币`)
        if (reward.diamonds > 0) parts.push(`${reward.diamonds}钻`)
        rewardLabel.getComponent(Label)!.string = parts.join('+')
      }

      // 状态
      const isSigned = dayIndex <= signedDays
      const isToday = dayIndex === signedDays + 1 && !this._todaySignedIn
      const isTodaySigned = dayIndex === signedDays && this._todaySignedIn

      if (checkNode) checkNode.active = isSigned || isTodaySigned
      if (dayLabel) {
        const label = dayLabel.getComponent(Label)!
        if (isSigned || isTodaySigned) {
          label.color = COLOR_SIGNED
        } else if (isToday) {
          label.color = COLOR_TODAY
        } else {
          label.color = COLOR_FUTURE
        }
      }
    }

    // 签到按钮状态
    if (this._todaySignedIn) {
      this.signInBtnLabel.string = '今日已签到'
    } else {
      this.signInBtnLabel.string = '签到领奖'
    }
  }

  // ================================================================
  //  签到
  // ================================================================

  private async _doSignIn(): Promise<void> {
    if (this._todaySignedIn || this._isSigning) return
    this._isSigning = true

    try {
      const result: ISignInResult = await CloudAPI.signIn()
      this._todaySignedIn = true
      EventManager.emit(GameEvents.SIGNED_IN, result)

      const r = result.reward
      const msg = `签到成功！+${r.coins}金币 +${r.exp}经验` +
        (r.diamonds > 0 ? ` +${r.diamonds}钻石` : '')
      UIManager.instance?.showToast(msg)

      this._refresh()
    } catch (e) {
      UIManager.instance?.showToast('签到失败')
    } finally {
      this._isSigning = false
    }
  }

  // ================================================================
  //  工具
  // ================================================================

  private _todayString(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  private _close(): void {
    this.node.active = false
  }
}