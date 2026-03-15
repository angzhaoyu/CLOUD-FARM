// ============================================================
// 文件：scripts/farm/PlotNode.ts
// 说明：单个地块节点组件，处理地块的显示和点击交互
// 负责人：A
// 调用方：FarmManager 创建地块时挂载
// 发出事件：
//   - PLOT_EMPTY_CLICKED → 点击空地，请求弹出种子选择
//   - PLOT_CROP_CLICKED → 点击有作物的地块，请求显示详情
// 调用CloudAPI：CloudAPI.water(), CloudAPI.harvest()
// ============================================================

import {
  _decorator, Component, Node, Sprite, SpriteFrame,
  Label, ProgressBar, resources, Color, UIOpacity
} from 'cc'
import { EventManager } from '../shared/EventManager'
import { GameEvents } from '../shared/GameEvents'
import { UserModel } from '../shared/UserModel'
import { Utils } from '../shared/Utils'
import { CropGrowth } from './CropGrowth'
import { CropConfig } from '../config/CropConfig'
import { WaterAction } from './WaterAction'
import { FertilizeAction } from './FertilizeAction'
import { HarvestAction } from './HarvestAction'
import { FarmAnimations } from './FarmAnimations'
import { IPlotData, ICropData, CropStatus } from '../shared/Interfaces'

const { ccclass, property } = _decorator

/** 地块解锁等级表（plotIndex → 需要等级） */
const PLOT_UNLOCK_LEVELS: Record<number, number> = {
  0: 1, 1: 1, 2: 1, 3: 1,
  4: 2, 5: 3, 6: 5, 7: 8,
  8: 10, 9: 12, 10: 14, 11: 16,
  12: 18, 13: 20, 14: 23, 15: 26,
}

@ccclass('PlotNode')
export class PlotNode extends Component {

  // ======== 编辑器绑定 ========
  @property(Sprite)
  plotSprite: Sprite = null!

  @property(Sprite)
  cropSprite: Sprite = null!

  @property(Label)
  timeLabel: Label = null!

  @property(ProgressBar)
  progressBar: ProgressBar = null!

  @property(Node)
  waterIcon: Node = null!

  @property(Node)
  bugIcon: Node = null!

  @property(Node)
  matureEffect: Node = null!

  @property(Node)
  lockIcon: Node = null!

  @property(Label)
  lockLabel: Label = null!

  @property(Node)
  highlightBorder: Node = null!    // 高亮边框（工具模式下使用）

  // ======== 内部数据 ========
  private _plotData: IPlotData = null!
  private _hasFiredMature: boolean = false
  private _lastStageIndex: number = -1        // 上一次的阶段索引，用于检测阶段变化
  private _isOperating: boolean = false       // 防重复点击锁

  // ================================================================
  //  初始化 / 刷新
  // ================================================================

  /**
   * 初始化地块（FarmManager 创建地块时调用）
   */
  init(data: IPlotData): void {
    this._plotData = data
    this._hasFiredMature = data.crop?.status === CropStatus.MATURE
    this._lastStageIndex = -1
    this._isOperating = false
    this._render()
    this.node.on(Node.EventType.TOUCH_END, this._onClick, this)
  }

  /**
   * 从服务器刷新后更新整个地块
   */
  refresh(data: IPlotData): void {
    this._plotData = data
    this._hasFiredMature = data.crop?.status === CropStatus.MATURE
    this._lastStageIndex = -1
    this._isOperating = false
    this._render()
  }

  /**
   * 种植成功后设置作物
   */
  setCrop(crop: ICropData): void {
    this._plotData.crop = crop
    this._hasFiredMature = false
    this._lastStageIndex = -1
    this._render()
  }

  /** 获取当前地块数据 */
  get plotData(): IPlotData {
    return this._plotData
  }

  /** 获取地块索引 */
  get plotIndex(): number {
    return this._plotData.plotIndex
  }

  // ================================================================
  //  每秒更新（由 FarmManager.schedule 驱动）
  // ================================================================

  /**
   * 每秒调用，更新显示与状态检测
   */
  updateDisplay(): void {
    const crop = this._plotData.crop
    if (!crop) return
    if (!this._plotData.unlocked) return

    // ---- GROWING 状态 ----
    if (crop.status === CropStatus.GROWING) {
      const progress = CropGrowth.getProgress(crop)
      const remain = CropGrowth.getRemainSeconds(crop)
      const stageIdx = CropGrowth.getCurrentStageIndex(crop)

      // 更新进度条
      this.progressBar.progress = progress
      // 更新倒计时文字
      this.timeLabel.string = Utils.formatTime(remain)
      // 缺水图标
      this.waterIcon.active = CropGrowth.needsWater(crop)

      // 阶段变化时切换精灵图
      if (stageIdx !== this._lastStageIndex) {
        this._lastStageIndex = stageIdx
        const stage = CropGrowth.getCurrentStage(crop)
        this._loadCropSprite(stage.spriteFrame)
      }

      // 检查是否刚成熟
      if (progress >= 1.0 && !this._hasFiredMature) {
        this._hasFiredMature = true
        crop.status = CropStatus.MATURE
        this._onCropMature()
      }
      return
    }

    // ---- MATURE 状态 ----
    if (crop.status === CropStatus.MATURE) {
      if (CropGrowth.isWithered(crop)) {
        crop.status = CropStatus.WITHERED
        this._onCropWithered()
      }
      return
    }

    // WITHERED 状态不需要每帧更新
  }

