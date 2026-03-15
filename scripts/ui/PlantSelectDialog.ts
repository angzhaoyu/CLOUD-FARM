// ============================================================
// 负责人：C
// 调用方：无直接调用方，通过事件驱动
//         监听 A 发出的 PLOT_EMPTY_CLICKED → 弹出种子列表
//         发出 SEED_SELECTED → A 监听并执行种植
//
// 文件：scripts/ui/PlantSelectDialog.ts
// 职责：种子选择弹窗 —— 显示可种植列表，用户选择后发出事件
// 触发：监听 PLOT_EMPTY_CLICKED
// ============================================================

import {
  _decorator, Component, Node, Prefab, instantiate,
  Label, Button, Color, ScrollView
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { CropConfig } from '../config/CropConfig'
import { ICropConfig, CropCategory } from '../shared/Interfaces'
import { Utils } from '../shared/Utils'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

const COLOR_ENOUGH = new Color(60, 60, 60, 255)
const COLOR_LACK = new Color(255, 80, 80, 255)

@ccclass('PlantSelectDialog')
export class PlantSelectDialog extends Component {

  @property(Prefab) seedItemPrefab: Prefab = null!
  @property(Node) listContent: Node = null!
  @property(Node) closeBtn: Node = null!

  /** 分类筛选按钮 */
  @property(Node) tabAll: Node = null!
  @property(Node) tabVegetable: Node = null!
  @property(Node) tabFlower: Node = null!
  @property(Node) tabFruit: Node = null!

  private _plotIndex: number = -1
  private _currentCategory: CropCategory | null = null

  onLoad(): void {
    EventManager.on(GameEvents.PLOT_EMPTY_CLICKED, this._onPlotClicked, this)
    this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)

    this._bindTab(this.tabAll, null)
    this._bindTab(this.tabVegetable, CropCategory.VEGETABLE)
    this._bindTab(this.tabFlower, CropCategory.FLOWER)
    this._bindTab(this.tabFruit, CropCategory.FRUIT)

    this.node.active = false
  }

  onDestroy(): void {
    EventManager.off(GameEvents.PLOT_EMPTY_CLICKED, this._onPlotClicked, this)
  }

  // ================================================================
  //  事件
  // ================================================================

  private _onPlotClicked(data: { plotIndex: number }): void {
    this._plotIndex = data.plotIndex
    this._currentCategory = null
    this._show()
  }

  // ================================================================
  //  显示
  // ================================================================

  private _show(): void {
    this.node.active = true
    this._renderList()
  }

  private _renderList(): void {
    this.listContent.removeAllChildren()

    let seeds: ICropConfig[]
    if (this._currentCategory) {
      seeds = CropConfig.getByCategory(this._currentCategory)
        .filter(c => c.unlockLevel <= UserModel.level)
    } else {
      seeds = CropConfig.getUnlocked(UserModel.level)
    }

    seeds.forEach(cfg => {
      const item = instantiate(this.seedItemPrefab)
      this.listContent.addChild(item)
      this._fillItem(item, cfg)
    })
  }

  /** 填充单条种子数据 */
  private _fillItem(item: Node, cfg: ICropConfig): void {
    const nameNode = item.getChildByName('Name')
    const priceNode = item.getChildByName('Price')
    const timeNode = item.getChildByName('Time')
    const sellNode = item.getChildByName('Sell')
    const expNode = item.getChildByName('Exp')

    if (nameNode) nameNode.getComponent(Label)!.string = cfg.name
    if (timeNode) timeNode.getComponent(Label)!.string = Utils.formatTime(cfg.growTime)
    if (sellNode) sellNode.getComponent(Label)!.string = `卖 ${cfg.sellPrice}`
    if (expNode) expNode.getComponent(Label)!.string = `+${cfg.expReward} 经验`

    if (priceNode) {
      const priceLabel = priceNode.getComponent(Label)!
      priceLabel.string = `${cfg.seedPrice}`
      priceLabel.color = UserModel.coins >= cfg.seedPrice ? COLOR_ENOUGH : COLOR_LACK
    }

    // 点击
    item.on(Node.EventType.TOUCH_END, () => {
      this._onSelectSeed(cfg)
    })
  }

  // ================================================================
  //  选择
  // ================================================================

  private _onSelectSeed(cfg: ICropConfig): void {
    if (UserModel.coins < cfg.seedPrice) {
      UIManager.instance?.showToast('金币不足！')
      return
    }

    EventManager.emit(GameEvents.SEED_SELECTED, {
      plotIndex: this._plotIndex,
      cropId: cfg.cropId
    })

    this._close()
  }

  // ================================================================
  //  分类筛选
  // ================================================================

  private _bindTab(btn: Node, category: CropCategory | null): void {
    if (!btn) return
    btn.on(Node.EventType.TOUCH_END, () => {
      this._currentCategory = category
      this._renderList()
    })
  }

  // ================================================================
  //  关闭
  // ================================================================

  private _close(): void {
    this.node.active = false
  }
}