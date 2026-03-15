// ============================================================
// 文件：scripts/config/ShopConfig.ts
// 说明：商店商品配置（种子/道具/装饰的价格、效果）
// 负责人：F
// 调用方：
//   - C（商店面板渲染商品列表）
//   - D（云函数中校验购买价格）
// 规则：只读不改
// ============================================================

import { IShopItem } from '../shared/Interfaces'

const SHOP_LIST: IShopItem[] = [

  // ======== 种子类 ========
  {
    itemId: 'seed_cabbage',
    name: '白菜种子',
    description: '基础蔬菜，2小时成熟',
    price: 5,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_cabbage',
    effect: '种植白菜'
  },
  {
    itemId: 'seed_lettuce',
    name: '生菜种子',
    description: '嫩绿可口，3小时成熟',
    price: 8,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_lettuce',
    effect: '种植生菜'
  },
  {
    itemId: 'seed_radish',
    name: '萝卜种子',
    description: '营养丰富，4小时成熟（3级解锁）',
    price: 10,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_radish',
    effect: '种植萝卜'
  },
  {
    itemId: 'seed_sunflower',
    name: '向日葵种子',
    description: '阳光花朵，6小时成熟（2级解锁）',
    price: 12,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_sunflower',
    effect: '种植向日葵'
  },
  {
    itemId: 'seed_tomato',
    name: '番茄种子',
    description: '经典蔬果，8小时成熟（5级解锁）',
    price: 15,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_tomato',
    effect: '种植番茄'
  },
  {
    itemId: 'seed_strawberry',
    name: '草莓种子',
    description: '甜蜜果实，12小时成熟（7级解锁）',
    price: 25,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_strawberry',
    effect: '种植草莓'
  },
  {
    itemId: 'seed_rose',
    name: '玫瑰种子',
    description: '珍贵花朵，16小时成熟（10级解锁）',
    price: 30,
    currency: 'coins',
    category: 'seed',
    iconFrame: 'shop_seed_rose',
    effect: '种植玫瑰'
  },

  // ======== 道具类 ========
  {
    itemId: 'tool_fertilizer_normal',
    name: '普通肥料',
    description: '加速生长5%（8级解锁）',
    price: 20,
    currency: 'coins',
    category: 'tool',
    iconFrame: 'shop_fertilizer_normal',
    effect: '加速5%'
  },
  {
    itemId: 'tool_fertilizer_advanced',
    name: '高级肥料',
    description: '加速生长10%（12级解锁）',
    price: 50,
    currency: 'coins',
    category: 'tool',
    iconFrame: 'shop_fertilizer_advanced',
    effect: '加速10%'
  },
  {
    itemId: 'tool_fertilizer_super',
    name: '超级肥料',
    description: '加速生长20%（18级解锁）',
    price: 10,
    currency: 'diamonds',
    category: 'tool',
    iconFrame: 'shop_fertilizer_super',
    effect: '加速20%'
  },
  {
    itemId: 'tool_bug_spray',
    name: '杀虫剂',
    description: '立即清除害虫',
    price: 15,
    currency: 'coins',
    category: 'tool',
    iconFrame: 'shop_bug_spray',
    effect: '除虫'
  },
  {
    itemId: 'tool_protect_shield',
    name: '保护罩',
    description: '保护作物2小时不被偷（15级解锁）',
    price: 8,
    currency: 'diamonds',
    category: 'tool',
    iconFrame: 'shop_shield',
    effect: '防偷2小时'
  },
  {
    itemId: 'tool_energy_drink',
    name: '能量饮料',
    description: '立即恢复30点体力',
    price: 5,
    currency: 'diamonds',
    category: 'tool',
    iconFrame: 'shop_energy_drink',
    effect: '体力+30'
  },

  // ======== 装饰类 ========
  {
    itemId: 'decor_fence_wood',
    name: '木栅栏',
    description: '朴素的农场围栏',
    price: 100,
    currency: 'coins',
    category: 'decor',
    iconFrame: 'shop_fence_wood',
    effect: '装饰'
  },
  {
    itemId: 'decor_scarecrow',
    name: '稻草人',
    description: '可爱的稻草人摆件',
    price: 200,
    currency: 'coins',
    category: 'decor',
    iconFrame: 'shop_scarecrow',
    effect: '装饰'
  },
  {
    itemId: 'decor_fountain',
    name: '小喷泉',
    description: '精致喷泉，提升农场颜值',
    price: 20,
    currency: 'diamonds',
    category: 'decor',
    iconFrame: 'shop_fountain',
    effect: '装饰'
  },
]

export class ShopConfig {

  private static _map: Map<string, IShopItem> = new Map()

  /** 初始化 */
  static init(): void {
    SHOP_LIST.forEach(item => this._map.set(item.itemId, item))
  }

  /**
   * 获取指定商品
   * @param itemId 商品ID
   */
  static get(itemId: string): IShopItem {
    const item = this._map.get(itemId)
    if (!item) throw new Error(`未知商品: ${itemId}`)
    return item
  }

  /** 获取所有商品 */
  static getAll(): IShopItem[] {
    return SHOP_LIST
  }

  /** 按分类获取商品 */
  static getByCategory(category: 'seed' | 'tool' | 'decor'): IShopItem[] {
    return SHOP_LIST.filter(item => item.category === category)
  }

  /**
   * 从种子商品ID提取作物ID
   * @param seedItemId 如 "seed_tomato"
   * @returns 如 "tomato"，非种子返回 null
   */
  static seedToCropId(seedItemId: string): string | null {
    if (!seedItemId.startsWith('seed_')) return null
    return seedItemId.substring(5)
  }
}
