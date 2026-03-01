import { useState, useEffect } from 'react'
import { CrownIcon } from '../components/icons'
import { getKronenBalance, getEarnedToday, getDailyCap, spendKronen } from '../data/kronen'
import {
  SHOP_ITEMS,
  getOwnedIds,
  purchase as doPurchase,
  getItemPrice,
  type ShopItem,
} from '../data/shop'
import { addFreeze } from '../data/streak'
import './ShopPage.css'

const ICON_LABELS: Record<ShopItem['icon'], string> = {
  crown: '👑',
  sparkle: '✨',
  ring: '💍',
  theme: '🎨',
  shield: '🛡️',
  star: '⭐',
}

export function ShopPage() {
  const [balance, setBalance] = useState(getKronenBalance)
  const [owned, setOwned] = useState<string[]>(() => getOwnedIds())

  useEffect(() => {
    setBalance(getKronenBalance())
    setOwned(getOwnedIds())
  }, [])

  const earnedToday = getEarnedToday()
  const dailyCap = getDailyCap()

  const handlePurchase = (itemId: string) => {
    const price = getItemPrice(itemId)
    if (balance < price || owned.includes(itemId)) return
    if (!spendKronen(price)) return
    if (!doPurchase(itemId)) return
    if (itemId === 'streak-freeze') addFreeze()
    setBalance(getKronenBalance())
    setOwned(getOwnedIds())
  }

  return (
    <div className="shop-page">
      <h1 className="page-title">Shop</h1>
      <p className="shop-intro">
        Verdiene Lobeskronen beim Lernen (1–3 pro Lektion, max. {dailyCap} pro Tag) und tausche sie hier ein.
      </p>

      <div className="shop-balance-card">
        <div className="shop-balance-head">
          <CrownIcon className="shop-balance-icon" />
          <span className="shop-balance-label">Deine Lobeskronen</span>
        </div>
        <p className="shop-balance-value">{balance}</p>
        <p className="shop-balance-today">
          Heute: {earnedToday} / {dailyCap}
        </p>
      </div>

      <section className="shop-items" aria-labelledby="shop-items-heading">
        <h2 id="shop-items-heading" className="shop-items-heading">
          Belohnungen
        </h2>
        <ul className="shop-list">
          {SHOP_ITEMS.map((item) => {
            const isOwned = owned.includes(item.id)
            const canAfford = balance >= item.price
            return (
              <li key={item.id} className="shop-card">
                <div className="shop-card-icon" aria-hidden>
                  {ICON_LABELS[item.icon]}
                </div>
                <div className="shop-card-body">
                  <h3 className="shop-card-title">{item.name}</h3>
                  <p className="shop-card-desc">{item.description}</p>
                  <div className="shop-card-footer">
                    <span className="shop-card-price">
                      <CrownIcon className="shop-card-price-icon" />
                      {item.price}
                    </span>
                    {isOwned ? (
                      <span className="shop-card-owned">Bereits gekauft</span>
                    ) : (
                      <button
                        type="button"
                        className="shop-card-btn"
                        disabled={!canAfford}
                        onClick={() => handlePurchase(item.id)}
                      >
                        Kaufen
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
