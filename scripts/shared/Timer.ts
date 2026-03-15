// ============================================================
// 文件：scripts/shared/Timer.ts
// 说明：定时器管理工具
// 负责人：F
// 调用方：A（作物生长定时刷新）、C（体力恢复倒计时）
// 规则：只读不改
// ============================================================

type TimerCallback = () => void

interface TimerEntry {
  id: string
  callback: TimerCallback
  interval: number          // 秒
  elapsed: number           // 已过秒数
  repeat: boolean           // 是否重复
  paused: boolean
}

export class Timer {

  private static _timers: Map<string, TimerEntry> = new Map()
  private static _running: boolean = false
  private static _intervalHandle: number | null = null

  /** 每秒 tick 一次的基础频率（毫秒） */
  private static readonly TICK_MS = 1000

  // ================================================================
  //  启动 / 停止
  // ================================================================

  /**
   * 启动定时器系统（游戏启动时调用一次）
   * 内部使用 setInterval 每秒 tick
   */
  static start(): void {
    if (this._running) return
    this._running = true
    this._intervalHandle = setInterval(() => {
      this._tick()
    }, this.TICK_MS) as unknown as number
    console.log('[Timer] 定时器系统已启动')
  }

  /**
   * 停止定时器系统（游戏销毁时调用）
   */
  static stop(): void {
    if (!this._running) return
    this._running = false
    if (this._intervalHandle !== null) {
      clearInterval(this._intervalHandle)
      this._intervalHandle = null
    }
    console.log('[Timer] 定时器系统已停止')
  }

  // ================================================================
  //  注册 / 注销
  // ================================================================

  /**
   * 注册一个定时任务
   * @param id        唯一标识（重复注册会覆盖）
   * @param interval  触发间隔（秒）
   * @param callback  回调函数
   * @param repeat    是否重复执行，默认 true
   *
   * 示例：
   *   // 每 5 秒检测一次作物状态
   *   Timer.register('cropCheck', 5, () => { this.checkAllCrops() })
   *
   *   // 每 60 秒恢复一点体力
   *   Timer.register('energyRecover', 60, () => { this.recoverEnergy() })
   */
  static register(
    id: string,
    interval: number,
    callback: TimerCallback,
    repeat: boolean = true
  ): void {
    this._timers.set(id, {
      id,
      callback,
      interval,
      elapsed: 0,
      repeat,
      paused: false
    })
  }

  /**
   * 注销定时任务
   * @param id 任务标识
   */
  static unregister(id: string): void {
    this._timers.delete(id)
  }

  /**
   * 暂停指定定时任务
   */
  static pause(id: string): void {
    const entry = this._timers.get(id)
    if (entry) entry.paused = true
  }

  /**
   * 恢复指定定时任务
   */
  static resume(id: string): void {
    const entry = this._timers.get(id)
    if (entry) entry.paused = false
  }

  /**
   * 是否存在指定定时任务
   */
  static has(id: string): boolean {
    return this._timers.has(id)
  }

  /**
   * 清除所有定时任务（场景切换时调用）
   */
  static clearAll(): void {
    this._timers.clear()
  }

  // ================================================================
  //  内部 tick
  // ================================================================

  private static _tick(): void {
    const toRemove: string[] = []

    this._timers.forEach((entry) => {
      if (entry.paused) return

      entry.elapsed += 1

      if (entry.elapsed >= entry.interval) {
        try {
          entry.callback()
        } catch (e) {
          console.error(`[Timer] 回调执行出错 (${entry.id}):`, e)
        }

        if (entry.repeat) {
          entry.elapsed = 0
        } else {
          toRemove.push(entry.id)
        }
      }
    })

    toRemove.forEach(id => this._timers.delete(id))
  }

  // ================================================================
  //  便捷方法
  // ================================================================

  /**
   * 延迟执行一次（不重复）
   * @param id       唯一标识
   * @param delay    延迟秒数
   * @param callback 回调
   *
   * 示例：
   *   Timer.once('showTip', 3, () => { this.hideTip() })
   */
  static once(id: string, delay: number, callback: TimerCallback): void {
    this.register(id, delay, callback, false)
  }

  /**
   * 计算作物剩余生长时间（秒）
   * @param plantedAt   种植时间戳（ms）
   * @param growTime    总生长时间（秒）
   * @param speedBoost  加速比例 0~1
   * @returns 剩余秒数，<=0 表示已成熟
   */
  static getCropRemainTime(
    plantedAt: number,
    growTime: number,
    speedBoost: number
  ): number {
    const elapsed = (Date.now() - plantedAt) / 1000
    const boostedGrowTime = growTime * (1 - speedBoost)
    return Math.ceil(boostedGrowTime - elapsed)
  }

  /**
   * 计算作物当前生长进度 0~1
   */
  static getCropProgress(
    plantedAt: number,
    growTime: number,
    speedBoost: number
  ): number {
    const elapsed = (Date.now() - plantedAt) / 1000
    const boostedGrowTime = growTime * (1 - speedBoost)
    return Math.min(1, elapsed / boostedGrowTime)
  }
}
