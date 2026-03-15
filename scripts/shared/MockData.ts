// ============================================================
// 文件：scripts/shared/MockData.ts
// 说明：开发阶段的假数据，让前端不依赖后端就能自测
// 负责人：F
// 调用方：CloudAPI 内部（USE_MOCK=true 时自动调用）
// 规则：A/B/C 不需要关心此文件，只要 CloudAPI 返回格式正确即可
// ============================================================

import {
  ILoginResult, IPlantResult, IWaterResult,
  IHarvestResult, IStealResult, ISellResult,
  IBuyResult, ISignInResult, IRankingResult,
  IFriendFarmResult, IWaterFriendResult,
  IInteractionsResult, IFriendData,
  ITaskStatusResult, IClaimTaskResult,
  CropStatus, InteractionType, ICropData
} from './Interfaces'
import { CropConfig } from '../config/CropConfig'

export class MockData {

  /**
   * 根据云函数名称返回模拟数据
   * A/B/C 不需要关心此函数内部实现
   * 只要 CloudAPI 返回的格式正确即可
   */
  static getResponse(funcName: string, params: any): any {
    switch (funcName) {
      case 'login':
      case 'getMyFarm':
        return this._loginResult()
      case 'plant':
        return this._plantResult(params)
      case 'water':
        return this._waterResult(params)
      case 'harvest':
        return this._harvestResult(params)
      case 'steal':
        return this._stealResult(params)
      case 'sell':
        return this._sellResult(params)
      case 'buyItem':
        return this._buyResult(params)
      case 'signIn':
        return this._signInResult()
      case 'getFriends':
        return this._friendsList()
      case 'getFriendFarm':
        return this._friendFarm(params)
      case 'waterFriend':
        return this._waterFriendResult()
      case 'getRanking':
        return this._rankingResult()
      case 'getInteractions':
        return this._interactionsResult()
      case 'getTaskStatus':
        return this._taskStatusResult()
      case 'claimTask':
        return this._claimTaskResult()
      default:
        return { code: 0, msg: 'mock ok' }
    }
  }