  // ================================================================
  //  点击处理
  // ================================================================

  private _onClick(): void {
    if (this._isOperating) return

    // 点击反馈动画
    FarmAnimations.clickFeedback(this.node)

    // 1. 未解锁
    if (!this._plotData.unlocked) {
      const needLv = PLOT_UNLOCK_LEVELS[this._plotData.plotIndex] || 99
      EventManager.emit(GameEvents.API_ERROR, {
        code: -1,
        msg: `需要达到 Lv.${needLv} 解锁此地块`
      })
      return
    }

    // 2. 获取 FarmManager 的当前工具模式
    const tool = this._getCurrentTool()

    // 3. 空地 + 无工具 → 弹种子选择
    if (!this._plotData.crop && !tool) {
      EventManager.emit(GameEvents.PLOT_EMPTY_CLICKED, {
        plotIndex: this._plotData.plotIndex
      })
      return
    }

    // 4. 有作物 + 无工具
    if (this._plotData.crop && !tool) {
      const status = this._plotData.crop.status

      if (status === CropStatus.MATURE) {
        this._doHarvest()
        return
      }

      if (status === CropStatus.WITHERED) {
        // 清除枯萎作物
        HarvestAction.clearWithered(this._plotData.plotIndex)
        this._plotData.crop = null
        this._render()
        return
      }

      // GROWING → 弹出作物详情面板
      EventManager.emit(GameEvents.PLOT_CROP_CLICKED, {
        plotIndex: this._plotData.plotIndex,
        crop: this._plotData.crop
      })
      return
    }

    // 5. 有作物 + 浇水模式
    if (this._plotData.crop && tool === 'water') {
      this._doWater()
      return
    }

    // 6. 有作物 + 施肥模式
    if (this._plotData.crop && tool === 'fertilize') {
      this._doFertilize()
      return
    }
  }

  /**
   * 读取 FarmManager 的当前工具模式
   */
  private _getCurrentTool(): string {
    // plotContainer → FarmManager 所在节点
    const farmMgrNode = this.node.parent?.parent
    if (!farmMgrNode) return ''
    const farmMgr = farmMgrNode.getComponent('FarmManager') as any
    return farmMgr?.currentTool || ''
  }

  // ================================================================
  //  操作执行
  // ================================================================

  private async _doWater(): Promise<void> {
    this._isOperating = true
    try {
      await WaterAction.execute(this._plotData.plotIndex)
      FarmAnimations.playWater(this.node, null)
      this.waterIcon.active = false
    } catch (e) {
      console.warn('浇水操作失败:', e)
    } finally {
      this._isOperating = false
    }
  }

  private async _doFertilize(): Promise<void> {
    this._isOperating = true
    try {
      await FertilizeAction.execute(this._plotData.plotIndex, 'normal')
      FarmAnimations.playFertilize(this.cropSprite.node)
    } catch (e) {
      console.warn('施肥操作失败:', e)
    } finally {
      this._isOperating = false
    }
  }

  private async _doHarvest(): Promise<void> {
    this._isOperating = true
    try {
      await HarvestAction.execute(this._plotData.plotIndex)
      FarmAnimations.playHarvest(this.cropSprite.node, () => {
        this._plotData.crop = null
        this._render()
      })
    } catch (e) {
      console.warn('收获操作失败:', e)
    } finally {
      this._isOperating = false
    }
  }

  // ================================================================
  //  状态变化回调
  // ================================================================

  private _onCropMature(): void {
    this._render()
    FarmAnimations.startMatureGlow(this.matureEffect)
    EventManager.emit(GameEvents.CROP_MATURED, {
      plotIndex: this._plotData.plotIndex,
      cropId: this._plotData.crop!.cropId
    })
  }

  private _onCropWithered(): void {
    FarmAnimations.stopMatureGlow(this.matureEffect)
    FarmAnimations.playWither(this.cropSprite.node, () => {
      this._render()
    })
    EventManager.emit(GameEvents.CROP_WITHERED, {
      plotIndex: this._plotData.plotIndex
    })
  }

  // ================================================================
  //  渲染
  // ================================================================

