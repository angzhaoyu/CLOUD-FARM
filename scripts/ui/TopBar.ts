// ============================================================
// 文件：scripts/ui/TopBar.ts
// 说明：顶部状态栏（金币/钻石/体力/等级/经验条）
// 负责人：C
// 调用方：Farm.scene 顶部 UI 节点挂载
// 监听事件：
//   - COINS_CHANGED → 更新金币显示
//   - DIAMONDS_CHANGED → 更新钻石显示
//   - ENERGY_CHANGED → 更新体力显示
//   - EXP_CHANGED → 更新经验条
//   - LEVEL_UP → 播放升级动画
// ============================================================

import { _decorator, Component, Label, ProgressBar } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { Utils } from '../shared/Utils'
import { UIManager } from './UIManager'
const { ccclass, property } = _decorator

@ccclass('TopBar')
export class TopBar extends Component {

  @property(Label) levelLabel: Label = null!
  @property(Label) nicknameLabel: Label = null!
  @property(Label) coinsLabel: Label = null!
  @property(Label) diamondsLabel: Label = null!
  @property(Label) energyLabel: Label = null!
  @property(ProgressBar) expBar: ProgressBar = null!
  @property(ProgressBar) energyBar: ProgressBar = null!

  onLoad(): void {
    EventManager.on(GameEvents.COINS_CHANGED, this._onCoinsChanged, this)
    EventManager.on(GameEvents.DIAMONDS_CHANGED, this._onDiamondsChanged, this)
    EventManager.on(GameEvents.ENERGY_CHANGED, this._onEnergyChanged, this)
    EventManager.on(GameEvents.EXP_CHANGED, this._onExpChanged, this)
    EventManager.on(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.on(GameEvents.GAME_DATA_READY, this._refresh, this)

    // 如果数据已就绪（从好友农场返回时），直接刷新
    if (UserModel.user) {
      this._refresh()
    }
  }

  onDestroy(): void {
    EventManager.off(GameEvents.COINS_CHANGED, this._onCoinsChanged, this)
    EventManager.off(GameEvents.DIAMONDS_CHANGED, this._onDiamondsChanged, this)
    EventManager.off(GameEvents.ENERGY_CHANGED, this._onEnergyChanged, this)
    EventManager.off(GameEvents.EXP_CHANGED, this._onExpChanged, this)
    EventManager.off(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.off(GameEvents.GAME_DATA_READY, this._refresh, this)
  }

  // ================================================================
  //  刷新
  // ================================================================

  private _refresh(): void {
    this.levelLabel.string = `Lv.${UserModel.level}`
    this.nicknameLabel.string = UserModel.nickname
    this.coinsLabel.string = Utils.formatNumber(UserModel.coins)
    this.diamondsLabel.string = `${UserModel.diamonds}`
    this._updateEnergy(UserModel.energy, UserModel.energyMax)
  }

  // ================================================================
  //  事件回调
  // ================================================================

  private _onCoinsChanged(data: { coins: number; delta: number }): void {
    this.coinsLabel.string = Utils.formatNumber(data.coins)
    // 增加金币时播放飞入效果（预留）
  }

  private _onDiamondsChanged(data: { diamonds: number }): void {
    this.diamondsLabel.string = `${data.diamonds}`
  }

  private _onEnergyChanged(data: { energy: number; energyMax: number }): void {
    this._updateEnergy(data.energy, data.energyMax)
  }

  private _onExpChanged(data: { exp: number; level: number }): void {
    this.levelLabel.string = `Lv.${data.level}`
    // TODO: 经验条动画
  }

  private _onLevelUp(data: { newLevel: number; unlockedContent: string[] }): void {
    this.levelLabel.string = `Lv.${data.newLevel}`
    UIManager.instance?.showToast(`恭喜升到 Lv.${data.newLevel}！`)
  }

  // ================================================================
  //  内部
  // ================================================================

  private _updateEnergy(energy: number, energyMax: number): void {
    this.energyLabel.string = `${energy}/${energyMax}`
    if (this.energyBar) {
      this.energyBar.progress = energyMax > 0 ? energy / energyMax : 0
    }
  }
}