  private static _loginResult(): ILoginResult {
    return {
      user: {
        openId: 'mock_user_001',
        nickname: '测试玩家',
        avatarUrl: '',
        level: 8,
        exp: 850,
        coins: 3280,
        diamonds: 50,
        energy: 80,
        energyMax: 116,
        signInDays: 3,
        lastSignInDate: '2025-01-14',
        lastEnergyUpdate: Date.now(),
        createdAt: Date.now() - 86400000 * 30
      },
      plots: [
        {
          plotIndex: 0, unlocked: true,
          crop: {
            cropId: 'lettuce',
            plantedAt: Date.now() - 5400000,
            growTime: 10800,
            status: CropStatus.GROWING,
            waterCount: 1, fertilizerCount: 0,
            hasBug: false, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        {
          plotIndex: 1, unlocked: true,
          crop: {
            cropId: 'tomato',
            plantedAt: Date.now() - 30000000,
            growTime: 28800,
            status: CropStatus.MATURE,
            waterCount: 3, fertilizerCount: 1,
            hasBug: false, speedBoost: 0.15,
            stolenBy: [], protectedUntil: null
          }
        },
        { plotIndex: 2, unlocked: true, crop: null },
        { plotIndex: 3, unlocked: true, crop: null },
        { plotIndex: 4, unlocked: true, crop: null },
        { plotIndex: 5, unlocked: true, crop: null },
        { plotIndex: 6, unlocked: true, crop: null },
        { plotIndex: 7, unlocked: false, crop: null },
      ],
      warehouse: [
        { cropId: 'lettuce', count: 12 },
        { cropId: 'tomato', count: 5 },
        { cropId: 'sunflower', count: 3 }
      ],
      isNewUser: false
    }
  }

  private static _plantResult(p: any): IPlantResult {
    const cfg = CropConfig.get(p.cropId)
    return {
      plotIndex: p.plotIndex,
      crop: {
        cropId: p.cropId,
        plantedAt: Date.now(),
        growTime: cfg.growTime,
        status: CropStatus.GROWING,
        waterCount: 0, fertilizerCount: 0,
        hasBug: false, speedBoost: 0,
        stolenBy: [], protectedUntil: null
      },
      newCoins: 3280 - cfg.seedPrice
    }
  }

  private static _waterResult(p: any): IWaterResult {
    return {
      plotIndex: p.plotIndex,
      newEnergy: 78,
      newWaterCount: 2,
      newSpeedBoost: 0.05
    }
  }

  private static _harvestResult(p: any): IHarvestResult {
    return {
      cropId: 'tomato',
      cropName: '番茄',
      count: 3,
      expGained: 20,
      newExp: 870,
      newLevel: 8,
      leveledUp: false
    }
  }

  private static _stealResult(p: any): IStealResult {
    return {
      cropId: 'strawberry',
      cropName: '草莓',
      count: 1
    }
  }

  private static _sellResult(p: any): ISellResult {
    const cfg = CropConfig.get(p.cropId)
    const total = cfg.sellPrice * p.count
    return {
      cropId: p.cropId,
      count: p.count,
      coinsGained: total,
      newCoins: 3280 + total
    }
  }

  private static _buyResult(p: any): IBuyResult {
    return {
      itemId: p.itemId,
      newCoins: 3180,
      newDiamonds: 50
    }
  }

  private static _signInResult(): ISignInResult {
    return {
      day: 4,
      reward: { day: 4, coins: 40, exp: 20, diamonds: 0, itemId: null },
      newCoins: 3320,
      newExp: 870
    }
  }

  private static _friendsList(): IFriendData[] {
    return [
      { openId: 'f001', nickname: '小红', avatarUrl: '', level: 10, hasMatureCrop: true },
      { openId: 'f002', nickname: '大明', avatarUrl: '', level: 6, hasMatureCrop: false },
      { openId: 'f003', nickname: '阿花', avatarUrl: '', level: 15, hasMatureCrop: true },
      { openId: 'f004', nickname: '老王', avatarUrl: '', level: 12, hasMatureCrop: false },
      { openId: 'f005', nickname: '小李', avatarUrl: '', level: 3, hasMatureCrop: true },
    ]
  }

  private static _friendFarm(p: any): IFriendFarmResult {
    return {
      userId: p.friendId,
      nickname: '小红',
      avatarUrl: '',
      level: 10,
      plots: [
        {
          plotIndex: 0, unlocked: true,
          crop: {
            cropId: 'strawberry',
            plantedAt: Date.now() - 50000000,
            growTime: 43200,
            status: CropStatus.MATURE,
            waterCount: 3, fertilizerCount: 2,
            hasBug: false, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        {
          plotIndex: 1, unlocked: true,
          crop: {
            cropId: 'tomato',
            plantedAt: Date.now() - 10000000,
            growTime: 28800,
            status: CropStatus.GROWING,
            waterCount: 1, fertilizerCount: 0,
            hasBug: true, speedBoost: 0,
            stolenBy: [], protectedUntil: null
          }
        },
        { plotIndex: 2, unlocked: true, crop: null },
        { plotIndex: 3, unlocked: true, crop: null },
        {
          plotIndex: 4, unlocked: true,
          crop: {
            cropId: 'rose',
            plantedAt: Date.now() - 60000000,
            growTime: 57600,
            status: CropStatus.MATURE,
            waterCount: 4, fertilizerCount: 2,
            hasBug: false, speedBoost: 0.15,
            stolenBy: ['mock_user_001'], protectedUntil: null
          }
        },
        { plotIndex: 5, unlocked: true, crop: null },
      ]
    }
  }

  private static _waterFriendResult(): IWaterFriendResult {
    return { rewardCoins: 5, rewardExp: 3, newEnergy: 76 }
  }

  private static _rankingResult(): IRankingResult {
    return {
      list: [
        { rank: 1, openId: 'r001', nickname: '农场大亨', avatarUrl: '', value: 1520 },
        { rank: 2, openId: 'f003', nickname: '阿花', avatarUrl: '', value: 960 },
        { rank: 3, openId: 'f001', nickname: '小红', avatarUrl: '', value: 860 },
        { rank: 4, openId: 'mock_user_001', nickname: '测试玩家', avatarUrl: '', value: 350 },
        { rank: 5, openId: 'f002', nickname: '大明', avatarUrl: '', value: 220 },
      ],
      myRank: 4,
      myValue: 350
    }
  }

  private static _interactionsResult(): IInteractionsResult {
    return {
      list: [
        {
          fromUserId: 'f001', fromNickname: '小红',
          toUserId: 'mock_user_001',
          type: InteractionType.STEAL,
          cropId: 'tomato', cropName: '番茄', count: 1,
          createdAt: Date.now() - 600000
        },
        {
          fromUserId: 'f002', fromNickname: '大明',
          toUserId: 'mock_user_001',
          type: InteractionType.WATER,
          cropId: '', cropName: '', count: 0,
          createdAt: Date.now() - 3600000
        },
      ]
    }
  }

  private static _taskStatusResult(): ITaskStatusResult {
    return {
      dailyTasks: [
        { taskId: 'd1', description: '登录游戏', target: 1, current: 1, rewardCoins: 20, rewardExp: 10, rewardDiamonds: 0, claimed: false },
        { taskId: 'd2', description: '浇水3次', target: 3, current: 1, rewardCoins: 15, rewardExp: 10, rewardDiamonds: 0, claimed: false },
        { taskId: 'd3', description: '收获1次', target: 1, current: 0, rewardCoins: 10, rewardExp: 15, rewardDiamonds: 0, claimed: false },
        { taskId: 'd4', description: '访问好友农场', target: 1, current: 0, rewardCoins: 10, rewardExp: 5, rewardDiamonds: 0, claimed: false },
        { taskId: 'd5', description: '帮好友浇水', target: 1, current: 0, rewardCoins: 10, rewardExp: 5, rewardDiamonds: 0, claimed: false },
      ],
      weeklyTasks: [
        { taskId: 'w1', description: '累计收获20个', target: 20, current: 8, rewardCoins: 200, rewardExp: 50, rewardDiamonds: 0, claimed: false },
        { taskId: 'w2', description: '连续登录7天', target: 7, current: 3, rewardCoins: 100, rewardExp: 30, rewardDiamonds: 5, claimed: false },
      ],
      allDailyDone: false
    }
  }

  private static _claimTaskResult(): IClaimTaskResult {
    return {
      newCoins: 3300,
      newExp: 860,
      newDiamonds: 50,
      newLevel: 8,
      leveledUp: false
    }
  }
}
