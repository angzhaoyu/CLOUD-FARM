// ============================================================
// 文件：cloud/getRanking/index.js
// 说明：获取排行榜数据
// 负责人：D
// 调用方：B（RankingPanel → CloudAPI.getRanking()）
// 参数：{ type: "harvest"|"level"|"steal" }
// 返回类型：IRankingResult
// 涉及集合：users（聚合查询排序）
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { type = 'harvest' } = event

  try {
    // 确定排序字段
    const fieldMap = {
      harvest: 'totalHarvest',
      level: 'level',
      steal: 'totalSteal',
    }
    const sortField = fieldMap[type] || 'totalHarvest'

    // 查前 50 名
    const res = await db.collection('users')
      .orderBy(sortField, 'desc')
      .limit(50)
      .get()

    const list = res.data.map((u, i) => ({
      rank: i + 1,
      openId: u._id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      value: u[sortField] || 0,
    }))

    // 查自己排名
    const me = list.find(x => x.openId === OPENID)
    let myRank = me ? me.rank : -1
    let myValue = me ? me.value : 0

    if (!me) {
      // 不在前50，查自己的值
      const myRes = await db.collection('users').doc(OPENID).get().catch(() => null)
      if (myRes && myRes.data) {
        myValue = myRes.data[sortField] || 0
        // 粗略排名
        const countRes = await db.collection('users')
          .where({ [sortField]: db.command.gt(myValue) })
          .count()
        myRank = countRes.total + 1
      }
    }

    return H.ok({ list, myRank, myValue })
  } catch (err) {
    console.error('[getRanking]', err)
    return H.fail(9016, '排行榜失败: ' + err.message)
  }
}
