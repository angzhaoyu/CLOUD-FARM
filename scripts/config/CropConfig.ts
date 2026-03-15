// ============================================================
// 文件：scripts/config/CropConfig.ts
// 说明：所有作物的静态配置（名称、价格、生长时间、阶段图等）
// 负责人：F
// 调用方：
//   - A（种植时读取生长时间、阶段图）
//   - B（好友农场中读取作物名称）
//   - C（商店/种子选择中读取价格、解锁等级）
//   - D（云函数中校验种植/收获参数）
// 规则：只读不改，需要新增/修改作物联系 F
// ============================================================

import { ICropConfig, CropCategory } from '../shared/Interfaces'

const CROP_LIST: ICropConfig[] = [
  {
    cropId: 'cabbage',
    name: '白菜',
    category: CropCategory.VEGETABLE,
    seedPrice: 5,
    sellPrice: 10,
    growTime: 7200,       // 2小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 8,
    unlockLevel: 1,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,     // 成熟后2小时枯萎
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_cabbage_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_cabbage_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_cabbage_grow' },
      { name: '结球',  progress: 0.8, spriteFrame: 'crop_cabbage_ball' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_cabbage_mature' },
    ]
  },
  {
    cropId: 'lettuce',
    name: '生菜',
    category: CropCategory.VEGETABLE,
    seedPrice: 8,
    sellPrice: 15,
    growTime: 10800,      // 3小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 10,
    unlockLevel: 1,
    harvestMin: 2,
    harvestMax: 5,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_lettuce_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_lettuce_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_lettuce_grow' },
      { name: '茂盛',  progress: 0.8, spriteFrame: 'crop_lettuce_lush' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_lettuce_mature' },
    ]
  },
  {
    cropId: 'radish',
    name: '萝卜',
    category: CropCategory.VEGETABLE,
    seedPrice: 10,
    sellPrice: 20,
    growTime: 14400,      // 4小时
    needWater: 3,
    needFertilizer: 1,
    expReward: 15,
    unlockLevel: 3,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_radish_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_radish_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_radish_grow' },
      { name: '膨大',  progress: 0.8, spriteFrame: 'crop_radish_big' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_radish_mature' },
    ]
  },
  {
    cropId: 'tomato',
    name: '番茄',
    category: CropCategory.VEGETABLE,
    seedPrice: 15,
    sellPrice: 35,
    growTime: 28800,      // 8小时
    needWater: 3,
    needFertilizer: 2,
    expReward: 20,
    unlockLevel: 5,
    harvestMin: 2,
    harvestMax: 4,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_tomato_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_tomato_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_tomato_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_tomato_flower' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_tomato_mature' },
    ]
  },
  {
    cropId: 'sunflower',
    name: '向日葵',
    category: CropCategory.FLOWER,
    seedPrice: 12,
    sellPrice: 25,
    growTime: 21600,      // 6小时
    needWater: 2,
    needFertilizer: 1,
    expReward: 15,
    unlockLevel: 2,
    harvestMin: 1,
    harvestMax: 3,
    witherTime: 10800,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_sunflower_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_sunflower_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_sunflower_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_sunflower_bloom' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_sunflower_mature' },
    ]
  },
  {
    cropId: 'strawberry',
    name: '草莓',
    category: CropCategory.FRUIT,
    seedPrice: 25,
    sellPrice: 60,
    growTime: 43200,      // 12小时
    needWater: 4,
    needFertilizer: 2,
    expReward: 30,
    unlockLevel: 7,
    harvestMin: 2,
    harvestMax: 5,
    witherTime: 7200,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_strawberry_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_strawberry_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_strawberry_grow' },
      { name: '开花',  progress: 0.8, spriteFrame: 'crop_strawberry_flower' },
      { name: '成熟',  progress: 1.0, spriteFrame: 'crop_strawberry_mature' },
    ]
  },
  {
    cropId: 'rose',
    name: '玫瑰',
    category: CropCategory.FLOWER,
    seedPrice: 30,
    sellPrice: 80,
    growTime: 57600,      // 16小时
    needWater: 4,
    needFertilizer: 2,
    expReward: 35,
    unlockLevel: 10,
    harvestMin: 1,
    harvestMax: 3,
    witherTime: 10800,
    stages: [
      { name: '种子',  progress: 0,   spriteFrame: 'crop_rose_seed' },
      { name: '发芽',  progress: 0.2, spriteFrame: 'crop_rose_sprout' },
      { name: '生长',  progress: 0.5, spriteFrame: 'crop_rose_grow' },
      { name: '含苞',  progress: 0.8, spriteFrame: 'crop_rose_bud' },
      { name: '盛开',  progress: 1.0, spriteFrame: 'crop_rose_mature' },
    ]
  },
]

export class CropConfig {

  private static _map: Map<string, ICropConfig> = new Map()

  /** 初始化（游戏启动时调用一次） */
  static init(): void {
    CROP_LIST.forEach(c => this._map.set(c.cropId, c))
  }

  /**
   * 获取某作物配置
   * @param cropId 作物ID
   *
   * 示例：
   *   const cfg = CropConfig.get('tomato')
   *   console.log(cfg.name)       // "番茄"
   *   console.log(cfg.growTime)   // 28800
   *   console.log(cfg.sellPrice)  // 35
   */
  static get(cropId: string): ICropConfig {
    const cfg = this._map.get(cropId)
    if (!cfg) throw new Error(`未知作物: ${cropId}`)
    return cfg
  }

  /** 获取所有作物列表 */
  static getAll(): ICropConfig[] {
    return CROP_LIST
  }

  /** 获取指定等级已解锁的作物 */
  static getUnlocked(level: number): ICropConfig[] {
    return CROP_LIST.filter(c => c.unlockLevel <= level)
  }

  /** 获取指定分类的作物 */
  static getByCategory(category: CropCategory): ICropConfig[] {
    return CROP_LIST.filter(c => c.category === category)
  }
}
