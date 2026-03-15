// ============================================================
// 文件：scripts/shared/EventManager.ts
// 说明：事件总线，模块间唯一的通信方式
// 负责人：F
// 调用方：所有前端模块（A/B/C 通过 on/off/emit 通信）
// 规则：只读不改，需要修改联系 F
// ============================================================

type EventCallback = (data?: any) => void

export class EventManager {
  private static _handlers: Map<string, EventCallback[]> = new Map()

  /**
   * 监听事件
   * @param eventName 事件名，必须使用 GameEvents 中定义的常量
   * @param callback  回调函数
   * @param target    可选，用于 off 时识别
   *
   * 示例：
   *   EventManager.on(GameEvents.CROP_HARVESTED, this.onCropHarvested, this)
   */
  static on(eventName: string, callback: EventCallback, target?: any): void {
    if (!this._handlers.has(eventName)) {
      this._handlers.set(eventName, [])
    }
    const cb = target ? callback.bind(target) : callback
    ;(cb as any).__target = target
    ;(cb as any).__original = callback
    this._handlers.get(eventName)!.push(cb)
  }

  /**
   * 取消监听
   * @param eventName 事件名
   * @param callback  注册时传的同一个函数引用
   * @param target    注册时传的同一个 target
   *
   * 示例：
   *   EventManager.off(GameEvents.CROP_HARVESTED, this.onCropHarvested, this)
   */
  static off(eventName: string, callback: EventCallback, target?: any): void {
    const list = this._handlers.get(eventName)
    if (!list) return
    for (let i = list.length - 1; i >= 0; i--) {
      const cb = list[i] as any
      if (cb.__original === callback && cb.__target === target) {
        list.splice(i, 1)
      }
    }
  }

  /**
   * 发送事件
   * @param eventName 事件名
   * @param data      携带的数据（类型见 GameEvents.ts 中的注释）
   *
   * 示例：
   *   EventManager.emit(GameEvents.CROP_HARVESTED, {
   *     cropId: 'tomato', cropName: '番茄', count: 3, expGained: 20,
   *     newExp: 870, newLevel: 8, leveledUp: false
   *   })
   */
  static emit(eventName: string, data?: any): void {
    console.log(`[Event] ${eventName}`, data || '')
    const list = this._handlers.get(eventName)
    if (!list) return
    // 复制一份防止回调中修改列表
    const copy = [...list]
    for (const cb of copy) {
      try {
        cb(data)
      } catch (e) {
        console.error(`[Event] Error in handler for ${eventName}:`, e)
      }
    }
  }

  /** 清除所有事件监听（场景切换时调用） */
  static clear(): void {
    this._handlers.clear()
  }
}
