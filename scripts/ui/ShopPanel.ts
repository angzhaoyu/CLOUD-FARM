// ============================================================
// 文件：scripts/ui/ShopPanel.ts
// 说明：商店面板，展示种子/道具/装饰商品列表
// 负责人：C
// 调用方：监听 NAV_TAB_CHANGED（tab=='shop'）时显示
// 发出事件：ITEM_BOUGHT → 购买成功
// 调用CloudAPI：CloudAPI.buyItem()
// 读取配置：ShopConfig
// ============================================================

import {
  _decorator, Component, Node, Prefab, instantiate,
  Label, Color, ScrollView
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { CloudAPI } from '../shared/CloudAPI'
import { UserModel } from '../shared/UserModel'
import { IShopItem, IBuyResult } from '../shared/Interfaces'
import { CropConfig } from '../config/CropConfig'
import { Utils } from '../shared/Utils'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

type ShopCategory = 'seed' | 'tool' | 'decor'

const COLOR_AFFORDABLE = new Color(255, 255, 255, 255)
const COLOR_EXPENSIVE = new Color(255, 80, 80, 255)

@ccclass('ShopPanel')
export class ShopPanel extends Component {

  @property(Prefab) shopItemPrefab: Prefab = null!
  @property(Node) listContent: Node = null!
  @property(Node) closeBtn: Node = null!

  // 分类 Tab
  @property(Node) tabSeed: Node = null!
  @property(Node) tabTool: Node = null!
  @property(Node) tabDecor: Node = null!

  // 余额显示
  @property(Label) coinsLabel: Label = null!
  @property(Label) diamondsLabel: Label = null!

  private _currentCategory: ShopCategory = 'seed'
  private _isBuying: boolean = false

  onLoad(): void {
    if (this.closeBtn) {
      this.closeBtn.on(Node.EventType.TOUCH_END, this._close, this)
    }
    this._bindTab(this.tabSeed, 'seed')
    this._bindTab(this.tabTool, 'tool')
    this._bindTab(this.tabDecor, 'decor')

    EventManager.on(GameEvents.COINS_CHANGED, this._refreshBalance, this)
    EventManager.on(GameEvents.DIAMONDS_CHANGED, this._refreshBalance, this)

    this._refreshBalance()
    this._renderList()
  }

  onDestroy(): void {
    EventManager.off(GameEvents.COINS_CHANGED, this._refreshBalance, this)
    EventManager.off(GameEvents.DIAMONDS_CHANGED, this._refreshBalance, this)
  }

  // ================================================================
  //  分类切换
  // ================================================================

  private _bindTab(btn: Node, category: ShopCategory): void {
    if (!btn) return
    btn.on(Node.EventType.TOUCH_END, () => {
      if (this._currentCategory === category) return
      this._currentCategory = category
      this._renderList()
    })
  }

  // ================================================================
  //  列表渲染
  // ================================================================

  private _renderList(): void {
    this.listContent.removeAllChildren()
    const items = this._getItems()

    items.forEach(item => {
      const node = instantiate(this.shopItemPrefab)
      this.listContent.addChild(node)
      this._fillItem(node, item)
    })
  }

  /** 根据当前分类获取商品列表 */
  private _getItems(): IShopItem[] {
    if (this._currentCategory === 'seed') {
      // 种子商品来源于 CropConfig
      return CropConfig.getUnlocked(UserModel.level).map(cfg => ({
        itemId: `seed_${cfg.cropId}`,
        name: `${cfg.name}种子`,
        description: `生长 ${Utils.formatTime(cfg.growTime)}，收获可卖 ${cfg.sellPrice} 金币`,
        price: cfg.seedPrice,
        currency: 'coins' as const,
        category: 'seed' as const,
        iconFrame: cfg.stages[0].spriteFrame,
        effect: `+${cfg.expReward} 经验`
      }))
    }
    // tool / decor 由 ShopConfig 提供（F 维护）
    // 此处返回空数组，待 ShopConfig 完善后对接
    return []
  }

  private _fillItem(node: Node, item: IShopItem): void {
    const nameNode = node.getChildByName('Name')
    const priceNode = node.getChildByName('Price')
    const descNode = node.getChildByName('Desc')
    const buyBtn = node.getChildByName('BuyBtn')

    if (nameNode) nameNode.getComponent(Label)!.string = item.name
    if (descNode) descNode.getComponent(Label)!.string = item.description

    if (priceNode) {
      const pl = priceNode.getComponent(Label)!
      const currency = item.currency === 'coins' ? '金币' : '钻石'
      pl.string = `${item.price} ${currency}`
      const balance = item.currency === 'coins' ? UserModel.coins : UserModel.diamonds
      pl.color = balance >= item.price ? COLOR_AFFORDABLE : COLOR_EXPENSIVE
    }

    if (buyBtn) {
      buyBtn.on(Node.EventType.TOUCH_END, () => {
        this._buyItem(item)
      })
    }
  }

  // ================================================================
  //  购买
  // ================================================================

  private async _buyItem(item: IShopItem): Promise<void> {
    if (this._isBuying) return
    const balance = item.currency === 'coins' ? UserModel.coins : UserModel.diamonds
    if (balance < item.price) {
      UIManager.instance?.showToast(
        item.currency === 'coins' ? '金币不足！' : '钻石不足！'
      )
      return
    }

    this._isBuying = true
    try {
      const result: IBuyResult = await CloudAPI.buyItem(item.itemId, 1)
      EventManager.emit(GameEvents.ITEM_BOUGHT, result)
      UIManager.instance?.showToast(`购买 ${item.name} 成功`)
      this._renderList() // 刷新价格颜色
    } catch (e) {
      UIManager.instance?.showToast('购买失败')
    } finally {
      this._isBuying = false
    }
  }

  // ================================================================
  //  余额
  // ================================================================

  private _refreshBalance(): void {
    if (this.coinsLabel) this.coinsLabel.string = Utils.formatNumber(UserModel.coins)
    if (this.diamondsLabel) this.diamondsLabel.string = `${UserModel.diamonds}`
  }

  private _close(): void {
    this.node.active = false
  }
}