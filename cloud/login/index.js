// ============================================================
// 文件：cloud/login/index.js
// 说明：登录并获取/创建用户全部数据
// 负责人：D
// 调用方：C（Launch场景 → CloudAPI.login()）
// 参数：无（自动获取 openId）
// 返回类型：ILoginResult
// 涉及集合：users, plots, warehouse
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { GAME, PLOT_UNLOCKS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // ---------- 1. 查询用户是否存在 ----------
    let userRes = await db.collection('users').doc(OPENID).get().catch(() => null)
    let isNewUser = false

    if (!userRes || !userRes.data) {
      // ===== 新用户 =====
      isNewUser = true
      const newUser = {
        _id: OPENID,
        nickname: '农场主',
        avatarUrl: '',
        level: 1,
        exp: 0,
        coins: GAME.INITIAL_COINS,
        diamonds: 0,
        energy: GAME.INITIAL_ENERGY,
        energyMax: GAME.INITIAL_ENERGY_MAX,
        signInDays: 0,
        lastSignInDate: '',
        lastEnergyUpdate: Date.now(),
        totalHarvest: 0,
        totalSteal: 0,
        createdAt: Date.now(),
      }
      await db.collection('users').add({ data: newUser })

      // 创建初始地块
      const plots = H.createInitialPlots(OPENID)
      for (const p of plots) {
        await db.collection('plots').add({ data: p })
      }

      // 创建空仓库
      await db.collection('warehouse').add({
        data: { userId: OPENID, items: [] }
      })

      // 创建空道具背包
      await db.collection('inventory').add({
        data: { userId: OPENID, items: {} }
      })

      userRes = { data: newUser }
    }

    let user = userRes.data

    // ---------- 2. 恢复体力 ----------
    user = H.recoverEnergy(user)
    await db.collection('users').doc(OPENID).update({
      data: {
        energy: user.energy,
        lastEnergyUpdate: user.lastEnergyUpdate,
      }
    })

    // ---------- 3. 读取地块并刷新作物状态 ----------
    const plotRes = await db.collection('plots').where({ userId: OPENID }).get()
    let plots = plotRes.data

    // 检查地块解锁（等级提升后可能解锁新地块）
    for (const p of plots) {
      const needLevel = PLOT_UNLOCKS[p.plotIndex] || 99
      if (!p.unlocked && user.level >= needLevel) {
        p.unlocked = true
        await db.collection('plots').doc(p._id).update({
          data: { unlocked: true }
        })
      }
    }

    // 刷新作物状态
    const { changedIndexes } = H.refreshAllCropStatuses(plots)
    for (const idx of changedIndexes) {
      const p = plots.find(x => x.plotIndex === idx)
      if (p) {
        await db.collection('plots').doc(p._id).update({
          data: { crop: p.crop }
        })
      }
    }

    // ---------- 4. 读取仓库 ----------
    const whRes = await db.collection('warehouse').where({ userId: OPENID }).get()
    const warehouseItems = whRes.data.length > 0 ? whRes.data[0].items : []

    // ---------- 5. 更新每日/每周登录进度 ----------
    await H.incrDailyProgress(db, OPENID, 'login', 1)
    await H.incrWeeklyProgress(db, OPENID, 'loginDays')

    // ---------- 6. 组装返回 ----------
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
      isNewUser,
    })
  } catch (err) {
    console.error('[login]', err)
    return H.fail(9001, '登录失败: ' + err.message)
  }
}
