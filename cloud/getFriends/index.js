// ============================================================
// 文件：cloud/getFriends/index.js
// 说明：获取好友列表（MVP 方案：返回所有其他玩家，正式版需接微信社交关系链）
// 负责人：D
// 调用方：B（好友列表 → CloudAPI.getFriends()）
// 参数：无
// 返回类型：IFriendData[]
// 涉及集合：users, plots
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 取所有其他用户（MVP 小规模方案，正式版需分页 + 社交关系链）
    const res = await db.collection('users')
      .where({ _id: _.neq(OPENID) })
      .limit(50)
      .orderBy('level', 'desc')
      .get()

    const friends = []

    for (const u of res.data) {
      // 检查是否有成熟作物
      const plotRes = await db.collection('plots').where({
        userId: u._id,
        'crop.status': 'mature',
      }).limit(1).get()

      friends.push({
        openId: u._id,
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        level: u.level,
        hasMatureCrop: plotRes.data.length > 0,
      })
    }

    return H.ok(friends)
  } catch (err) {
    console.error('[getFriends]', err)
    return H.fail(9015, '获取好友失败: ' + err.message)
  }
}