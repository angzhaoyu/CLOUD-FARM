// ============================================================
// 文件：scripts/shared/Utils.ts
// 说明：通用工具函数（时间格式化、数字格式化、随机数等）
// 负责人：F
// 调用方：所有前端模块（A/B/C 按需调用）
// 规则：只读不改，需要新增工具函数联系 F
// ============================================================

export class Utils {

  /**
   * 格式化秒数为可读时间
   * @param seconds 秒数
   * @returns "2时30分" / "45分" / "已成熟"
   *
   * 示例：
   *   Utils.formatTime(9000)  → "2时30分"
   *   Utils.formatTime(300)   → "5分"
   *   Utils.formatTime(0)     → "已成熟"
   */
  static formatTime(seconds: number): string {
    if (seconds <= 0) return '已成熟'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}时${m}分`
    return `${m}分`
  }

  /**
   * 格式化时间戳为"多久前"
   * @param timestamp 毫秒时间戳
   * @returns "刚刚" / "5分钟前" / "2小时前" / "昨天"
   */
  static formatTimeAgo(timestamp: number): string {
    const diff = (Date.now() - timestamp) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  /**
   * 格式化数字，超过10000显示为"1.5万"
   */
  static formatNumber(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万'
    return n.toString()
  }

  /**
   * 随机整数 [min, max]（含两端）
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * 深拷贝
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }
}
