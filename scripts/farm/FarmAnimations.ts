// ============================================================
// 文件：scripts/farm/FarmAnimations.ts
// 职责：农场场景中所有动画效果（tween 实现）
// 维护人：A
// 说明：所有方法均为静态，传入目标节点即可播放
// ============================================================

import { Node, tween, Vec3, UIOpacity, Sprite, Color, SpriteFrame } from 'cc'

/** 动画播放时长常量（秒） */
const DUR_SHORT  = 0.25
const DUR_NORMAL = 0.4
const DUR_LONG   = 0.6

export class FarmAnimations {

  // ================================================================
  //  种植动画：种子从上方落下 + 缩放弹跳
  // ================================================================

  /**
   * 播放种植动画
   * @param cropNode 作物精灵所在节点
   * @param onComplete 动画结束回调（可选）
   */
  static playPlant(cropNode: Node, onComplete?: () => void): void {
    const originPos = cropNode.position.clone()
    const startY = originPos.y + 120

    cropNode.setScale(0.3, 0.3, 1)
    cropNode.setPosition(originPos.x, startY, originPos.z)

    const opacity = cropNode.getComponent(UIOpacity) || cropNode.addComponent(UIOpacity)
    opacity.opacity = 0

    tween(cropNode)
      .parallel(
        tween().to(DUR_NORMAL, { position: originPos }, { easing: 'bounceOut' }),
        tween().to(DUR_SHORT, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }),
      )
      .call(() => { if (onComplete) onComplete() })
      .start()

