// ============================================================
// 文件：scripts/shared/CloudAPI.ts
// 说明：所有云函数调用的统一入口，USE_MOCK=true 时使用假数据
// 负责人：F
// 调用方：
//   - C（Launch场景）→ CloudAPI.login()
//   - A（农场操作）→ CloudAPI.plant() / water() / harvest()
//   - B（社交操作）→ CloudAPI.getFriends() / steal() / waterFriend()
//   - C（商店/仓库）→ CloudAPI.buyItem() / sell() / signIn()
// 规则：A/B/C 只调用不修改，联调时 F 将 USE_MOCK 改为 false
// ============================================================

import { MockData } from './MockData'
import { UserModel } from './UserModel'
import { EventManager } from './EventManager'
import { GameEvents } from './GameEvents'
import {
  IApiResult, ILoginResult, IPlantResult,
  IWaterResult, IHarvestResult, IStealResult,
  ISellResult, IBuyResult, ISignInResult,
  IRankingResult, IFriendFarmResult, IWaterFriendResult,
  IInteractionsResult, ITaskStatusResult, IClaimTaskResult,
  IFriendData
} from './Interfaces'

// 🔴 开发阶段 = true（用假数据）
// 🟢 联调阶段 = false（用真实后端）
const USE_MOCK = true

export class CloudAPI {

  /** 初始化云开发（游戏启动时调用一次） */
  static initCloud(): void {
    if (!USE_MOCK) {
      wx.cloud.init({
        env: 'cloud-farm-xxx',    // 替换为实际环境ID
        traceUser: true
      })
    }
  }

  // ================================================================
  //  登录 & 数据加载
  // ================================================================

  /**
   * 登录并获取用户全部数据
   * 调用方：C（Launch场景）
   * 返回后自动写入 UserModel
   */
  static async login(): Promise<ILoginResult> {
    const result = await this._call<ILoginResult>('login', {})
    UserModel.init(result)
    return result
  }

  /**
   * 刷新农场数据
   * 调用方：A（从好友农场返回时）
   */
  static async refreshMyFarm(): Promise<ILoginResult> {
    const result = await this._call<ILoginResult>('getMyFarm', {})
    UserModel.init(result)
    return result
  }

  // ================================================================
  //  农场操作（A 调用）
  // ================================================================

  /**
   * 种植
   * @param plotIndex 地块编号 0-15
   * @param cropId    作物ID，如 "tomato"
   */
  static async plant(plotIndex: number, cropId: string): Promise<IPlantResult> {
    const result = await this._call<IPlantResult>('plant', { plotIndex, cropId })
    // 更新本地数据
    UserModel.updatePlotCrop(plotIndex, result.crop)
    UserModel.changeCoins(-(UserModel.coins - result.newCoins))
    return result
  }

  /**
   * 给自己的作物浇水
   * @param plotIndex 地块编号
   */
  static async water(plotIndex: number): Promise<IWaterResult> {
    const result = await this._call<IWaterResult>('water', { plotIndex })
    // 更新本地数据
    const plot = UserModel.getPlot(plotIndex)
    if (plot && plot.crop) {
      plot.crop.waterCount = result.newWaterCount
      plot.crop.speedBoost = result.newSpeedBoost
    }
    UserModel.changeEnergy(-(UserModel.energy - result.newEnergy))
    return result
  }

  /**
   * 给自己的作物施肥
   * @param plotIndex 地块编号
   * @param fertilizerType 肥料类型 "normal" | "advanced" | "super"
   */
  static async fertilize(
    plotIndex: number,
    fertilizerType: string
  ): Promise<IWaterResult> {
    return this._call<IWaterResult>('fertilize', { plotIndex, fertilizerType })
  }

  /**
   * 收获
   * @param plotIndex 地块编号
   */
  static async harvest(plotIndex: number): Promise<IHarvestResult> {
    const result = await this._call<IHarvestResult>('harvest', { plotIndex })
    // 更新本地数据
    UserModel.updatePlotCrop(plotIndex, null) // 清空地块
    UserModel.addToWarehouse(result.cropId, result.count)
    UserModel.addExp(result.expGained)
    return result
  }

  // ================================================================
  //  社交操作（B 调用）
  // ================================================================

  /**
   * 获取好友列表
   */
  static async getFriends(): Promise<IFriendData[]> {
    return this._call<IFriendData[]>('getFriends', {})
  }

