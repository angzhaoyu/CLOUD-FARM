// ============================================================
// 文件：scripts/social/InteractionLog.ts
// 职责：展示互动记录——谁偷了你的菜、谁帮你浇了水等
// 维护人：B
// ============================================================

import {
    _decorator, Component, Node, Prefab, instantiate,
    Label, Color, Sprite
} from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { Utils } from '../shared/Utils'
import {
    IInteraction, InteractionType, IInteractionsResult
} from '../shared/Interfaces'
const { ccclass, property } = _decorator

/** 互动类型对应的图标名和文字描述模板 */
interface IInteractionDisplay {
    icon: string
    color: Color
    template: string   // 含 {nickname} {cropName} {count} 占位符
}

const DISPLAY_MAP: Record<string, IInteractionDisplay> = {
    [InteractionType.STEAL]: {
        icon: 'icon_steal',
        color: new Color(255, 80, 80, 255),
        template: '{nickname} 偷了你 {count} 个{cropName}',
    },
    [InteractionType.WATER]: {
        icon: 'icon_water',
        color: new Color(60, 160, 255, 255),
        template: '{nickname} 帮你浇了水',
    },
    [InteractionType.HELP_BUG]: {
        icon: 'icon_bug',
        color: new Color(100, 200, 80, 255),
        template: '{nickname} 帮你除了虫',
    },
    [InteractionType.GIFT]: {
        icon: 'icon_gift',
        color: new Color(255, 180, 50, 255),
        template: '{nickname} 送了你 {count} 个{cropName}',
    },
}

@ccclass('InteractionLog')
export class InteractionLog extends Component {

    /** 互动记录条目预制体 */
    @property(Prefab)
    logItemPrefab: Prefab = null!

    /** ScrollView 的 content 节点 */
    @property(Node)
    listContent: Node = null!

    /** 标题标签 */
    @property(Label)
    titleLabel: Label = null!

    /** 空记录提示 */
    @property(Node)
    emptyTip: Node = null!

    /** 加载中提示 */
    @property(Node)
    loadingNode: Node = null!

    /** 未读数量标签（红点上的数字） */
    @property(Label)
    unreadCountLabel: Label = null!

    /** 红点节点 */
    @property(Node)
    redDot: Node = null!

    /** 缓存的互动记录 */
    private _interactions: IInteraction[] = []

    /** 是否正在加载 */
    private _loading: boolean = false

    /** 上次查看时间戳——用于判断新消息 */
    private _lastViewTime: number = 0

    // ================================================================
    //  显示 / 隐藏
    // ================================================================

    /**
     * 打开互动记录面板
     */
    async show(): Promise<void> {
        this.node.active = true

        if (this.titleLabel) {
            this.titleLabel.string = '互动记录'
        }

        await this._loadInteractions()

        // 标记已读
        this._lastViewTime = Date.now()
        this._updateRedDot()
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
     * 从云端获取互动记录
     */
    private async _loadInteractions(): Promise<void> {
        if (this._loading) return
        this._loading = true
        this._showLoading(true)

        try {
            const result: IInteractionsResult = await CloudAPI.getInteractions()
            this._interactions = result.list
            // 按时间倒序——最新的在最上面
            this._interactions.sort((a, b) => b.createdAt - a.createdAt)
            this._renderList()
        } catch (e) {
            console.error('[InteractionLog] 获取互动记录失败', e)
            this._interactions = []
            this._renderList()
        } finally {
            this._loading = false
            this._showLoading(false)
        }
    }

    // ================================================================
    //  渲染
    // ================================================================

    /**
     * 渲染互动记录列表
     */
    private _renderList(): void {
        this.listContent.removeAllChildren()

        if (this._interactions.length === 0) {
            if (this.emptyTip) this.emptyTip.active = true
            return
        }
        if (this.emptyTip) this.emptyTip.active = false

        this._interactions.forEach(interaction => {
            const node = instantiate(this.logItemPrefab)
            this.listContent.addChild(node)
            this._setupLogItem(node, interaction)
        })
    }

    /**
     * 初始化单条互动记录
     */
    private _setupLogItem(node: Node, interaction: IInteraction): void {
        const display = DISPLAY_MAP[interaction.type]
        if (!display) return

        // ---- 描述文字 ----
        const descNode = node.getChildByName('Description')
        if (descNode) {
            const label = descNode.getComponent(Label)
            if (label) {
                label.string = this._formatDescription(display.template, interaction)
                label.color = display.color
            }
        }

        // ---- 时间 ----
        const timeNode = node.getChildByName('Time')
        if (timeNode) {
            const label = timeNode.getComponent(Label)
            if (label) {
                label.string = Utils.formatTimeAgo(interaction.createdAt)
            }
        }

        // ---- 新消息标记 ----
        const newMark = node.getChildByName('NewMark')
        if (newMark) {
            newMark.active = interaction.createdAt > this._lastViewTime
        }

        // ---- 互动类型图标 ----
        const iconNode = node.getChildByName('TypeIcon')
        if (iconNode) {
            // 图标加载由美术资源决定，此处仅做节点控制
            iconNode.active = true
        }

        // ---- 点击跳转到该好友农场 ----
        node.on(Node.EventType.TOUCH_END, () => {
            this._onTapItem(interaction)
        })
    }

    /**
     * 格式化描述文字
     */
    private _formatDescription(template: string, interaction: IInteraction): string {
        return template
            .replace('{nickname}', interaction.fromNickname)
            .replace('{cropName}', interaction.cropName || '')
            .replace('{count}', `${interaction.count || ''}`)
            .trim()
    }

    // ================================================================
    //  交互
    // ================================================================

    /**
     * 点击某条记录——跳转到该好友的农场
     */
    private _onTapItem(interaction: IInteraction): void {
        EventManager.emit(GameEvents.ENTER_FRIEND_FARM, {
            friendId: interaction.fromUserId
        })
    }

    // ================================================================
    //  红点 / 未读提示
    // ================================================================

    /**
     * 更新红点状态
     * 可在外部定时调用以检测新消息
     */
    public updateRedDot(): void {
        this._updateRedDot()
    }

    /**
     * 刷新未读消息红点和数字
     */
    private _updateRedDot(): void {
        const unreadCount = this._interactions.filter(
            i => i.createdAt > this._lastViewTime
        ).length

        if (this.redDot) {
            this.redDot.active = unreadCount > 0
        }
        if (this.unreadCountLabel) {
            this.unreadCountLabel.string = unreadCount > 99
                ? '99+'
                : `${unreadCount}`
            this.unreadCountLabel.node.active = unreadCount > 0
        }
    }

    /**
     * 获取未读互动数量
     * 供 SocialManager 或底部 Tab 红点使用
     */
    public get unreadCount(): number {
        return this._interactions.filter(
            i => i.createdAt > this._lastViewTime
        ).length
    }

    /**
     * 手动刷新互动记录（供刷新按钮调用）
     */
    public async refresh(): Promise<void> {
        await this._loadInteractions()
        this._updateRedDot()
    }

    // ================================================================
    //  辅助
    // ================================================================

    private _showLoading(visible: boolean): void {
        if (this.loadingNode) {
            this.loadingNode.active = visible
        }
    }
}