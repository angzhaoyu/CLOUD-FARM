
文件清单校验
#	文件	职责	状态
1	Toast.ts	轻提示，自动上浮消失	✅
2	DialogBase.ts	弹窗基类，开关动画	✅
3	UIManager.ts	弹窗/Toast 统一管理	✅
4	LaunchScene.ts	启动→初始化→登录→跳转	✅
5	TopBar.ts	顶栏实时刷新 6 种事件	✅
6	BottomNav.ts	5 Tab 导航，发出 NAV_TAB_CHANGED	✅
7	ToolBar.ts	浇水/施肥/收获/除虫/清除，按作物状态启用	✅
8	PlantSelectDialog.ts	种子列表+分类筛选，发出 SEED_SELECTED	✅
9	CropDetailDialog.ts	作物详情+实时倒计时	✅
10	HarvestResultDialog.ts	收获结果弹窗	✅
11	StealResultDialog.ts	偷菜成功/失败	✅
12	ShopPanel.ts	商店分类+购买，发出 ITEM_BOUGHT	✅
13	BagPanel.ts	仓库列表+出售，发出 CROP_SOLD	✅
14	TaskPanel.ts	每日/每周任务+领取，发出 TASK_CLAIMED	✅
15	SignInPanel.ts	7 日签到日历，发出 SIGNED_IN	✅
16	NewbieGuide.ts	5 步新手引导+跳过	✅
全部文件严格遵守：

只引用 shared/、config/ 的公共模块，不碰 farm/、social/ 目录
事件名称统一使用 GameEvents 常量
数据读取走 UserModel，云调用走 CloudAPI
文件头注释 + JSDoc + 私有 _ 前缀 + PascalCase 类名

