// ============================================================
// 文件：cloud/getFriendFarm/index.js
// 说明：获取好友的农场数据
// 负责人：D
// 调用方：B（FriendFarmScene → CloudAPI.getFriendFarm()）
// 参数：{ friendId: string }
// 返回类型：IFriendFarmResult
// 涉及集合：users, plots（好友的数据）
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { friendId } = event

  try {
    // 1. 查好友信息
    const friendRes = await db.collection('users').doc(friendId).get().catch(() => null)
    if (!friendRes || !friendRes.data) {
      return H.fail(2001, '用户不存在')
    }
    const friend = friendRes.data

    // 2. 查好友地块 + 刷新作物状态
    const plotRes = await db.collection('plots').where({ userId: friendId }).get()
    let plots = plotRes.data

    const { changedIndexes } = H.refreshAllCropStatuses(plots)
    for (const idx of changedIndexes) {
      const p = plots.find(x => x.plotIndex === idx)
      if (p) {
        await db.collection('plots').doc(p._id).update({ data: { crop: p.crop } })
      }
    }

    // 3. 更新自己的任务进度（访问好友农场）
    await H.incrDailyProgress(db, OPENID, 'visitFriend')

    return H.ok({
      userId: friendId,
      nickname: friend.nickname,
      avatarUrl: friend.avatarUrl,
      level: friend.level,
      plots: plots.map(p => ({
        plotIndex: p.plotIndex,
        unlocked: p.unlocked,
        crop: p.crop,
      })),
    })
  } catch (err) {
    console.error('[getFriendFarm]', err)
    return H.fail(9014, '获取好友农场失败: ' + err.message)
  }
}
