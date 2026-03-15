// ============================================================
// 文件：scripts/social/FriendPlotNode.ts
// 说明：好友农场中单个地块的显示和交互（偷菜/帮浇水/帮除虫）
// 负责人：B
// 调用方：FriendFarmScene 创建地块时挂载
// 发出事件：
//   - STEAL_SUCCESS → 偷菜成功（C 弹提示）
//   - STEAL_FAILED → 偷菜失败（C 弹提示）
//   - FRIEND_WATERED → 帮浇水完成（C 弹提示）
// 调用CloudAPI：CloudAPI.steal(), CloudAPI.waterFriend()
// 引用A的文件：import { CropGrowth } from '../farm/CropGrowth'（复用生长计算）
// ============================================================

import {
    _decorator, Component, Node, Sprite, Label,
    Color, tween, Vec3, UIOpacity, SpriteFrame
} from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { Utils } from '../shared/Utils'
import { CropConfig } from '../config/CropConfig'
import { IPlotData, ICropData, CropStatus } from '../shared/Interfaces'
import { StealAction } from './StealAction'
const { ccclass, property } = _decorator

/** 帮好友浇水消耗体力 */
const WATER_FRIEND_ENERGY_COST: number = 2

@ccclass('FriendPlotNode')
export class FriendPlotNode extends Component {

    /** 作物图片 */
    @property(Sprite)
    cropSprite: Sprite = null!

    /** 状态文字（"可偷取"/"已偷过"/"3时20分"） */
    @property(Label)
    statusLabel: Label = null!

    /** 作物名称标签 */
    @property(Label)
    cropNameLabel: Label = null!

    /** 可偷手掌图标 */
    @property(Node)
    stealIcon: Node = null!

    /** 缺水水滴图标 */
    @property(Node)
    waterIcon: Node = null!

    /** 虫子图标 */
    @property(Node)
    bugIcon: Node = null!

    /** 已偷灰色标记 */
    @property(Node)
    stolenMark: Node = null!

    /** 空地标记 */
    @property(Node)
    emptyMark: Node = null!

    /** 地块底图 */
    @property(Sprite)
    plotBg: Sprite = null!

    /** 地块数据 */
    private _plotData: IPlotData = null!

    /** 好友 openId */
    private _friendId: string = ''

    /** 偷菜操作器（所有地块共享一个实例以跟踪冷却/次数） */
    private static _stealAction: StealAction = new StealAction()

    /** 是否正在执行操作（防止重复点击） */
    private _busy: boolean = false

    // ================================================================
    //  初始化
    // ================================================================

    /**
     * 初始化地块
     * @param plotData  地块数据（含作物信息）
     * @param friendId  好友 openId
     */
    init(plotData: IPlotData, friendId: string): void {
        this._plotData = plotData
        this._friendId = friendId
        this._render()
        this.node.on(Node.EventType.TOUCH_END, this._onClick, this)
    }

    // ================================================================
    //  渲染
    // ================================================================

    /**
     * 根据地块数据更新显示
     */
    private _render(): void {
        const crop = this._plotData.crop

        // ---- 空地 ----
        if (!crop) {
            this._showEmpty()
            return
        }

        // ---- 有作物 ----
        this.cropSprite.node.active = true
        if (this.emptyMark) this.emptyMark.active = false

        // 作物名称
        const cfg = CropConfig.get(crop.cropId)
        if (this.cropNameLabel) {
            this.cropNameLabel.string = cfg.name
        }

        // 虫子
        this.bugIcon.active = crop.hasBug

        // 按状态区分显示
        switch (crop.status) {
            case CropStatus.MATURE:
                this._renderMature(crop)
                break
            case CropStatus.GROWING:
                this._renderGrowing(crop)
                break
            case CropStatus.WITHERED:
                this._renderWithered()
                break
        }
    }

    /**
     * 空地显示
     */
    private _showEmpty(): void {
        this.cropSprite.node.active = false
        this.stealIcon.active = false
        this.waterIcon.active = false
        this.bugIcon.active = false
        this.stolenMark.active = false
        if (this.emptyMark) this.emptyMark.active = true
        this.statusLabel.string = '空地'
        if (this.cropNameLabel) this.cropNameLabel.string = ''
    }

