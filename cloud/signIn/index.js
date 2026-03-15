// ============================================================
// 文件：cloud/signIn/index.js
// 说明：每日签到
// 负责人：D
// 调用方：C（SignInPanel → CloudAPI.signIn()）
// 参数：无
// 返回类型：ISignInResult
// 涉及集合：users（更新签到天数、加金币/经验/钻石）
// 校验：今天是否已签到、连续签到天数计算
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { SIGN_IN_REWARDS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const userRes = await db.collection('users').doc(OPENID).get()
    const user = userRes.data
    const todayStr = H.today()

    // 1. 检查是否已签到
    if (user.lastSignInDate === todayStr) {
      return H.fail(1001, '今天已经签到了')
    }

    // 2. 计算连续签到天数
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newSignInDays
    if (user.lastSignInDate === yesterdayStr) {
      // 连续签到
      newSignInDays = user.signInDays + 1
    } else {
      // 断签，重新开始
      newSignInDays = 1
    }

    // 3. 取奖励（7天一循环）
    const rewardIndex = ((newSignInDays - 1) % 7)
    const reward = { ...SIGN_IN_REWARDS[rewardIndex], day: newSignInDays }

    // 4. 发放奖励
    const { user: updatedUser } = H.addExp(user, reward.exp)
    updatedUser.coins += reward.coins
    updatedUser.diamonds += reward.diamonds

    const updateData = {
      coins: updatedUser.coins,
      diamonds: updatedUser.diamonds,
      exp: updatedUser.exp,
      level: updatedUser.level,
      energyMax: updatedUser.energyMax,
      signInDays: newSignInDays,
      lastSignInDate: todayStr,
    }

    await db.collection('users').doc(OPENID).update({ data: updateData })

    // 5. 如果奖励包含道具
    if (reward.itemId) {
      const invRes = await db.collection('inventory').where({ userId: OPENID }).get()
      if (invRes.data.length > 0) {
        await db.collection('inventory').doc(invRes.data[0]._id).update({
          data: { [`items.${reward.itemId}`]: _.inc(1) }
        })
      }
    }

    return H.ok({
      day: newSignInDays,
      reward,
      newCoins: updatedUser.coins,
      newExp: updatedUser.exp,
    })
  } catch (err) {
    console.error('[signIn]', err)
    return H.fail(9011, '签到失败: ' + err.message)
  }
}
