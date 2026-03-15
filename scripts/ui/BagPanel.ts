// ============================================================
// 负责人：C
// 调用方：BottomNav（C）切换到 bag Tab 时由场景逻辑调用 open()
//         内部调用 CloudAPI.sell（F 维护）
//         发出 CROP_SOLD 事件
//
// 文件：scripts/ui/BagPanel.ts
// 职责：背包 / 仓库面板 —— 展示持有作物、出售
// 挂载：Farm.scene 中的背包面板节点
// ============================================================

import {
  _decorator, Component, Node, Prefab, instantiate, Label
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CloudAPI } from '../shared/CloudAPI'
import { UserModel } from '../shared/UserModel'
import { CropConfig } from '../config/CropConfig'
import { IWarehouseItem, ISellResult } from '../shared/Interfaces'
import { Utils } from '../shared/Utils'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

@ccclass('BagPanel')
export class BagPanel extends Component {

  @property(Prefab) bagItemPrefab: Prefab = null!
  @property(Node) listContent: Node = null!
  @property(Node) closeBtn: Node = null!
  @property(Label) totalLabel: Label = null!

  // 选中状态
  private _selectedCropId: string = ''
  private _selectedCount: number = 0
  private _isSelling: boolean = false

  onLoad(): void {
    if (this.closeBtn) {
      this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    }
    EventManager.on(GameEvents.WAREHOUSE_CHANGED, this._renderList, this)
    this.node.active = false
  }

  onDestroy(): void {
    EventManager.off(GameEvents.WAREHOUSE_CHANGED, this._renderList, this)
  }

  /** 外部调用打开背包 */
  open(): void {
    this.node.active = true
    this._renderList()
  }

  // ================================================================
  //  渲染
  // ================================================================

  private _renderList(): void {
    this.listContent.removeAllChildren()
    const warehouse = UserModel.warehouse

    if (this.totalLabel) {
      this.totalLabel.string = `共 ${UserModel.warehouseTotalCount} 件`
    }

    if (warehouse.length === 0) {
      // 空仓库提示
      const empty = new Node('Empty')
      const label = empty.addComponent(Label)
      label.string = '仓库空空如也~'
      label.fontSize = 28
      this.listContent.addChild(empty)
      return
    }

    warehouse.forEach(item => {
      const node = instantiate(this.bagItemPrefab)
      this.listContent.addChild(node)
      this._fillItem(node, item)
    })
  }

  private _fillItem(node: Node, item: IWarehouseItem): void {
    const cfg = CropConfig.get(item.cropId)
    const nameNode = node.getChildByName('Name')
    const countNode = node.getChildByName('Count')
    const priceNode = node.getChildByName('Price')
    const sellBtn = node.getChildByName('SellBtn')
    const sellAllBtn = node.getChildByName('SellAllBtn')

    if (nameNode) nameNode.getComponent(Label)!.string = cfg.name
    if (countNode) countNode.getComponent(Label)!.string = `×${item.count}`
    if (priceNode) priceNode.getComponent(Label)!.string = `单价 ${cfg.sellPrice}`

    // 卖出 1 个
    if (sellBtn) {
      sellBtn.on(Node.EventType.TOUCH_END, () => {
        this._sell(item.cropId, 1)
      })
    }
    // 全部卖出
    if (sellAllBtn) {
      sellAllBtn.on(Node.EventType.TOUCH_END, () => {
        this._sell(item.cropId, item.count)
      })
    }
  }

  // ================================================================
  //  卖出
  // ================================================================

  private async _sell(cropId: string, count: number): Promise<void> {
    if (this._isSelling || count <= 0) return
    this._isSelling = true

    try {
      const result: ISellResult = await CloudAPI.sell(cropId, count)
      EventManager.emit(GameEvents.CROP_SOLD, result)
      UIManager.instance?.showToast(
        `卖出 ${CropConfig.get(cropId).name}×${count}，获得 ${result.coinsGained} 金币`
      )
      this._renderList()
    } catch (e) {
      UIManager.instance?.showToast('卖出失败')
    } finally {
      this._isSelling = false
    }
  }

  private _close(): void {
    this.node.active = false
  }
}