  /**
   * 获取好友农场数据
   * @param friendId 好友的 openId
   */
  static async getFriendFarm(friendId: string): Promise<IFriendFarmResult> {
    return this._call<IFriendFarmResult>('getFriendFarm', { friendId })
  }

  /**
   * 偷菜
   * @param targetUserId 目标用户 openId
   * @param plotIndex    目标地块编号
   */
  static async steal(
    targetUserId: string,
    plotIndex: number
  ): Promise<IStealResult> {
    const result = await this._call<IStealResult>('steal', {
      targetUserId, plotIndex
    })
    // 偷到的放入自己仓库
    UserModel.addToWarehouse(result.cropId, result.count)
    return result
  }

  /**
   * 帮好友浇水
   * @param friendId  好友 openId
   * @param plotIndex 好友的地块编号
   */
  static async waterFriend(
    friendId: string,
    plotIndex: number
  ): Promise<IWaterFriendResult> {
    const result = await this._call<IWaterFriendResult>('waterFriend', {
      friendId, plotIndex
    })
    UserModel.changeCoins(result.rewardCoins)
    UserModel.addExp(result.rewardExp)
    UserModel.changeEnergy(-(UserModel.energy - result.newEnergy))
    return result
  }

  /**
   * 获取互动记录（被偷/被浇水）
   */
  static async getInteractions(): Promise<IInteractionsResult> {
    return this._call<IInteractionsResult>('getInteractions', {})
  }

  /**
   * 获取排行榜
   * @param type 排行类型 "harvest" | "level" | "steal"
   */
  static async getRanking(
    type: 'harvest' | 'level' | 'steal'
  ): Promise<IRankingResult> {
    return this._call<IRankingResult>('getRanking', { type })
  }

  // ================================================================
  //  商店 & 仓库（C 调用）
  // ================================================================

  /**
   * 购买商品
   * @param itemId 商品ID
   * @param count  购买数量
   */
  static async buyItem(itemId: string, count: number): Promise<IBuyResult> {
    const result = await this._call<IBuyResult>('buyItem', { itemId, count })
    // 更新本地数据
    UserModel.changeCoins(-(UserModel.coins - result.newCoins))
    UserModel.changeDiamonds(-(UserModel.diamonds - result.newDiamonds))
    return result
  }

  /**
   * 卖出作物
   * @param cropId 作物ID
   * @param count  卖出数量
   */
  static async sell(cropId: string, count: number): Promise<ISellResult> {
    const result = await this._call<ISellResult>('sell', { cropId, count })
    UserModel.removeFromWarehouse(cropId, count)
    UserModel.changeCoins(result.coinsGained)
    return result
  }

  /**
   * 签到
   */
  static async signIn(): Promise<ISignInResult> {
    const result = await this._call<ISignInResult>('signIn', {})
    UserModel.changeCoins(result.reward.coins)
    UserModel.addExp(result.reward.exp)
    if (result.reward.diamonds > 0) {
      UserModel.changeDiamonds(result.reward.diamonds)
    }
    return result
  }

  /**
   * 获取任务状态
   */
  static async getTaskStatus(): Promise<ITaskStatusResult> {
    return this._call<ITaskStatusResult>('getTaskStatus', {})
  }

  /**
   * 领取任务奖励
   * @param taskId 任务ID
   */
  static async claimTask(taskId: string): Promise<IClaimTaskResult> {
    const result = await this._call<IClaimTaskResult>('claimTask', { taskId })
    UserModel.changeCoins(result.newCoins - UserModel.coins)
    UserModel.addExp(result.newExp - UserModel.exp)
    return result
  }

  // ================================================================
  //  内部方法
  // ================================================================

  private static async _call<T>(name: string, data: any): Promise<T> {
    if (USE_MOCK) {
      return this._mockCall<T>(name, data)
    }
    try {
      const res = await wx.cloud.callFunction({ name, data })
      const result = res.result as IApiResult<T>
      if (result.code !== 0) {
        EventManager.emit(GameEvents.API_ERROR, {
          code: result.code,
          msg: result.msg
        })
        throw new Error(result.msg)
      }
      return result.data!
    } catch (err) {
      console.error(`[CloudAPI] ${name} 失败:`, err)
      throw err
    }
  }

  private static async _mockCall<T>(name: string, data: any): Promise<T> {
    // 模拟200-500ms网络延迟
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const mockResult = MockData.getResponse(name, data)
    console.log(`[MockAPI] ${name}`, data, '→', mockResult)
    return JSON.parse(JSON.stringify(mockResult)) as T
  }
}