    tween(opacity)
      .to(DUR_SHORT * 0.5, { opacity: 255 })
      .start()
  }

  // ================================================================
  //  浇水动画：水滴溅落 + 地块短暂变蓝
  // ================================================================

  /**
   * 播放浇水动画
   * @param plotNode   地块根节点（用于变色）
   * @param dropNode   水滴特效节点（需提前放在预制体中并隐藏）
   * @param onComplete 动画结束回调
   */
  static playWater(plotNode: Node, dropNode: Node | null, onComplete?: () => void): void {
    // ---- 地块闪蓝 ----
    const plotSprite = plotNode.getComponent(Sprite)
    if (plotSprite) {
      const originColor = plotSprite.color.clone()
      const blueColor = new Color(150, 200, 255, 255)
      tween(plotNode)
        .call(() => { plotSprite.color = blueColor })
        .delay(DUR_NORMAL)
        .call(() => { plotSprite.color = originColor })
        .start()
    }

    // ---- 水滴落下 ----
    if (dropNode) {
      dropNode.active = true
      const originPos = dropNode.position.clone()
      dropNode.setPosition(originPos.x, originPos.y + 80, originPos.z)
      dropNode.setScale(0.6, 0.6, 1)

      const opacity = dropNode.getComponent(UIOpacity) || dropNode.addComponent(UIOpacity)
      opacity.opacity = 255

      tween(dropNode)
        .to(DUR_NORMAL, { position: originPos, scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
        .to(DUR_SHORT, { scale: new Vec3(1.3, 0.4, 1) })
        .call(() => {
          tween(opacity).to(DUR_SHORT, { opacity: 0 }).start()
        })
        .delay(DUR_SHORT)
        .call(() => {
          dropNode.active = false
          dropNode.setPosition(originPos)
          dropNode.setScale(1, 1, 1)
          opacity.opacity = 255
          if (onComplete) onComplete()
        })
        .start()
    } else {
      // 无水滴节点时仅等变色动画结束
      setTimeout(() => { if (onComplete) onComplete() }, DUR_NORMAL * 1000)
    }
  }

  // ================================================================
  //  施肥动画：星星上升粒子感
  // ================================================================

  /**
   * 播放施肥动画
   * @param cropNode   作物节点（短暂放大）
   * @param onComplete 动画结束回调
   */
  static playFertilize(cropNode: Node, onComplete?: () => void): void {
    tween(cropNode)
      .to(DUR_SHORT, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'quadOut' })
      .to(DUR_SHORT, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
      .call(() => { if (onComplete) onComplete() })
      .start()
  }

  // ================================================================
  //  收获动画：作物弹起 → 飞向屏幕上方（仓库方向）
  // ================================================================

  /**
   * 播放收获动画
   * @param cropNode   作物节点（播完后会被隐藏）
   * @param onComplete 动画结束回调
   */
  static playHarvest(cropNode: Node, onComplete?: () => void): void {
    const originPos = cropNode.position.clone()
    const opacity = cropNode.getComponent(UIOpacity) || cropNode.addComponent(UIOpacity)

    tween(cropNode)
      // 先弹起
      .to(DUR_SHORT, {
        position: new Vec3(originPos.x, originPos.y + 60, originPos.z),
        scale: new Vec3(1.3, 1.3, 1)
      }, { easing: 'quadOut' })
      // 再飞走
      .parallel(
        tween().to(DUR_NORMAL, {
          position: new Vec3(originPos.x + 50, originPos.y + 300, originPos.z)
        }, { easing: 'quadIn' }),
        tween().to(DUR_NORMAL, { scale: new Vec3(0.3, 0.3, 1) }),
      )
      .call(() => {
        tween(opacity).to(0.1, { opacity: 0 }).start()
      })
      .delay(0.15)
      .call(() => {
        cropNode.active = false
        // 复原以备复用
        cropNode.setPosition(originPos)
        cropNode.setScale(1, 1, 1)
        opacity.opacity = 255
        if (onComplete) onComplete()
      })
      .start()
  }

  // ================================================================
  //  成熟闪光：循环缩放发光节点
  // ================================================================

  /**
   * 开始循环播放成熟闪光
   * @param effectNode 闪光特效节点
   */
  static startMatureGlow(effectNode: Node): void {
    effectNode.active = true
    effectNode.setScale(0.8, 0.8, 1)
    const opacity = effectNode.getComponent(UIOpacity) || effectNode.addComponent(UIOpacity)

    tween(effectNode)
      .repeatForever(
        tween()
          .parallel(
            tween().to(0.8, { scale: new Vec3(1.1, 1.1, 1) }),
            tween().call(() => { tween(opacity).to(0.8, { opacity: 180 }).start() }),
          )
          .parallel(
            tween().to(0.8, { scale: new Vec3(0.8, 0.8, 1) }),
            tween().call(() => { tween(opacity).to(0.8, { opacity: 255 }).start() }),
          )
      )
      .start()
  }

  /**
   * 停止成熟闪光
   */
  static stopMatureGlow(effectNode: Node): void {
    tween(effectNode).stop()
    effectNode.active = false
  }

  // ================================================================
  //  枯萎动画：渐变灰色 + 萎缩
  // ================================================================

  /**
   * 播放枯萎动画
   */
  static playWither(cropNode: Node, onComplete?: () => void): void {
    tween(cropNode)
      .to(DUR_LONG, { scale: new Vec3(0.85, 0.75, 1) }, { easing: 'quadIn' })
      .call(() => {
        const sprite = cropNode.getComponent(Sprite)
        if (sprite) {
          sprite.grayscale = true
        }
        if (onComplete) onComplete()
      })
      .start()
  }

  // ================================================================
  //  虫子出现动画：抖动
  // ================================================================

  /**
   * 播放虫子出现时的抖动效果
   */
  static playBugAppear(bugNode: Node): void {
    bugNode.active = true
    bugNode.setScale(0, 0, 1)

    tween(bugNode)
      .to(DUR_SHORT, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .repeatForever(
        tween()
          .to(0.08, { angle: 8 })
          .to(0.08, { angle: -8 })
          .to(0.08, { angle: 5 })
          .to(0.08, { angle: -5 })
          .to(0.08, { angle: 0 })
          .delay(1.5)
      )
      .start()
  }

  /**
   * 播放除虫成功动画
   */
  static playBugRemove(bugNode: Node, onComplete?: () => void): void {
    tween(bugNode).stop()
    bugNode.angle = 0

    const opacity = bugNode.getComponent(UIOpacity) || bugNode.addComponent(UIOpacity)
    tween(bugNode)
      .to(DUR_SHORT, { scale: new Vec3(1.5, 1.5, 1) })
      .start()

    tween(opacity)
      .to(DUR_SHORT, { opacity: 0 })
      .call(() => {
        bugNode.active = false
        bugNode.setScale(1, 1, 1)
        opacity.opacity = 255
        if (onComplete) onComplete()
      })
      .start()
  }

  // ================================================================
  //  通用工具
  // ================================================================

  /**
   * 节点点击缩放反馈（按下缩小，松开弹回）
   */
  static clickFeedback(node: Node): void {
    tween(node)
      .to(0.08, { scale: new Vec3(0.9, 0.9, 1) })
      .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()
  }

  /**
   * 数字飘字动画（+20 经验、+3 金币等）
   * @param node   文字节点（Label 所在节点）
   * @param deltaY 向上飘动的距离，默认 80
   */
  static playFloatText(node: Node, deltaY: number = 80): void {
    node.active = true
    const originPos = node.position.clone()
    const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity)
    opacity.opacity = 255

    tween(node)
      .to(DUR_LONG, {
        position: new Vec3(originPos.x, originPos.y + deltaY, originPos.z)
      }, { easing: 'quadOut' })
      .start()

    tween(opacity)
      .delay(DUR_NORMAL)
      .to(DUR_SHORT, { opacity: 0 })
      .call(() => {
        node.active = false
        node.setPosition(originPos)
        opacity.opacity = 255
      })
      .start()
  }
}