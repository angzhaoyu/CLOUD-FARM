// ============================================================
// 文件：scripts/ui/BottomNav.ts
// 说明：底部导航栏（农场/好友/商店/背包/我的）
// 负责人：C
// 调用方：Farm.scene 底部 UI 节点挂载
// 发出事件：NAV_TAB_CHANGED → 切换 Tab 时发出
// ============================================================

import { _decorator, Component, Node, Sprite, Label, Color } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
const { ccclass, property } = _decorator

type TabName = 'farm' | 'friends' | 'shop' | 'bag' | 'me'

const TAB_NAMES: TabName[] = ['farm', 'friends', 'shop', 'bag', 'me']

const COLOR_ACTIVE = new Color(76, 175, 80, 255)
const COLOR_NORMAL = new Color(158, 158, 158, 255)

@ccclass('BottomNav')
export class BottomNav extends Component {

  @property([Node])
  tabButtons: Node[] = []

  @property([Label])
  tabLabels: Label[] = []

  @property([Sprite])
  tabIcons: Sprite[] = []

  private _currentTab: TabName = 'farm'

  onLoad(): void {
    this.tabButtons.forEach((btn, index) => {
      btn.on(Node.EventType.TOUCH_END, () => {
        this._onTabClick(index)
      })
    })
    this._updateVisual()
  }

  /**
   * Tab 点击处理
   * @param index Tab 索引 0-4
   */
  private _onTabClick(index: number): void {
    const tab = TAB_NAMES[index]
    if (!tab || tab === this._currentTab) return

    this._currentTab = tab
    this._updateVisual()

    EventManager.emit(GameEvents.NAV_TAB_CHANGED, { tab })
  }

  /** 外部强制切换 Tab */
  switchTo(tab: TabName): void {
    if (tab === this._currentTab) return
    this._currentTab = tab
    this._updateVisual()
  }

  /** 刷新所有 Tab 的高亮状态 */
  private _updateVisual(): void {
    TAB_NAMES.forEach((name, i) => {
      const isActive = name === this._currentTab
      if (this.tabLabels[i]) {
        this.tabLabels[i].color = isActive ? COLOR_ACTIVE : COLOR_NORMAL
      }
      if (this.tabIcons[i]) {
        this.tabIcons[i].color = isActive ? COLOR_ACTIVE : COLOR_NORMAL
      }
      // 选中态轻微上移
      if (this.tabButtons[i]) {
        const y = isActive ? 5 : 0
        const pos = this.tabButtons[i].position
        this.tabButtons[i].setPosition(pos.x, y, pos.z)
      }
    })
  }

  /** 获取当前选中 Tab */
  get currentTab(): TabName { return this._currentTab }

  onDestroy(): void {
    this.tabButtons.forEach(btn => {
      btn.off(Node.EventType.TOUCH_END)
    })
  }
}