    /**
     * 成熟状态显示
     */
    private _renderMature(crop: ICropData): void {
        const alreadyStolen = crop.stolenBy.includes(UserModel.openId)
        const isProtected = crop.protectedUntil != null && crop.protectedUntil > Date.now()

        this.stealIcon.active = !alreadyStolen && !isProtected
        this.stolenMark.active = alreadyStolen
        this.waterIcon.active = false

        if (alreadyStolen) {
            this.statusLabel.string = '已偷过'
            this.statusLabel.color = new Color(150, 150, 150, 255)
        } else if (isProtected) {
            this.statusLabel.string = '受保护'
            this.statusLabel.color = new Color(100, 180, 255, 255)
        } else {
            this.statusLabel.string = '可偷取'
            this.statusLabel.color = new Color(255, 100, 50, 255)
        }

        // 可偷图标呼吸动画
        if (this.stealIcon.active) {
            this._playBreathAnim(this.stealIcon)
        }
    }

    /**
     * 生长中状态显示
     */
    private _renderGrowing(crop: ICropData): void {
        this.stealIcon.active = false
        this.stolenMark.active = false

        // 计算剩余时间
        const elapsed = (Date.now() - crop.plantedAt) / 1000
        const effectiveGrowTime = crop.growTime * (1 - crop.speedBoost)
        const remain = Math.max(0, effectiveGrowTime - elapsed)

        this.statusLabel.string = Utils.formatTime(Math.ceil(remain))
        this.statusLabel.color = new Color(80, 180, 80, 255)

        // 缺水判断：简化——浇水次数不足配置的一半即视为缺水
        const cfg = CropConfig.get(crop.cropId)
        const progress = elapsed / effectiveGrowTime
        const expectedWater = Math.floor(progress * cfg.needWater)
        const needsWater = crop.waterCount < expectedWater
        this.waterIcon.active = needsWater
    }

    /**
     * 枯萎状态显示
     */
    private _renderWithered(): void {
        this.stealIcon.active = false
        this.stolenMark.active = false
        this.waterIcon.active = false
        this.statusLabel.string = '已枯萎'
        this.statusLabel.color = new Color(150, 150, 150, 255)
    }

    // ================================================================
    //  交互
    // ================================================================

    /**
     * 点击地块回调
     */
    private async _onClick(): Promise<void> {
        if (this._busy) return
        const crop = this._plotData.crop
        if (!crop) return

        // 优先级 1：成熟且未偷过 → 偷菜
        if (crop.status === CropStatus.MATURE &&
            !crop.stolenBy.includes(UserModel.openId)) {
            await this.doSteal()
            return
        }

        // 优先级 2：有虫 → 帮除虫
        if (crop.hasBug) {
            await this._doRemoveBug()
            return
        }

        // 优先级 3：缺水 → 帮浇水
        if (crop.status === CropStatus.GROWING && this.waterIcon.active) {
            await this._doWaterFriend()
            return
        }
    }

    /**
     * 执行偷菜（公开方法，供 FriendFarmScene 一键偷菜调用）
     */
    async doSteal(): Promise<void> {
        const crop = this._plotData.crop
        if (!crop) return

        // 前置检查
        const checkResult = FriendPlotNode._stealAction.check(crop, this._friendId)
        if (!checkResult.canSteal) {
            EventManager.emit(GameEvents.STEAL_FAILED, { msg: checkResult.reason })
            return
        }

        this._busy = true

        try {
            const result = await FriendPlotNode._stealAction.execute(
                this._friendId,
                this._plotData.plotIndex
            )

            // 更新本地数据
            crop.stolenBy.push(UserModel.openId)

            // 更新显示
            this.stealIcon.active = false
            this.stolenMark.active = true
            this.statusLabel.string = '已偷过'
            this.statusLabel.color = new Color(150, 150, 150, 255)

            // 播放偷菜动画
            this._playStealAnim()

        } catch (e) {
            // 事件已在 StealAction 内部发出
            console.warn('[FriendPlotNode] 偷菜失败', e)
        } finally {
            this._busy = false
        }
    }