  private _render(): void {
    const { unlocked, crop } = this._plotData

    // ---- 未解锁 ----
    if (!unlocked) {
      this.cropSprite.node.active = false
      this.progressBar.node.active = false
      this.timeLabel.node.active = false
      this.waterIcon.active = false
      this.bugIcon.active = false
      this.matureEffect.active = false
      this.lockIcon.active = true
      if (this.highlightBorder) this.highlightBorder.active = false

      const needLv = PLOT_UNLOCK_LEVELS[this._plotData.plotIndex] || 99
      this.lockLabel.string = `Lv.${needLv} 解锁`
      this.lockLabel.node.active = true
      return
    }

    this.lockIcon.active = false
    this.lockLabel.node.active = false

    // ---- 空地 ----
    if (!crop) {
      this.cropSprite.node.active = false
      this.progressBar.node.active = false
      this.timeLabel.node.active = false
      this.waterIcon.active = false
      this.bugIcon.active = false
      this.matureEffect.active = false
      FarmAnimations.stopMatureGlow(this.matureEffect)
      // 恢复灰度
      this.cropSprite.grayscale = false
      return
    }

    // ---- 有作物 ----
    this.cropSprite.node.active = true
    this.cropSprite.grayscale = false
    this.bugIcon.active = crop.hasBug

    switch (crop.status) {
      case CropStatus.GROWING: {
        this.progressBar.node.active = true
        this.timeLabel.node.active = true
        this.matureEffect.active = false
        FarmAnimations.stopMatureGlow(this.matureEffect)

        const progress = CropGrowth.getProgress(crop)
        this.progressBar.progress = progress
        this.timeLabel.string = Utils.formatTime(CropGrowth.getRemainSeconds(crop))
        this.waterIcon.active = CropGrowth.needsWater(crop)

        const stage = CropGrowth.getCurrentStage(crop)
        this._lastStageIndex = CropGrowth.getCurrentStageIndex(crop)
        this._loadCropSprite(stage.spriteFrame)
        break
      }

      case CropStatus.MATURE: {
        this.progressBar.node.active = false
        this.timeLabel.string = '可收获'
        this.timeLabel.node.active = true
        this.waterIcon.active = false
        this.matureEffect.active = true
        FarmAnimations.startMatureGlow(this.matureEffect)

        const cfg = CropConfig.get(crop.cropId)
        const lastStage = cfg.stages[cfg.stages.length - 1]
        this._loadCropSprite(lastStage.spriteFrame)
        break
      }

      case CropStatus.WITHERED: {
        this.progressBar.node.active = false
        this.timeLabel.string = '已枯萎'
        this.timeLabel.node.active = true
        this.waterIcon.active = false
        this.matureEffect.active = false
        FarmAnimations.stopMatureGlow(this.matureEffect)
        this.cropSprite.grayscale = true
        this.bugIcon.active = false
        break
      }
    }
  }

  // ================================================================
  //  精灵图加载
  // ================================================================

  /**
   * 加载并设置作物精灵图
   * 资源路径规则：resources/crops/{frameName}/spriteFrame
   */
  private _loadCropSprite(frameName: string): void {
    if (!frameName) return
    resources.load(`crops/${frameName}/spriteFrame`, SpriteFrame,
      (err, frame) => {
        if (err) {
          console.warn(`[PlotNode] 加载精灵图失败: crops/${frameName}`, err)
          return
        }
        if (frame && this.cropSprite?.isValid) {
          this.cropSprite.spriteFrame = frame
        }
      })
  }

  // ================================================================
  //  工具模式高亮
  // ================================================================

  /**
   * 设置工具模式高亮
   * @param tool 'water' | 'fertilize'
   * 只有"有作物且该工具可用"的地块才会高亮
   */
  setHighlight(tool: string): void {
    if (!this.highlightBorder) return
    const crop = this._plotData.crop
    if (!crop || !this._plotData.unlocked) {
      this.highlightBorder.active = false
      return
    }

    let canOperate = false
    if (tool === 'water') {
      canOperate = CropGrowth.canWater(crop)
    } else if (tool === 'fertilize') {
      canOperate = CropGrowth.canFertilize(crop)
    }

    this.highlightBorder.active = canOperate
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    if (this.highlightBorder) {
      this.highlightBorder.active = false
    }
  }

  // ================================================================
  //  等级解锁检查
  // ================================================================

  /**
   * 检查该地块是否在 newLevel 下应解锁
   */
  checkUnlock(newLevel: number): void {
    if (this._plotData.unlocked) return
    const needLv = PLOT_UNLOCK_LEVELS[this._plotData.plotIndex] || 99
    if (newLevel >= needLv) {
      this._plotData.unlocked = true
      this._render()
      // 解锁动画
      FarmAnimations.playPlant(this.node)
    }
  }

  // ================================================================
  //  清理
  // ================================================================

  onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_END, this._onClick, this)
    FarmAnimations.stopMatureGlow(this.matureEffect)
  }
}