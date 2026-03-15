// ============================================================
// 文件：scripts/ui/LaunchScene.ts
// 说明：启动场景控制器，负责登录、加载资源、跳转到主场景
// 负责人：C
// 调用方：Launch.scene 根节点挂载，游戏启动入口
// 发出事件：无（登录成功后 UserModel.init() 内部发出 GAME_DATA_READY）
// 调用CloudAPI：CloudAPI.initCloud(), CloudAPI.login()
// ============================================================

import { _decorator, Component, Label, ProgressBar, director } from 'cc'
import { CloudAPI } from '../shared/CloudAPI'
import { CropConfig } from '../config/CropConfig'
const { ccclass, property } = _decorator

/** 加载步骤总数（用于进度条） */
const TOTAL_STEPS = 3

@ccclass('LaunchScene')
export class LaunchScene extends Component {

  @property(Label) tipLabel: Label = null!
  @property(ProgressBar) progressBar: ProgressBar = null!
  @property(Label) versionLabel: Label = null!

  private _step: number = 0

  onLoad(): void {
    if (this.versionLabel) {
      this.versionLabel.string = 'v1.0.0'
    }
    this._startLoad()
  }

  // ================================================================
  //  加载流程
  // ================================================================

  private async _startLoad(): Promise<void> {
    try {
      // ---- Step 1: 初始化配置 ----
      this._updateProgress('初始化配置...')
      CropConfig.init()
      await this._fakeDelay(300)

      // ---- Step 2: 初始化云开发 ----
      this._updateProgress('连接服务器...')
      CloudAPI.initCloud()
      await this._fakeDelay(200)

      // ---- Step 3: 登录并拉取用户数据 ----
      this._updateProgress('加载数据...')
      const loginResult = await CloudAPI.login()

      this._updateProgress('加载完成！')
      await this._fakeDelay(400)

      // 判断是否新用户（用于后续新手引导）
      if (loginResult.isNewUser) {
        // 标记新手状态，NewbieGuide 在 Farm 场景中会读取
        ;(globalThis as Record<string, unknown>).__isNewUser = true
      }

      // ---- 跳转到 Farm 场景 ----
      director.loadScene('Farm')
    } catch (err) {
      console.error('[LaunchScene] 启动失败:', err)
      this.tipLabel.string = '加载失败，请重试'
      this._showRetry()
    }
  }

  /** 更新进度条与提示文字 */
  private _updateProgress(tip: string): void {
    this._step++
    this.tipLabel.string = tip
    if (this.progressBar) {
      this.progressBar.progress = Math.min(this._step / TOTAL_STEPS, 1)
    }
  }

  /** 模拟最低等待时间，避免闪屏 */
  private _fakeDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /** 加载失败时显示重试 */
  private _showRetry(): void {
    // 3 秒后自动重试
    this._step = 0
    this.scheduleOnce(() => {
      this._startLoad()
    }, 3)
  }
}