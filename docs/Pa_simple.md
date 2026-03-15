scripts/farm/
│
├── CropGrowth.ts        ← 纯计算，零 UI 依赖
│     ↑ 被 PlotNode / WaterAction / FertilizeAction / HarvestAction / B模块 引用
│
├── WaterAction.ts       ← 校验 + CloudAPI.water
├── FertilizeAction.ts   ← 校验 + CloudAPI.fertilize
├── HarvestAction.ts     ← 校验 + CloudAPI.harvest
│     ↑ 以上三个被 PlotNode 调用
│
├── FarmAnimations.ts    ← 纯 tween 动画工具集，静态方法
│     ↑ 被 PlotNode / FarmManager 调用
│
├── PlotNode.ts          ← 单地块组件（显示 + 交互 + 调 Action）
│     ↑ 被 FarmManager 创建和管理
│
└── FarmManager.ts       ← 入口，挂 Farm.scene 根节点
      监听：SEED_SELECTED / LEAVE_FRIEND_FARM / LEVEL_UP / GAME_DATA_READY
      发出：（通过 PlotNode 间接发出所有 A 的事件）

# 1. 确认 USE_MOCK = true
# 2. 打开 Farm.scene，在根节点挂 FarmManager，拖入 plotPrefab 和 plotContainer
# 3. 运行 → 应看到 8 块地（2行4列），其中 plotIndex=0 有生菜在生长，plotIndex=1 番茄已成熟
# 4. 点击空地 → 控制台输出 [Event] PLOT_EMPTY_CLICKED {plotIndex: 2}
# 5. 控制台手动：EventManager.emit('SEED_SELECTED', {plotIndex:2, cropId:'tomato'})
#    → 地块 2 出现番茄种子 + 进度条开始走
# 6. 点击成熟番茄 → 收获动画 → [Event] CROP_HARVESTED → 地块清空
# 7. 等白菜生长条走满 → [Event] CROP_MATURED → 出现闪光特效       