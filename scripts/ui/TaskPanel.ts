// ============================================================
// 文件：scripts/ui/TaskPanel.ts
// 说明：任务面板，展示每日/每周任务进度和领取按钮
// 负责人：C
// 发出事件：TASK_CLAIMED → 任务奖励领取完成
// 调用CloudAPI：CloudAPI.getTaskStatus(), CloudAPI.claimTask()
// ============================================================

import {
  _decorator, Component, Node, Prefab, instantiate,
  Label, ProgressBar, Color
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CloudAPI } from '../shared/CloudAPI'
import { ITaskData, ITaskStatusResult, IClaimTaskResult } from '../shared/Interfaces'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

const COLOR_CLAIMABLE = new Color(76, 175, 80, 255)
const COLOR_PROGRESSING = new Color(255, 193, 7, 255)
const COLOR_CLAIMED = new Color(158, 158, 158, 255)

@ccclass('TaskPanel')
export class TaskPanel extends Component {

  @property(Prefab) taskItemPrefab: Prefab = null!
  @property(Node) dailyContent: Node = null!
  @property(Node) weeklyContent: Node = null!
  @property(Node) closeBtn: Node = null!

  // Tab
  @property(Node) tabDaily: Node = null!
  @property(Node) tabWeekly: Node = null!
  @property(Node) dailyPage: Node = null!
  @property(Node) weeklyPage: Node = null!

  private _taskData: ITaskStatusResult | null = null
  private _isClaiming: boolean = false

  onLoad(): void {
    if (this.closeBtn) this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    if (this.tabDaily) this.tabDaily.on(Node.EventType.TOUCH_END, () => this._switchTab('daily'))
    if (this.tabWeekly) this.tabWeekly.on(Node.EventType.TOUCH_END, () => this._switchTab('weekly'))
    this.node.active = false
  }

  /** 打开任务面板并拉取数据 */
  async open(): Promise<void> {
    this.node.active = true
    this._switchTab('daily')
    try {
      this._taskData = await CloudAPI.getTaskStatus()
      this._renderDaily()
      this._renderWeekly()
    } catch (e) {
      UIManager.instance?.showToast('获取任务失败')
    }
  }

  // ================================================================
  //  Tab
  // ================================================================

  private _switchTab(tab: 'daily' | 'weekly'): void {
    if (this.dailyPage) this.dailyPage.active = tab === 'daily'
    if (this.weeklyPage) this.weeklyPage.active = tab === 'weekly'
  }

  // ================================================================
  //  渲染
  // ================================================================

  private _renderDaily(): void {
    if (!this._taskData) return
    this._renderTaskList(this.dailyContent, this._taskData.dailyTasks)
  }

  private _renderWeekly(): void {
    if (!this._taskData) return
    this._renderTaskList(this.weeklyContent, this._taskData.weeklyTasks)
  }

  private _renderTaskList(container: Node, tasks: ITaskData[]): void {
    container.removeAllChildren()
    tasks.forEach(task => {
      const node = instantiate(this.taskItemPrefab)
      container.addChild(node)
      this._fillTask(node, task)
    })
  }

  private _fillTask(node: Node, task: ITaskData): void {
    const descNode = node.getChildByName('Desc')
    const progressNode = node.getChildByName('Progress')
    const rewardNode = node.getChildByName('Reward')
    const bar = node.getChildByName('Bar')
    const claimBtn = node.getChildByName('ClaimBtn')

    if (descNode) descNode.getComponent(Label)!.string = task.description

    if (progressNode) {
      progressNode.getComponent(Label)!.string = `${task.current}/${task.target}`
    }

    if (bar) {
      const pb = bar.getComponent(ProgressBar)
      if (pb) pb.progress = task.target > 0 ? task.current / task.target : 0
    }

    if (rewardNode) {
      const parts: string[] = []
      if (task.rewardCoins > 0) parts.push(`${task.rewardCoins}金币`)
      if (task.rewardExp > 0) parts.push(`${task.rewardExp}经验`)
      if (task.rewardDiamonds > 0) parts.push(`${task.rewardDiamonds}钻石`)
      rewardNode.getComponent(Label)!.string = parts.join(' + ')
    }

    // 按钮状态
    if (claimBtn) {
      const btnLabel = claimBtn.getChildByName('Label')
      const canClaim = task.current >= task.target && !task.claimed

      if (task.claimed) {
        if (btnLabel) btnLabel.getComponent(Label)!.string = '已领取'
        claimBtn.getComponent(Label)
      } else if (canClaim) {
        if (btnLabel) btnLabel.getComponent(Label)!.string = '领取'
        claimBtn.on(Node.EventType.TOUCH_END, () => this._claim(task.taskId))
      } else {
        if (btnLabel) btnLabel.getComponent(Label)!.string = '进行中'
      }
    }
  }

  // ================================================================
  //  领取
  // ================================================================

  private async _claim(taskId: string): Promise<void> {
    if (this._isClaiming) return
    this._isClaiming = true

    try {
      const result: IClaimTaskResult = await CloudAPI.claimTask(taskId)
      EventManager.emit(GameEvents.TASK_CLAIMED, result)
      UIManager.instance?.showToast('奖励已领取！')

      // 刷新列表
      this._taskData = await CloudAPI.getTaskStatus()
      this._renderDaily()
      this._renderWeekly()
    } catch (e) {
      UIManager.instance?.showToast('领取失败')
    } finally {
      this._isClaiming = false
    }
  }

  private _close(): void {
    this.node.active = false
  }
}