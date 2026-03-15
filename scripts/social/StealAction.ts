// ============================================================
// 文件：scripts/social/StealAction.ts
// 职责：封装偷菜的业务逻辑——冷却判断、次数限制、调用 CloudAPI、
//       发出成功/失败事件
// 维护人：B
// 说明：不挂载到节点上，作为纯逻辑类由 FriendPlotNode 实例化使用
// ============================================================

import { CloudAPI } from '../shared/CloudAPI'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { IStealResult, ICropData, CropStatus } from '../shared/Interfaces'

/** 每个好友每天最多偷取次数 */
const MAX_STEAL_PER_FRIEND: number = 3

/** 两次偷菜之间的最小间隔（毫秒） */
const STEAL_COOLDOWN_MS: number = 3000

export class StealAction {

    /** 记录每个好友今天已偷次数：friendId → count */
    private _stealCountMap: Map<string, number> = new Map()

    /** 上一次偷菜时间戳，用于全局冷却 */
    private _lastStealTime: number = 0

    // ================================================================
    //  前置检查
    // ================================================================

    /**
     * 判断是否可以对该地块偷菜
     * @param crop      目标地块的作物数据
     * @param friendId  好友 openId
     * @returns { canSteal: boolean, reason: string }
     */
    check(crop: ICropData | null, friendId: string): { canSteal: boolean; reason: string } {
        // 空地
        if (!crop) {
            return { canSteal: false, reason: '空地' }
        }

        // 未成熟
        if (crop.status !== CropStatus.MATURE) {
            return { canSteal: false, reason: '作物尚未成熟' }
        }

        // 已枯萎
        if (crop.status === CropStatus.WITHERED) {
            return { canSteal: false, reason: '作物已枯萎' }
        }

        // 已被自己偷过
        if (crop.stolenBy.includes(UserModel.openId)) {
            return { canSteal: false, reason: '你已经偷过了' }
        }

        // 保护罩
        if (crop.protectedUntil && crop.protectedUntil > Date.now()) {
            return { canSteal: false, reason: '该作物有保护罩' }
        }

        // 单好友每日次数上限
        const count = this._stealCountMap.get(friendId) || 0
        if (count >= MAX_STEAL_PER_FRIEND) {
            return { canSteal: false, reason: `今天已偷该好友${MAX_STEAL_PER_FRIEND}次` }
        }

        // 全局冷却
        if (Date.now() - this._lastStealTime < STEAL_COOLDOWN_MS) {
            return { canSteal: false, reason: '操作太频繁，请稍后' }
        }

        return { canSteal: true, reason: '' }
    }

    // ================================================================
    //  执行偷菜
    // ================================================================

    /**
     * 执行一次偷菜操作
     * @param friendId   好友 openId
     * @param plotIndex  目标地块编号
     * @returns 偷菜结果（成功时）
     * @throws 失败时抛出异常
     */
    async execute(friendId: string, plotIndex: number): Promise<IStealResult> {
        // 更新冷却时间
        this._lastStealTime = Date.now()

        try {
            const result = await CloudAPI.steal(friendId, plotIndex)

            // 记录次数
            const count = this._stealCountMap.get(friendId) || 0
            this._stealCountMap.set(friendId, count + 1)

            // 发出成功事件
            EventManager.emit(GameEvents.STEAL_SUCCESS, result)

            return result
        } catch (e: unknown) {
            const msg = (e instanceof Error) ? e.message : '偷菜失败'
            EventManager.emit(GameEvents.STEAL_FAILED, { msg })
            throw e
        }
    }

    // ================================================================
    //  辅助
    // ================================================================

    /**
     * 获取今天已对某好友偷菜的次数
     */
    getStealCount(friendId: string): number {
        return this._stealCountMap.get(friendId) || 0
    }

    /**
     * 获取对某好友今天剩余可偷次数
     */
    getRemainingStealCount(friendId: string): number {
        return Math.max(0, MAX_STEAL_PER_FRIEND - this.getStealCount(friendId))
    }

    /**
     * 每日重置（新的一天时调用）
     */
    resetDaily(): void {
        this._stealCountMap.clear()
        this._lastStealTime = 0
    }

    /**
     * 是否处于全局冷却中
     */
    get isInCooldown(): boolean {
        return Date.now() - this._lastStealTime < STEAL_COOLDOWN_MS
    }

    /**
     * 剩余冷却时间（毫秒）
     */
    get cooldownRemainMs(): number {
        const remain = STEAL_COOLDOWN_MS - (Date.now() - this._lastStealTime)
        return Math.max(0, remain)
    }
}