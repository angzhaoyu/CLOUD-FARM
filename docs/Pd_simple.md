集合 users
  └─ 无需额外索引（_id = openId，已是主键）

集合 plots
  └─ 联合索引：userId (升序) + plotIndex (升序) ← 唯一
  └─ 单字段索引：crop.status

集合 warehouse
  └─ 单字段索引：userId (唯一)

集合 inventory
  └─ 单字段索引：userId (唯一)

集合 interactions
  └─ 联合索引：toUser (升序) + createdAt (降序)
  └─ 联合索引：fromUser (升序) + toUser (升序) + date (升序) + type (升序)

集合 daily_progress
  └─ 联合索引：userId (升序) + date (升序) ← 唯一

集合 weekly_progress
  └─ 联合索引：userId (升序) + weekStart (升序) ← 唯一


① npm install           → 在每个云函数目录下执行
② 上传部署              → 微信开发者工具右键每个函数 → "上传并部署：云端安装依赖"
③ 创建集合              → 云开发控制台创建 7 个集合（见上方）
④ 创建索引              → 按上方索引表逐一添加

自测顺序（每步验证数据库写入是否正确）：
  1. login          → 检查 users / plots / warehouse / inventory 4 张表
  2. plant          → 检查 plots.crop 写入 + users.coins 扣减
  3. water          → 检查 crop.waterCount / speedBoost + users.energy
  4. fertilize      → 先 buyItem 买肥料，再施肥
  5. harvest        → 等作物成熟或改小 growTime 测试
  6. sell           → 检查 warehouse 减少 + users.coins 增加
  7. buyItem        → 检查 inventory + 货币扣减
  8. signIn         → 连续调用两次，第二次应返回 1001
  9. getFriendFarm  → 用第二个测试账号
  10. steal         → 对成熟作物偷，验证 stolenBy / interactions
  11. waterFriend   → 验证 interactions + 奖励
  12. getTaskStatus → 验证进度与实际操作是否匹配
  13. claimTask     → 完成任务后领取
  14. getRanking    → 验证排序正确
  15. getInteractions → 验证记录列表
  16. checkWither   → 手动调用或等定时触发器

