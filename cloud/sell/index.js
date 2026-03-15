// ============================================================
// 文件：cloud/sell/index.js
// 说明：卖出仓库中的作物
// 负责人：D
// 调用方：C（WarehousePanel → CloudAPI.sell()）
// 参数：{ cropId: string, count: number }
// 返回类型：ISellResult
// 涉及集合：warehouse, users（加金币）
// 校验：仓库中是否有足够数量的该作物
// ============================================================

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { CROP_CONFIGS } = require('cloud-farm-common/config')
const H = require('cloud-farm-common/helpers')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { cropId, count } = event

  try {
    if (!count || count <= 0) return H.fail(1001, '数量无效')

    const cfg = CROP_CONFIGS[cropId]
    if (!cfg) return H.fail(1002, '未知作物')

    // 1. 查仓库
    const whRes = await db.collection('warehouse').where({ userId: OPENID }).get()
    if (whRes.data.length === 0) return H.fail(1003, '仓库为空')

    const wh = whRes.data[0]
    const items = wh.items || []
    const existing = items.find(i => i.cropId === cropId)

    if (!existing || existing.count < count) {
      return H.fail(1004, '库存不足')
    }

    // 2. 扣仓库
    existing.count -= count
    const newItems = items.filter(i => i.count > 0)
    await db.collection('warehouse').doc(wh._id).update({
      data: { items: newItems }
    })

    // 3. 加金币
    const coinsGained = cfg.sellPrice * count
    const userRes = await db.collection('users').doc(OPENID).get()
    const newCoins = userRes.data.coins + coinsGained

    await db.collection('users').doc(OPENID).update({
      data: { coins: newCoins }
    })

    return H.ok({
      cropId,
      count,
      coinsGained,
      newCoins,
    })
  } catch (err) {
    console.error('[sell]', err)
    return H.fail(9009, '卖出失败: ' + err.message)
  }
}
