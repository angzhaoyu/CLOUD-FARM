// ============================================================
// 文件：scripts/config/LevelConfig.ts
// 说明：等级经验表、各等级解锁内容配置
// 负责人：F
// 调用方：
//   - UserModel 内部（升级计算）
//   - C（等级进度条显示）
//   - D（云函数中校验等级相关逻辑）
// 规则：只读不改
// ============================================================

interface ILevelEntry {
  level: number
  expNeeded: number        // 升到下一级所需经验
  plotUnlock: number       // 该等级拥有的地块数
  unlocks: string[]        // 该等级新解锁内容描述
}

const LEVEL_TABLE: ILevelEntry[] = [
  { level: 1,  expNeeded: 50,   plotUnlock: 6,  unlocks: ['白菜', '生菜'] },
  { level: 2,  expNeeded: 80,   plotUnlock: 6,  unlocks: ['向日葵'] },
  { level: 3,  expNeeded: 120,  plotUnlock: 6,  unlocks: ['萝卜'] },
  { level: 4,  expNeeded: 160,  plotUnlock: 7,  unlocks: ['第7块地'] },
  { level: 5,  expNeeded: 200,  plotUnlock: 7,  unlocks: ['番茄'] },
  { level: 6,  expNeeded: 260,  plotUnlock: 8,  unlocks: ['第8块地'] },
  { level: 7,  expNeeded: 320,  plotUnlock: 8,  unlocks: ['草莓'] },
  { level: 8,  expNeeded: 400,  plotUnlock: 9,  unlocks: ['第9块地', '普通肥料'] },
  { level: 9,  expNeeded: 480,  plotUnlock: 9,  unlocks: [] },
  { level: 10, expNeeded: 580,  plotUnlock: 10, unlocks: ['玫瑰', '第10块地'] },
  { level: 11, expNeeded: 680,  plotUnlock: 10, unlocks: [] },
  { level: 12, expNeeded: 800,  plotUnlock: 11, unlocks: ['第11块地', '高级肥料'] },
  { level: 13, expNeeded: 920,  plotUnlock: 11, unlocks: [] },
  { level: 14, expNeeded: 1060, plotUnlock: 12, unlocks: ['第12块地'] },
  { level: 15, expNeeded: 1200, plotUnlock: 12, unlocks: ['保护罩'] },
  { level: 16, expNeeded: 1360, plotUnlock: 13, unlocks: ['第13块地'] },
  { level: 17, expNeeded: 1520, plotUnlock: 13, unlocks: [] },
  { level: 18, expNeeded: 1700, plotUnlock: 14, unlocks: ['第14块地', '超级肥料'] },
  { level: 19, expNeeded: 1880, plotUnlock: 14, unlocks: [] },
  { level: 20, expNeeded: 2100, plotUnlock: 15, unlocks: ['第15块地'] },
  { level: 21, expNeeded: 2340, plotUnlock: 15, unlocks: [] },
  { level: 22, expNeeded: 2600, plotUnlock: 16, unlocks: ['第16块地'] },
  { level: 23, expNeeded: 2880, plotUnlock: 16, unlocks: [] },
  { level: 24, expNeeded: 3180, plotUnlock: 16, unlocks: [] },
  { level: 25, expNeeded: 3500, plotUnlock: 16, unlocks: ['金色种子'] },
  { level: 26, expNeeded: 3850, plotUnlock: 16, unlocks: [] },
  { level: 27, expNeeded: 4220, plotUnlock: 16, unlocks: [] },
  { level: 28, expNeeded: 4620, plotUnlock: 16, unlocks: [] },
  { level: 29, expNeeded: 5050, plotUnlock: 16, unlocks: [] },
  { level: 30, expNeeded: 99999, plotUnlock: 16, unlocks: ['满级称号'] },
]

export class LevelConfig {

  /**
   * 获取升到下一级所需经验
   * @param level 当前等级
   *
   * 示例：
   *   LevelConfig.getExpForLevel(5)  → 200
   */
  static getExpForLevel(level: number): number {
    const entry = LEVEL_TABLE.find(e => e.level === level)
    return entry ? entry.expNeeded : 99999
  }

  /**
   * 获取某等级新解锁的内容描述
   * @param level 等级
   * @returns 字符串数组，如 ['番茄', '第8块地']
   */
  static getUnlocks(level: number): string[] {
    const entry = LEVEL_TABLE.find(e => e.level === level)
    return entry ? entry.unlocks : []
  }

  /**
   * 获取某等级应有的地块数量
   * @param level 等级
   */
  static getPlotCount(level: number): number {
    // 找到不超过 level 的最大条目
    let count = 6
    for (const entry of LEVEL_TABLE) {
      if (entry.level <= level) {
        count = entry.plotUnlock
      } else {
        break
      }
    }
    return count
  }

  /**
   * 获取经验进度 0~1（当前等级内的百分比）
   * @param level 当前等级
   * @param exp   当前经验
   */
  static getExpProgress(level: number, exp: number): number {
    const needed = this.getExpForLevel(level)
    if (needed <= 0) return 1
    return Math.min(1, exp / needed)
  }

  /**
   * 获取最大等级
   */
  static get maxLevel(): number {
    return 30
  }

  /**
   * 获取完整等级表（UI 展示用）
   */
  static getAll(): ILevelEntry[] {
    return LEVEL_TABLE
  }
}
