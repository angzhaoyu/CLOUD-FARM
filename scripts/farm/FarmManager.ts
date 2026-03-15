// ============================================================
// 文件：scripts/farm/FarmManager.ts
// 说明：农场主管理器，管理所有地块、作物生长刷新、场景初始化
// 负责人：A
// 调用方：Farm.scene 根节点挂载，游戏启动后自动运行
// 监听事件：
//   - GAME_DATA_READY → 初始化农场地块
//   - SEED_SELECTED → 执行种植
//   - LEAVE_FRIEND_FARM → 从好友农场返回时刷新
// 发出事件：CROP_MATURED, CROP_WITHERED, BUG_APPEARED
// ============================================================

import { _decorator, Component, Node, Prefab, instantiate } from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { CloudAPI } from '../shared/CloudAPI'
import { PlotNode } from './PlotNode'
import { IPlotData, ICropData } from '../shared/Interfaces'

const { ccclass, property } = _decorator

/** 最大地块数 */
const MAX_PLOT_COUNT = 16
/** 默认显示地块数（随等级解锁更多） */
const INITIAL_PLOT_COUNT = 8
/** 布局参数 */
const LAYOUT_COLS = 4
const LAYOUT_SPACING_X = 160
const LAYOUT_SPACING_Y = 180
const LAYOUT_START_X = -240
const LAYOUT_START_Y = 100

@ccclass('FarmManager')
export class FarmManager extends Component {

  // ======== 编辑器绑定 ========
  @property(Prefab)
  plotPrefab: Prefab = null!

  @property(Node)
  plotContainer: Node = null!

  // ======== 内部状态 ========
  private _plotNodes: PlotNode[] = []
  private _currentTool: string = ''        // 'water' | 'fertilize' | ''
  private _isRefreshing: boolean = false

  // ================================================================
  //  Cocos 生命周期
  // ================================================================

  onLoad(): void {
    this._registerEvents()
  }

  start(): void {
    this._initPlots()
    // 每秒驱动所有地块的显示更新
    this.schedule(this._tickUpdate, 1.0)
  }

  onDestroy(): void {
    this._unregisterEvents()
    this.unschedule(this._tickUpdate)
  }

  // ================================================================
  //  公开属性（PlotNode 通过父级读取）
  // ================================================================

  /** 当前工具模式 */
  get currentTool(): string {
    return this._currentTool
  }

  // ================================================================
  //  初始化地块
  // ================================================================

  /**
   * 根据 UserModel.plots 创建地块节点
   */
  private _initPlots(): void {
    const serverPlots: IPlotData[] = UserModel.plots
    this._plotNodes = []

    for (let i = 0; i < INITIAL_PLOT_COUNT; i++) {
      // 优先使用服务器数据，否则创建默认
      const plotData: IPlotData = serverPlots.find(p => p.plotIndex === i) || {
        plotIndex: i,
        unlocked: false,
        crop: null
      }

      const node = instantiate(this.plotPrefab)
      this.plotContainer.addChild(node)

      const plotComp = node.getComponent(PlotNode)
      if (!plotComp) {
        console.error(`[FarmManager] plotPrefab 缺少 PlotNode 组件`)
        continue
      }
      plotComp.init(plotData)
      this._plotNodes.push(plotComp)
    }

    this._layoutPlots()
  }

  /**
   * 按网格排列地块位置（4 列 N 行）
   */
  private _layoutPlots(): void {
    this._plotNodes.forEach((plot, index) => {
      const col = index % LAYOUT_COLS
      const row = Math.floor(index / LAYOUT_COLS)
      plot.node.setPosition(
        LAYOUT_START_X + col * LAYOUT_SPACING_X,
        LAYOUT_START_Y - row * LAYOUT_SPACING_Y,
        0
      )
    })
  }

  // ================================================================
  //  每秒 Tick
  // ================================================================

  /**
   * 每秒调用，驱动所有地块的更新逻辑
   *  - 更新进度条 / 倒计时
   *  - 检测成熟 / 枯萎
   */
  private _tickUpdate(): void {
    for (const plotNode of this._plotNodes) {
      plotNode.updateDisplay()
    }
  }

  // ================================================================
  //  事件注册 / 注销
  // ================================================================

