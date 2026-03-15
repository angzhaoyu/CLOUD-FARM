// ============================================================
// 文件：scripts/social/RankingPanel.ts
// 职责：排行榜面板——支持 harvest / level / steal 三种排行
// 维护人：B
// ============================================================

import {
    _decorator, Component, Node, Prefab, instantiate,
    Label, Color
} from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { UserModel } from '../shared/UserModel'
import { IRankItem, IRankingResult } from '../shared/Interfaces'
import { Utils } from '../shared/Utils'
const { ccclass, property } = _decorator

/** 排行类型配置 */
interface IRankTabConfig {
    type: 'harvest' | 'level' | 'steal'
    label: string
    unit: string
}

const RANK_TABS: IRankTabConfig[] = [
    { type: 'harvest', label: '收获榜', unit: '收获' },
    { type: 'level',   label: '等级榜', unit: '等级' },
    { type: 'steal',   label: '偷菜榜', unit: '偷取' },
]

/** 前三名颜色 */
const TOP_COLORS: Color[] = [
    new Color(255, 215, 0, 255),    // 金
    new Color(192, 192, 192, 255),  // 银
    new Color(205, 127, 50, 255),   // 铜
]

@ccclass('RankingPanel')
export class RankingPanel extends Component {

    /** 排行项预制体 */
    @property(Prefab)
    rankItemPrefab: Prefab = null!

    /** ScrollView 的 content 节点 */
    @property(Node)
    listContent: Node = null!

    /** 我的排名标签 */
    @property(Label)
    myRankLabel: Label = null!

    /** 我的数值标签 */
    @property(Label)
    myValueLabel: Label = null!

    /** 标题标签 */
    @property(Label)
    titleLabel: Label = null!

    /** 3 个 Tab 按钮节点 */
    @property([Node])
    tabBtns: Node[] = []

    /** 3 个 Tab 文字标签 */
    @property([Label])
    tabLabels: Label[] = []

    /** 空列表提示 */
    @property(Node)
    emptyTip: Node = null!

    /** 加载中提示 */
    @property(Node)
    loadingNode: Node = null!

    /** 当前选中的排行类型 */
    private _currentType: 'harvest' | 'level' | 'steal' = 'harvest'

    /** 当前排行数据 */
    private _rankData: IRankingResult | null = null

    /** 是否正在加载 */
    private _loading: boolean = false

    // ================================================================
    //  显示 / 隐藏
    // ================================================================

    /**
     * 打开排行榜面板
     * 默认显示收获榜
     */
    async show(): Promise<void> {
        this.node.active = true
        this._initTabs()
        this._selectTab(0)
        await this._loadRanking()
    }

    /**
     * 隐藏面板
     */
    hide(): void {
        this.node.active = false
    }

    // ================================================================
    //  Tab 管理
    // ================================================================

    /**
     * 初始化 Tab 按钮
     */
    private _initTabs(): void {
        this.tabBtns.forEach((btn, i) => {
            // 设置 Tab 文字
            if (i < this.tabLabels.length && i < RANK_TABS.length) {
                this.tabLabels[i].string = RANK_TABS[i].label
            }
            // 绑定点击事件
            btn.off(Node.EventType.TOUCH_END)
            btn.on(Node.EventType.TOUCH_END, () => {
                if (i < RANK_TABS.length) {
                    this._currentType = RANK_TABS[i].type
                    this._selectTab(i)
                    this._loadRanking()
                }
            })
        })
    }

    /**
     * 高亮选中的 Tab
     */
    private _selectTab(activeIndex: number): void {
        this.tabBtns.forEach((btn, i) => {
            const label = btn.getChildByName('Label')
            if (label) {
                const comp = label.getComponent(Label)
                if (comp) {
                    comp.color = (i === activeIndex)
                        ? new Color(255, 120, 30, 255)
                        : new Color(100, 100, 100, 255)
                }
            }
        })
    }

    // ================================================================
    //  数据加载
    // ================================================================

    /**
     * 加载当前类型的排行榜
     */
    private async _loadRanking(): Promise<void> {
        if (this._loading) return
        this._loading = true
        this._showLoading(true)

        try {
            this._rankData = await CloudAPI.getRanking(this._currentType)
            this._renderMyRank()
            this._renderList()
        } catch (e) {
            console.error('[RankingPanel] 获取排行榜失败', e)
            this._rankData = null
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
     * 渲染"我的排名"区域
     */
    private _renderMyRank(): void {
        if (!this._rankData) return

        const tabCfg = RANK_TABS.find(t => t.type === this._currentType)
        const unit = tabCfg ? tabCfg.unit : ''

        if (this.myRankLabel) {
            this.myRankLabel.string = this._rankData.myRank > 0
                ? `我的排名：第${this._rankData.myRank}名`
                : '我的排名：未上榜'
        }

        if (this.myValueLabel) {
            this.myValueLabel.string = `${unit}：${Utils.formatNumber(this._rankData.myValue)}`
        }

        if (this.titleLabel) {
            this.titleLabel.string = tabCfg ? tabCfg.label : '排行榜'
        }
    }

    /**
     * 渲染排行列表
     */
    private _renderList(): void {
        this.listContent.removeAllChildren()

        if (!this._rankData || this._rankData.list.length === 0) {
            if (this.emptyTip) this.emptyTip.active = true
            return
        }
        if (this.emptyTip) this.emptyTip.active = false

        this._rankData.list.forEach(item => {
            const node = instantiate(this.rankItemPrefab)
            this.listContent.addChild(node)
            this._setupRankItem(node, item)
        })
    }

    /**
     * 初始化单个排行条目
     */
    private _setupRankItem(node: Node, item: IRankItem): void {
        // 名次
        const rankNode = node.getChildByName('Rank')
        if (rankNode) {
            const label = rankNode.getComponent(Label)
            if (label) {
                label.string = `${item.rank}`
                // 前三名特殊颜色
                if (item.rank <= 3) {
                    label.color = TOP_COLORS[item.rank - 1]
                    label.fontSize = 28
                }
            }
        }

        // 昵称
        const nicknameNode = node.getChildByName('Nickname')
        if (nicknameNode) {
            const label = nicknameNode.getComponent(Label)
            if (label) {
                label.string = item.nickname
                // 高亮自己
                if (item.openId === UserModel.openId) {
                    label.color = new Color(30, 144, 255, 255)
                    label.string = `${item.nickname}（我）`
                }
            }
        }

        // 数值
        const valueNode = node.getChildByName('Value')
        if (valueNode) {
            const label = valueNode.getComponent(Label)
            if (label) {
                label.string = Utils.formatNumber(item.value)
            }
        }
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