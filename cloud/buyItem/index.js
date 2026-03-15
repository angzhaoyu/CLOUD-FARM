// ============================================================
// 文件：cloud/buyItem/index.js
// 说明：购买商店商品
// 负责人：D
// 调用方：C（ShopPanel → CloudAPI.buyItem()）
// 参数：{ itemId: string, count: number }
// 返回类型：IBuyResult
// 涉及集合：users（扣金币/钻石）, warehouse/inventory
// 校验：金币/钻石是否足够、商品是否存在
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { SHOP_ITEMS, GAME } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { itemId, count = 1 } = event

  try {
    if (count <= 0) return H.fail(1001, '数量无效')

    const item = SHOP_ITEMS[itemId]
    if (!item) return H.fail(1002, '未知商品')

    // 1. 查用户
    const userRes = await db.collection('users').doc(OPENID).get()
    const user = userRes.data
    const totalPrice = item.price * count

    // 2. 检查货币
    if (item.currency === 'coins' && user.coins < totalPrice) {
      return H.fail(1003, '金币不足')
    }
    if (item.currency === 'diamonds' && user.diamonds < totalPrice) {
      return H.fail(1004, '钻石不足')
    }

    // 3. 扣款
    const updateData = {}
    let newCoins = user.coins
    let newDiamonds = user.diamonds

    if (item.currency === 'coins') {
      newCoins -= totalPrice
      updateData.coins = newCoins
    } else {
      newDiamonds -= totalPrice
      updateData.diamonds = newDiamonds
    }

    // 4. 特殊道具立即生效
    if (itemId === 'energy_potion') {
      const recovered = Math.min(user.energyMax, user.energy + 50 * count)
      updateData.energy = recovered
      updateData.lastEnergyUpdate = Date.now()
    }

    await db.collection('users').doc(OPENID).update({ data: updateData })

    // 5. 普通道具存入背包（非立即消耗型）
    if (itemId !== 'energy_potion') {
      const invRes = await db.collection('inventory').where({ userId: OPENID }).get()
      if (invRes.data.length > 0) {
        await db.collection('inventory').doc(invRes.data[0]._id).update({
          data: { [`items.${itemId}`]: _.inc(count) }
        })
      } else {
        await db.collection('inventory').add({
          data: { userId: OPENID, items: { [itemId]: count } }
        })
      }
    }

    // 6. 保护罩：给所有地块加 protectedUntil
    if (itemId === 'shield_24h') {
      const until = Date.now() + 24 * 3600 * 1000 * count
      const plotRes = await db.collection('plots').where({ userId: OPENID }).get()
      for (const p of plotRes.data) {
        if (p.crop) {
          await db.collection('plots').doc(p._id).update({
            data: { 'crop.protectedUntil': until }
          })
        }
      }
    }

    return H.ok({
      itemId,
      newCoins,
      newDiamonds,
    })
  } catch (err) {
    console.error('[buyItem]', err)
    return H.fail(9010, '购买失败: ' + err.message)
  }
}