  private _registerEvents(): void {
    EventManager.on(GameEvents.SEED_SELECTED, this._onSeedSelected, this)
    EventManager.on(GameEvents.LEAVE_FRIEND_FARM, this._onBackFromFriend, this)
    EventManager.on(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.on(GameEvents.GAME_DATA_READY, this._onDataReady, this)
  }

  private _unregisterEvents(): void {
    EventManager.off(GameEvents.SEED_SELECTED, this._onSeedSelected, this)
    EventManager.off(GameEvents.LEAVE_FRIEND_FARM, this._onBackFromFriend, this)
    EventManager.off(GameEvents.LEVEL_UP, this._onLevelUp, this)
    EventManager.off(GameEvents.GAME_DATA_READY, this._onDataReady, this)
  }

  // ================================================================
  //  事件回调
  // ================================================================

  /**
   * 登录完成 / 数据就绪后刷新全部地块
   */
  private _onDataReady(): void {
    this._refreshAllPlots()
  }

  /**
   * C 的种子选择框选了一个种子
   * 数据格式：{ plotIndex: number, cropId: string }
   */
  private async _onSeedSelected(
    data: { plotIndex: number; cropId: string }
  ): Promise<void> {
    const { plotIndex, cropId } = data

    // 边界校验
    if (plotIndex < 0 || plotIndex >= this._plotNodes.length) {
      console.error(`[FarmManager] 无效地块索引: ${plotIndex}`)
      return
    }

    const plotNode = this._plotNodes[plotIndex]
    if (plotNode.plotData.crop) {
      EventManager.emit(GameEvents.API_ERROR, {
        code: -1, msg: '该地块已有作物'
      })
      return
    }

    try {
      const result = await CloudAPI.plant(plotIndex, cropId)
      plotNode.setCrop(result.crop)
      // 播放种植动画（在 PlotNode._render 中已处理基础显示）
      const { FarmAnimations } = await import('./FarmAnimations')
      FarmAnimations.playPlant(plotNode.node.getChildByName('CropSprite')!)
      EventManager.emit(GameEvents.CROP_PLANTED, { plotIndex, cropId })
    } catch (e) {
      console.error('[FarmManager] 种植失败:', e)
    }
  }

  /**
   * 从好友农场返回 → 刷新自己农场数据
   */
  private async _onBackFromFriend(): Promise<void> {
    if (this._isRefreshing) return
    this._isRefreshing = true
    try {
      await CloudAPI.refreshMyFarm()
      this._refreshAllPlots()
    } catch (e) {
      console.error('[FarmManager] 刷新农场失败:', e)
    } finally {
      this._isRefreshing = false
    }
  }

  /**
   * 升级 → 检查新解锁的地块
   */
  private _onLevelUp(data: { newLevel: number; unlockedContent: string[] }): void {
    for (const plotNode of this._plotNodes) {
      plotNode.checkUnlock(data.newLevel)
    }
  }

  // ================================================================
  //  刷新地块显示
  // ================================================================

  /**
   * 从 UserModel 重新读取数据，刷新所有地块
   */
  private _refreshAllPlots(): void {
    for (const plotNode of this._plotNodes) {
      const serverData = UserModel.getPlot(plotNode.plotIndex)
      if (serverData) {
        plotNode.refresh(serverData)
      }
    }
  }

  // ================================================================
  //  工具模式（供 C 的底部操作栏按钮调用）
  // ================================================================

  /**
   * 进入浇水模式
   * 所有可浇水的地块显示高亮边框
   */
  public enterWaterMode(): void {
    this._currentTool = 'water'
    this._applyHighlight()
  }

  /**
   * 进入施肥模式
   */
  public enterFertilizeMode(): void {
    this._currentTool = 'fertilize'
    this._applyHighlight()
  }

  /**
   * 退出工具模式（回到普通交互）
   */
  public exitToolMode(): void {
    this._currentTool = ''
    this._clearHighlight()
  }

  /**
   * 切换工具模式（已在该模式则退出，否则进入）
   */
  public toggleTool(tool: 'water' | 'fertilize'): void {
    if (this._currentTool === tool) {
      this.exitToolMode()
    } else {
      if (tool === 'water') this.enterWaterMode()
      else this.enterFertilizeMode()
    }
  }

  private _applyHighlight(): void {
    for (const p of this._plotNodes) {
      p.setHighlight(this._currentTool)
    }
  }

  private _clearHighlight(): void {
    for (const p of this._plotNodes) {
      p.clearHighlight()
    }
  }

  // ================================================================
  //  对外查询（B 模块进入好友农场前可能需要暂停 tick 等）
  // ================================================================

  /**
   * 暂停地块 tick 更新（切场景时调用）
   */
  public pauseTick(): void {
    this.unschedule(this._tickUpdate)
  }

  /**
   * 恢复地块 tick 更新
   */
  public resumeTick(): void {
    this.unschedule(this._tickUpdate)
    this.schedule(this._tickUpdate, 1.0)
  }

  /**
   * 获取指定地块组件
   */
  public getPlotNode(plotIndex: number): PlotNode | null {
    return this._plotNodes[plotIndex] || null
  }

  /**
   * 获取所有有成熟作物的地块索引
   */
  public getMaturePlotIndices(): number[] {
    return this._plotNodes
      .filter(p => p.plotData.crop?.status === CropStatus.MATURE)
      .map(p => p.plotIndex)
  }

  /**
   * 一键收获所有成熟作物
   */
  public async harvestAll(): Promise<void> {
    const matureIndices = this.getMaturePlotIndices()
    for (const idx of matureIndices) {
      try {
        const { HarvestAction } = await import('./HarvestAction')
        await HarvestAction.execute(idx)
        const plotNode = this._plotNodes[idx]
        plotNode.refresh(UserModel.getPlot(idx)!)
      } catch (e) {
        console.warn(`[FarmManager] 收获地块 ${idx} 失败:`, e)
      }
    }
  }
}

// 补充 import（FarmManager 内使用了 CropStatus 但没有 import）
import { CropStatus } from '../shared/Interfaces'