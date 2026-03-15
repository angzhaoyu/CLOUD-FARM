// ============================================================
// 文件：scripts/social/SocialManager.ts
// 职责：社交系统总调度，管理好友列表、好友农场、排行榜、互动记录
//       等子面板的显示/隐藏，监听全局事件并分派给子模块
// 挂载：Farm.scene 中常驻节点（或根节点下 SocialRoot 节点）
// 维护人：B
// ============================================================

import { _decorator, Component, Node, director } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { FriendListPanel } from './FriendListPanel'
import { FriendFarmScene } from './FriendFarmScene'
import { RankingPanel } from './RankingPanel'
import { InteractionLog } from './InteractionLog'
const { ccclass, property } = _decorator

/**
 * SocialManager 是社交模块的顶层管理器。
 *
 * 职责：
 *  1. 监听 NAV_TAB_CHANGED，在 tab === 'friends' 时打开好友列表面板
 *  2. 监听 ENTER_FRIEND_FARM，加载好友农场视图
 *  3. 监听 LEAVE_FRIEND_FARM，关闭好友农场并通知 A 刷新
 *  4. 提供 showRanking / showInteractionLog 等入口供 UI 按钮调用
 */
@ccclass('SocialManager')
export class SocialManager extends Component {

    // -------- 子面板引用 --------
    @property(FriendListPanel)
    friendListPanel: FriendListPanel = null!

    @property(FriendFarmScene)
    friendFarmScene: FriendFarmScene = null!

    @property(RankingPanel)
    rankingPanel: RankingPanel = null!

    @property(InteractionLog)
    interactionLog: InteractionLog = null!

    /** 当前是否处于好友农场视图 */
    private _inFriendFarm: boolean = false

    // ================================================================
    //  生命周期
    // ================================================================

    onLoad(): void {
        this._registerEvents()
        this._hideAllPanels()
    }

    onDestroy(): void {
        this._unregisterEvents()
    }

    // ================================================================
    //  事件注册 / 注销
    // ================================================================

    private _registerEvents(): void {
        EventManager.on(GameEvents.NAV_TAB_CHANGED, this._onTabChanged, this)
        EventManager.on(GameEvents.ENTER_FRIEND_FARM, this._onEnterFriendFarm, this)
        EventManager.on(GameEvents.LEAVE_FRIEND_FARM, this._onLeaveFriendFarm, this)
    }

    private _unregisterEvents(): void {
        EventManager.off(GameEvents.NAV_TAB_CHANGED, this._onTabChanged, this)
        EventManager.off(GameEvents.ENTER_FRIEND_FARM, this._onEnterFriendFarm, this)
        EventManager.off(GameEvents.LEAVE_FRIEND_FARM, this._onLeaveFriendFarm, this)
    }

    // ================================================================
    //  事件处理
    // ================================================================

    /**
     * 底部 Tab 切换回调
     * 当 tab === 'friends' 时打开好友列表面板，否则关闭所有社交面板
     */
    private _onTabChanged(data: { tab: string }): void {
        if (data.tab === 'friends') {
            this._showFriendList()
        } else {
            this._hideAllPanels()
        }
    }

    /**
     * 进入好友农场
     * @param data.friendId 好友 openId
     */
    private async _onEnterFriendFarm(data: { friendId: string }): Promise<void> {
        this._inFriendFarm = true
        this.friendListPanel.hide()
        this.rankingPanel.hide()
        this.interactionLog.hide()
        await this.friendFarmScene.loadFarm(data.friendId)
    }

    /**
     * 离开好友农场，回到自己的农场
     */
    private _onLeaveFriendFarm(): void {
        this._inFriendFarm = false
        this.friendFarmScene.unloadFarm()
        // 不主动打开好友列表——由 C 的 Tab 状态决定是否重新打开
    }

    // ================================================================
    //  面板显示 / 隐藏
    // ================================================================

    /** 显示好友列表 */
    private _showFriendList(): void {
        if (this._inFriendFarm) return
        this.rankingPanel.hide()
        this.interactionLog.hide()
        this.friendListPanel.show()
    }

    /** 隐藏所有社交面板 */
    private _hideAllPanels(): void {
        this.friendListPanel.hide()
        this.friendFarmScene.unloadFarm()
        this.rankingPanel.hide()
        this.interactionLog.hide()
        this._inFriendFarm = false
    }

    // ================================================================
    //  公开方法（供 UI 按钮直接调用）
    // ================================================================

    /**
     * 打开排行榜面板
     * 由好友列表面板中的"排行榜"按钮调用
     */
    public async showRanking(): Promise<void> {
        this.friendListPanel.hide()
        await this.rankingPanel.show()
    }

    /**
     * 关闭排行榜，返回好友列表
     */
    public closeRanking(): void {
        this.rankingPanel.hide()
        this.friendListPanel.show()
    }

    /**
     * 打开互动记录面板
     * 由好友列表面板中的"互动记录"按钮调用
     */
    public async showInteractionLog(): Promise<void> {
        this.friendListPanel.hide()
        await this.interactionLog.show()
    }

    /**
     * 关闭互动记录，返回好友列表
     */
    public closeInteractionLog(): void {
        this.interactionLog.hide()
        this.friendListPanel.show()
    }

    /** 是否正在访问好友农场 */
    public get isInFriendFarm(): boolean {
        return this._inFriendFarm
    }
}