// ============================================================
// 文件：cloud/waterFriend/index.js
// 说明：帮好友的作物浇水
// 负责人：D
// 调用方：B（FriendPlotNode → CloudAPI.waterFriend()）
// 参数：{ friendId: string, plotIndex: number }
// 返回类型：IWaterFriendResult
// 涉及集合：plots（好友）, users（自己扣体力、加金币经验）, interactions
// 校验：体力是否足够、好友地块是否有作物
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { friendId, plotIndex } = event

  try {
    if (friendId === OPENID) return H.fail(3001, '不能帮自己浇水（请用 water）')

    // 1. 查自己 + 恢复体力
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = H.recoverEnergy(userRes.data)

    if (user.energy < GAME.ENERGY_PER_WATER) {
      return H.fail(1001, '体力不足')
    }

    // 2. 检查今天是否已帮此好友浇过水（每天每好友1次）
    const todayStr = H.today()
    const countRes = await db.collection('interactions').where({
      fromUser: OPENID,
      toUser: friendId,
      type: 'water',
      date: todayStr,
    }).count()

    if (countRes.total >= 1) {
      return H.fail(1002, '今天已经帮TA浇过水了')
    }

    // 3. 查好友地块
    const plotRes = await db.collection('plots').where({
      userId: friendId, plotIndex,
    }).get()

    if (plotRes.data.length === 0) return H.fail(2001, '地块不存在')
    const plot = plotRes.data[0]

    if (!plot.crop) return H.fail(1003, '地块没有作物')
    if (plot.crop.status !== 'growing') return H.fail(1004, '作物不在生长中')

    const cfg = CROP_CONFIGS[plot.crop.cropId]
    if (plot.crop.waterCount >= cfg.needWater) {
      return H.fail(1005, '该作物已浇够水')
    }

    // 4. 给好友作物浇水
    const newSpeedBoost = Math.min(
      GAME.MAX_SPEED_BOOST,
      (plot.crop.speedBoost || 0) + GAME.WATER_SPEED_BOOST
    )
    const _ = db.command
    await db.collection('plots').doc(plot._id).update({
      data: {
        'crop.waterCount': _.inc(1),
        'crop.speedBoost': newSpeedBoost,
      }
    })

    // 5. 扣自己体力 + 给奖励
    const newEnergy = user.energy - GAME.ENERGY_PER_WATER
    const { user: updatedUser } = H.addExp(user, GAME.WATER_FRIEND_REWARD_EXP)
    updatedUser.coins += GAME.WATER_FRIEND_REWARD_COINS

    await db.collection('users').doc(OPENID).update({
      data: {
        energy: newEnergy,
        lastEnergyUpdate: Date.now(),
        coins: updatedUser.coins,
        exp: updatedUser.exp,
        level: updatedUser.level,
        energyMax: updatedUser.energyMax,
      }
    })

    // 6. 记录互动
    await db.collection('interactions').add({
      data: {
        fromUser: OPENID,
        fromNickname: user.nickname || '某人',
        toUser: friendId,
        type: 'water',
        cropId: plot.crop.cropId,
        cropName: cfg ? cfg.name : '',
        count: 0,
        date: todayStr,
        createdAt: Date.now(),
      }
    })

    // 7. 更新任务进度
    await H.incrDailyProgress(db, OPENID, 'helpWater')

    return H.ok({
      rewardCoins: GAME.WATER_FRIEND_REWARD_COINS,
      rewardExp: GAME.WATER_FRIEND_REWARD_EXP,
      newEnergy,
    })
  } catch (err) {
    console.error('[waterFriend]', err)
    return H.fail(9008, '帮浇水失败: ' + err.message)
  }
}
