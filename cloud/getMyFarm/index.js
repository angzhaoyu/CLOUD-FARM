// ============================================================
// 文件：cloud/getMyFarm/index.js
// 说明：刷新获取自己的农场数据
// 负责人：D
// 调用方：A（从好友农场返回时 → CloudAPI.refreshMyFarm()）
// 参数：无
// 返回类型：ILoginResult
// 涉及集合：users, plots, warehouse
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { PLOT_UNLOCKS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const userRes = await db.collection('users').doc(OPENID).get()
    let user = userRes.data

    // 恢复体力
    user = H.recoverEnergy(user)
    await db.collection('users').doc(OPENID).update({
      data: { energy: user.energy, lastEnergyUpdate: user.lastEnergyUpdate }
    })

    // 读取地块 + 刷新状态
    const plotRes = await db.collection('plots').where({ userId: OPENID }).get()
    let plots = plotRes.data

    for (const p of plots) {
      const needLevel = PLOT_UNLOCKS[p.plotIndex] || 99
      if (!p.unlocked && user.level >= needLevel) {
        p.unlocked = true
        await db.collection('plots').doc(p._id).update({ data: { unlocked: true } })
      }
    }

    const { changedIndexes } = H.refreshAllCropStatuses(plots)
    for (const idx of changedIndexes) {
      const p = plots.find(x => x.plotIndex === idx)
      if (p) {
        await db.collection('plots').doc(p._id).update({ data: { crop: p.crop } })
      }
    }

    // 仓库
    const whRes = await db.collection('warehouse').where({ userId: OPENID }).get()
    const warehouseItems = whRes.data.length > 0 ? whRes.data[0].items : []

    return H.ok({
      user: {
        openId: OPENID,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        level: user.level,
        exp: user.exp,
        coins: user.coins,
        diamonds: user.diamonds,
        energy: user.energy,
        energyMax: user.energyMax,
        signInDays: user.signInDays,
        lastSignInDate: user.lastSignInDate,
        lastEnergyUpdate: user.lastEnergyUpdate,
        createdAt: user.createdAt,
      },
      plots: plots.map(p => ({
        plotIndex: p.plotIndex,
        unlocked: p.unlocked,
        crop: p.crop,
      })),
      warehouse: warehouseItems,
      isNewUser: false,
    })
  } catch (err) {
    console.error('[getMyFarm]', err)
    return H.fail(9002, '获取农场失败: ' + err.message)
  }
}