    /**
     * 帮好友浇水
     */
    private async _doWaterFriend(): Promise<void> {
        // 体力检查
        if (UserModel.energy < WATER_FRIEND_ENERGY_COST) {
            EventManager.emit(GameEvents.API_ERROR, {
                code: -1,
                msg: '体力不足，无法帮好友浇水'
            })
            return
        }

        this._busy = true

        try {
            const result = await CloudAPI.waterFriend(
                this._friendId,
                this._plotData.plotIndex
            )

            // 更新显示
            this.waterIcon.active = false

            // 播放浇水动画
            this._playWaterAnim()

            // 发出事件
            EventManager.emit(GameEvents.FRIEND_WATERED, result)

        } catch (e) {
            console.error('[FriendPlotNode] 帮浇水失败', e)
        } finally {
            this._busy = false
        }
    }

    /**
     * 帮除虫（简化处理——目前无专门的云函数，仅做前端演示）
     */
    private async _doRemoveBug(): Promise<void> {
        this._busy = true

        try {
            // TODO: 当后端提供 removeBug 接口后替换
            // 暂时直接修改本地数据
            if (this._plotData.crop) {
                this._plotData.crop.hasBug = false
            }
            this.bugIcon.active = false

            // 播放除虫动画
            this._playRemoveBugAnim()

        } finally {
            this._busy = false
        }
    }

    // ================================================================
    //  动画
    // ================================================================

    /**
     * 呼吸动画（可偷图标上下浮动）
     */
    private _playBreathAnim(target: Node): void {
        tween(target)
            .repeatForever(
                tween()
                    .to(0.6, { position: new Vec3(0, 8, 0) }, { easing: 'sineInOut' })
                    .to(0.6, { position: new Vec3(0, 0, 0) }, { easing: 'sineInOut' })
            )
            .start()
    }

    /**
     * 偷菜成功动画：作物图缩小淡出
     */
    private _playStealAnim(): void {
        if (!this.cropSprite.node.active) return
        const opacityComp = this.cropSprite.node.getComponent(UIOpacity)
            || this.cropSprite.node.addComponent(UIOpacity)

        tween(this.cropSprite.node)
            .to(0.3, { scale: new Vec3(0.6, 0.6, 1) }, { easing: 'backIn' })
            .call(() => {
                // 动画结束后恢复
                this.cropSprite.node.setScale(new Vec3(1, 1, 1))
            })
            .start()

        tween(opacityComp)
            .to(0.3, { opacity: 120 })
            .call(() => {
                opacityComp.opacity = 255
            })
            .start()
    }

    /**
     * 浇水动画：水滴图标放大消失
     */
    private _playWaterAnim(): void {
        if (!this.waterIcon.active) return
        const copy = this.waterIcon
        tween(copy)
            .to(0.4, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'sineOut' })
            .call(() => {
                copy.setScale(new Vec3(1, 1, 1))
                copy.active = false
            })
            .start()
    }

    /**
     * 除虫动画：虫子图标抖动后消失
     */
    private _playRemoveBugAnim(): void {
        if (!this.bugIcon.active) return
        tween(this.bugIcon)
            .to(0.05, { position: new Vec3(3, 0, 0) })
            .to(0.05, { position: new Vec3(-3, 0, 0) })
            .to(0.05, { position: new Vec3(3, 0, 0) })
            .to(0.05, { position: new Vec3(0, 0, 0) })
            .to(0.2, { scale: new Vec3(0, 0, 1) })
            .call(() => {
                this.bugIcon.setScale(new Vec3(1, 1, 1))
                this.bugIcon.active = false
            })
            .start()
    }

    // ================================================================
    //  只读属性
    // ================================================================

    /**
     * 当前地块是否可偷
     * 供 FriendFarmScene 一键偷菜时快速筛选
     */
    get canSteal(): boolean {
        const crop = this._plotData.crop
        if (!crop) return false
        if (crop.status !== CropStatus.MATURE) return false
        if (crop.stolenBy.includes(UserModel.openId)) return false
        if (crop.protectedUntil && crop.protectedUntil > Date.now()) return false
        return true
    }

    /** 地块编号 */
    get plotIndex(): number {
        return this._plotData.plotIndex
    }
}