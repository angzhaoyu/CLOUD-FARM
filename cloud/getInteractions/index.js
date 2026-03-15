// ============================================================
// 文件：cloud/getInteractions/index.js
// 说明：获取互动记录（被偷/被浇水等）
// 负责人：D
// 调用方：B（InteractionLog → CloudAPI.getInteractions()）
// 参数：无
// 返回类型：IInteractionsResult
// 涉及集合：interactions
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('interactions')
      .where({ toUser: OPENID })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const list = res.data.map(r => ({
      fromUserId: r.fromUser,
      fromNickname: r.fromNickname,
      toUserId: r.toUser,
      type: r.type,
      cropId: r.cropId || '',
      cropName: r.cropName || '',
      count: r.count || 0,
      createdAt: r.createdAt,
    }))

    return H.ok({ list })
  } catch (err) {
    console.error('[getInteractions]', err)
    return H.fail(9017, '获取互动失败: ' + err.message)
  }
}
