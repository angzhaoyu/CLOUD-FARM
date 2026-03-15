// ============================================================
// 文件：scripts/social/FriendFarmScene.ts
// 职责：好友农场场景的控制器
//       加载并展示好友的农场地块，提供偷菜 / 帮浇水等入口
// 挂载：Farm.scene 中覆盖层节点 FriendFarmRoot
// 维护人：B
// ============================================================

import { _decorator, Component, Node, Label, Prefab, instantiate, Vec3 } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import {
    IFriendFarmResult, IPlotData, CropStatus
} from '../shared/Interfaces'
import { FriendPlotNode } from './FriendPlotNode'
import { StealAction } from './StealAction'
const { ccclass, property } = _decorator

/** 地块网格布局常量 */
const GRID_COLS: number = 3
const GRID_SPACING_X: number = 180
const GRID_SPACING_Y: number = 160
const GRID_ORIGIN_X: number = -180
const GRID_ORIGIN_Y: number = 100

@ccclass('FriendFarmScene')
export class FriendFarmScene extends Component {

    /** 好友昵称标签 */
    @property(Label)
    friendName: Label = null!

    /** 好友等级标签 */
    @property(Label)
    friendLevel: Label = null!

    /** 地块预制体 */
    @property(Prefab)
    plotPrefab: Prefab = null!

    /** 地块容器节点 */
    @property(Node)
    plotContainer: Node = null!

    /** 返回按钮 */
    @property(Node)
    backBtn: Node = null!

    /** 一键偷菜按钮（可选） */
    @property(Node)
    stealAllBtn: Node = null!

    /** 加载中提示 */
    @property(Node)
    loadingNode: Node = null!

    /** 好友信息面板根节点 */
    @property(Node)
    friendInfoPanel: Node = null!

    /** 当前好友 openId */
    private _friendId: string = ''

    /** 好友农场数据 */
    private _farmData: IFriendFarmResult | null = null

    /** 地块组件缓存 */
    private _plotNodes: FriendPlotNode[] = []

    /** 偷菜操作管理器 */
    private _stealAction: StealAction = new StealAction()

    // ================================================================
    //  生命周期
    // ================================================================

    onLoad(): void {
        this.node.active = false
        this.backBtn.on(Node.EventType.TOUCH_END, this._onBack, this)

        if (this.stealAllBtn) {
            this.stealAllBtn.on(Node.EventType.TOUCH_END, this._onStealAll, this)
        }
    }

    // ================================================================
    //  加载好友农场
    // ================================================================

    /**
     * 加载并展示指定好友的农场
     * @param friendId 好友 openId
     */
    async loadFarm(friendId: string): Promise<void> {
        this._friendId = friendId
        this.node.active = true
        this._showLoading(true)

        try {
            this._farmData = await CloudAPI.getFriendFarm(friendId)
            this._render()
        } catch (e) {
            console.error('[FriendFarmScene] 加载好友农场失败', e)
            EventManager.emit(GameEvents.API_ERROR, {
                code: -1,
                msg: '加载好友农场失败'
            })
            this._onBack()
        } finally {
            this._showLoading(false)
        }
    }

    /**
     * 卸载好友农场视图
     */
    unloadFarm(): void {
        this._clearPlots()
        this._farmData = null
        this._friendId = ''
        this.node.active = false
    }

    // ================================================================
    //  渲染
    // ================================================================

    /**
     * 根据 _farmData 渲染好友农场
     */
    private _render(): void {
        if (!this._farmData) return

        // ---- 好友信息 ----
        this.friendName.string = this._farmData.nickname
        this.friendLevel.string = `Lv.${this._farmData.level}`

        // ---- 地块 ----
        this._clearPlots()

        this._farmData.plots.forEach((plotData, index) => {
            if (!plotData.unlocked) return

            const node = instantiate(this.plotPrefab)
            this.plotContainer.addChild(node)

            // 网格布局
            const col = index % GRID_COLS
            const row = Math.floor(index / GRID_COLS)
            node.setPosition(new Vec3(
                GRID_ORIGIN_X + col * GRID_SPACING_X,
                GRID_ORIGIN_Y - row * GRID_SPACING_Y,
                0
            ))

            const comp = node.getComponent(FriendPlotNode)
            if (comp) {
                comp.init(plotData, this._friendId)
                this._plotNodes.push(comp)
            }
        })

        // 更新一键偷菜按钮可见性
        this._updateStealAllBtn()
    }

    /**
     * 清空地块节点
     */
    private _clearPlots(): void {
        this.plotContainer.removeAllChildren()
        this._plotNodes = []
    }

    /**
     * 检查是否还有可偷地块，更新一键偷菜按钮状态
     */
    private _updateStealAllBtn(): void {
        if (!this.stealAllBtn) return
        const hasStealable = this._plotNodes.some(p => p.canSteal)
        this.stealAllBtn.active = hasStealable
    }

    // ================================================================
    //  交互
    // ================================================================

    /**
     * 返回按钮回调
     */
    private _onBack(): void {
        this.unloadFarm()
        EventManager.emit(GameEvents.LEAVE_FRIEND_FARM)
    }

    /**
     * 一键偷菜
     * 遍历所有可偷地块依次执行偷菜
     */
    private async _onStealAll(): Promise<void> {
        const stealablePlots = this._plotNodes.filter(p => p.canSteal)
        if (stealablePlots.length === 0) return

        for (const plotNode of stealablePlots) {
            try {
                await plotNode.doSteal()
            } catch (e) {
                // 单块失败不影响其余
                console.warn('[FriendFarmScene] 偷菜失败', e)
            }
        }

        this._updateStealAllBtn()
    }

    // ================================================================
    //  辅助
    // ================================================================

    private _showLoading(visible: boolean): void {
        if (this.loadingNode) {
            this.loadingNode.active = visible
        }
    }

    /** 获取当前好友 openId */
    public get friendId(): string {
        return this._friendId
    }

    /** 获取好友农场数据 */
    public get farmData(): IFriendFarmResult | null {
        return this._farmData
    }
}