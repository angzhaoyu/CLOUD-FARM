// ============================================================
// 文件：scripts/social/FriendListPanel.ts
// 说明：好友列表界面，展示所有好友、标记可偷状态、提供入口
// 负责人：B
// 调用方：SocialManager 控制显示/隐藏
// 发出事件：ENTER_FRIEND_FARM（点击'去看看'按钮时）
// 调用CloudAPI：CloudAPI.getFriends()
// ============================================================

import {
    _decorator, Component, Node, Prefab, instantiate,
    Label, Sprite, Color, UIOpacity
} from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { IFriendData } from '../shared/Interfaces'
const { ccclass, property } = _decorator

@ccclass('FriendListPanel')
export class FriendListPanel extends Component {

    /** 好友列表项预制体 */
    @property(Prefab)
    friendItemPrefab: Prefab = null!

    /** ScrollView 的 content 节点 */
    @property(Node)
    listContent: Node = null!

    /** "暂无好友"提示节点 */
    @property(Node)
    emptyTip: Node = null!

    /** 加载中遮罩 */
    @property(Node)
    loadingMask: Node = null!

    /** 好友总数标签 */
    @property(Label)
    friendCountLabel: Label = null!

    /** 缓存的好友列表 */
    private _friends: IFriendData[] = []

    /** 是否正在加载 */
    private _loading: boolean = false

    // ================================================================
    //  显示 / 隐藏
    // ================================================================

    /**
     * 打开面板并拉取好友列表
     */
    async show(): Promise<void> {
        this.node.active = true
        await this._loadFriends()
    }

    /**
     * 隐藏面板
     */
    hide(): void {
        this.node.active = false
    }

    // ================================================================
    //  数据加载
    // ================================================================

    /**
     * 从云端获取好友列表
     */
    private async _loadFriends(): Promise<void> {
        if (this._loading) return
        this._loading = true
        this._showLoading(true)

        try {
            this._friends = await CloudAPI.getFriends()
            this._sortFriends()
            this._renderList()
        } catch (e) {
            console.error('[FriendListPanel] 获取好友列表失败', e)
            this._friends = []
            this._renderList()
        } finally {
            this._loading = false
            this._showLoading(false)
        }
    }

    /**
     * 排序规则：有成熟作物（可偷）的排前面，其次按等级降序
     */
    private _sortFriends(): void {
        this._friends.sort((a, b) => {
            if (a.hasMatureCrop !== b.hasMatureCrop) {
                return a.hasMatureCrop ? -1 : 1
            }
            return b.level - a.level
        })
    }

    // ================================================================
    //  渲染
    // ================================================================

    /**
     * 渲染好友列表
     */
    private _renderList(): void {
        // 清空旧列表
        this.listContent.removeAllChildren()

        // 更新好友总数
        if (this.friendCountLabel) {
            this.friendCountLabel.string = `好友 (${this._friends.length})`
        }

        // 空列表提示
        if (this._friends.length === 0) {
            this.emptyTip.active = true
            return
        }
        this.emptyTip.active = false

        // 逐条创建列表项
        this._friends.forEach((friend, index) => {
            const item = instantiate(this.friendItemPrefab)
            this.listContent.addChild(item)
            this._setupFriendItem(item, friend, index)
        })
    }

    /**
     * 初始化单个好友列表项
     */
    private _setupFriendItem(item: Node, friend: IFriendData, index: number): void {
        // ---- 昵称 ----
        const nicknameNode = item.getChildByName('Nickname')
        if (nicknameNode) {
            const label = nicknameNode.getComponent(Label)
            if (label) label.string = friend.nickname
        }

        // ---- 等级 ----
        const levelNode = item.getChildByName('Level')
        if (levelNode) {
            const label = levelNode.getComponent(Label)
            if (label) label.string = `Lv.${friend.level}`
        }

        // ---- 可偷标记 ----
        const stealMark = item.getChildByName('StealMark')
        if (stealMark) {
            stealMark.active = friend.hasMatureCrop
        }

        // ---- 状态文字 ----
        const statusNode = item.getChildByName('Status')
        if (statusNode) {
            const label = statusNode.getComponent(Label)
            if (label) {
                label.string = friend.hasMatureCrop ? '有成熟作物' : '正在种植中'
                label.color = friend.hasMatureCrop
                    ? new Color(255, 120, 50, 255)
                    : new Color(150, 150, 150, 255)
            }
        }

        // ---- 访问按钮 ----
        const visitBtn = item.getChildByName('VisitBtn')
        if (visitBtn) {
            visitBtn.on(Node.EventType.TOUCH_END, () => {
                this._visitFriend(friend.openId)
            })
        }

        // ---- 头像序号（备用，真实头像需异步加载） ----
        const avatarIndexNode = item.getChildByName('AvatarIndex')
        if (avatarIndexNode) {
            const label = avatarIndexNode.getComponent(Label)
            if (label) label.string = `${index + 1}`
        }
    }

    // ================================================================
    //  交互
    // ================================================================

    /**
     * 进入好友农场
     * 发出 ENTER_FRIEND_FARM 事件，由 SocialManager 处理场景切换
     */
    private _visitFriend(friendId: string): void {
        EventManager.emit(GameEvents.ENTER_FRIEND_FARM, { friendId })
    }

    /**
     * 手动刷新好友列表（供刷新按钮调用）
     */
    public async refresh(): Promise<void> {
        await this._loadFriends()
    }

    // ================================================================
    //  辅助
    // ================================================================

    /**
     * 控制加载遮罩显示
     */
    private _showLoading(visible: boolean): void {
        if (this.loadingMask) {
            this.loadingMask.active = visible
        }
    }
}