import { useState, useEffect } from 'react'
import {
  CrownIcon,
  SparklesIcon,
  RingIcon,
  ThemePaletteIcon,
  ShieldIcon,
  StarIcon,
  SoundIcon,
  GiftIcon,
} from '../components/icons'
import { getKronenBalance, getEarnedToday, getDailyCap, spendKronen } from '../data/kronen'
import {
  SHOP_ITEMS,
  SHOP_CATEGORIES,
  getOwnedIds,
  purchase as doPurchase,
  getItemPrice,
  type ShopItem,
  type ShopCategory,
} from '../data/shop'
import { addFreeze, getFreezeBalance } from '../data/streak'
import './ShopPage.css'

const SHOP_ICON_MAP: Record<ShopItem['icon'], React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  crown: CrownIcon,
  sparkle: SparklesIcon,
  ring: RingIcon,
  theme: ThemePaletteIcon,
  shield: ShieldIcon,
  star: StarIcon,
  sound: SoundIcon,
  gift: GiftIcon,
}

function ShopUnlockModal({
  item,
  onClose,
}: {
  item: ShopItem
  onClose: () => void
}) {
  const IconComponent = SHOP_ICON_MAP[item.icon]
  return (
    <div className="shop-unlock-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-unlock-title">
      <div className="shop-unlock-backdrop" onClick={onClose} aria-hidden />
      <div className="shop-unlock-modal">
        <div className="shop-unlock-icon-wrap">
          {IconComponent && <IconComponent className="shop-unlock-icon" aria-hidden />}
        </div>
        <h2 id="shop-unlock-title" className="shop-unlock-title">
          Freigeschaltet!
        </h2>
        <p className="shop-unlock-name">{item.name}</p>
        <p className="shop-unlock-message">{item.unlockMessage}</p>
        <button type="button" className="btn btn-primary shop-unlock-btn" onClick={onClose}>
          Super!
        </button>
      </div>
    </div>
  )
}

export function ShopPage() {
  const [balance, setBalance] = useState(getKronenBalance())
  const [owned, setOwned] = useState<string[]>(() => getOwnedIds())
  const [category, setCategory] = useState<ShopCategory | 'alle'>('alle')
  const [unlockedItem, setUnlockedItem] = useState<ShopItem | null>(null)

  useEffect(() => {
    setBalance(getKronenBalance())
    setOwned(getOwnedIds())
  }, [])

  const earnedToday = getEarnedToday()
  const dailyCap = getDailyCap()
  const freezeBalance = getFreezeBalance()

  const filteredItems =
    category === 'alle' ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.category === category)

  const handlePurchase = (item: ShopItem) => {
    const price = getItemPrice(item.id)
    if (balance < price) return
    if (!item.consumable && owned.includes(item.id)) return
    if (!spendKronen(price)) return
    if (item.id === 'streak-freeze') {
      addFreeze()
    } else if (!doPurchase(item.id)) {
      return
    }
    setBalance(getKronenBalance())
    setOwned(getOwnedIds())
    setUnlockedItem(item)
  }

  const canBuy = (item: ShopItem) => {
    if (balance < item.price) return false
    if (item.consumable) return true
    return !owned.includes(item.id)
  }

  const isOwnedOrHasStock = (item: ShopItem) => {
    if (item.consumable) return false
    return owned.includes(item.id)
  }

  return (
    <div className="shop-page">
      <header className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <p className="shop-intro">
          Verdiene Lobeskronen beim Lernen (bis zu 10 pro Lektion, max. {dailyCap} pro Tag) und tausche sie hier ein.
        </p>
      </header>

      <div className="shop-balance">
        <div className="shop-balance-inner">
          <CrownIcon className="shop-balance-crown" aria-hidden />
          <div className="shop-balance-text">
            <span className="shop-balance-value">{balance}</span>
            <span className="shop-balance-label">Lobeskronen</span>
          </div>
          <p className="shop-balance-today">
            Heute: {earnedToday} / {dailyCap}
          </p>
        </div>
      </div>

      <nav className="shop-categories" aria-label="Kategorien">
        <button
          type="button"
          className={`shop-cat-btn ${category === 'alle' ? 'shop-cat-btn--active' : ''}`}
          onClick={() => setCategory('alle')}
        >
          Alle
        </button>
        {SHOP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`shop-cat-btn ${category === c.id ? 'shop-cat-btn--active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <section className="shop-grid" aria-labelledby="shop-items-heading">
        <h2 id="shop-items-heading" className="shop-section-title">
          Belohnungen
        </h2>
        <ul className="shop-list">
          {filteredItems.map((item) => {
            const IconC = SHOP_ICON_MAP[item.icon]
            const ownedOrBought = isOwnedOrHasStock(item)
            const canAfford = canBuy(item)
            const isConsumable = item.consumable === true
            const showFreezeBalance = item.id === 'streak-freeze' && freezeBalance > 0

            return (
              <li key={item.id} className="card shop-card">
                <div className="shop-card-icon-wrap">
                  {IconC && <IconC className="shop-card-icon" aria-hidden />}
                </div>
                <div className="shop-card-body">
                  <h3 className="shop-card-title">{item.name}</h3>
                  <p className="shop-card-desc">{item.description}</p>
                  {showFreezeBalance && (
                    <p className="shop-card-extra">Vorrat: {freezeBalance}</p>
                  )}
                  <div className="shop-card-footer">
                    <span className="shop-card-price">
                      <CrownIcon className="shop-card-price-icon" aria-hidden />
                      {item.price}
                    </span>
                    {ownedOrBought && !isConsumable ? (
                      <span className="shop-card-badge">Freigeschaltet</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary shop-card-btn"
                        disabled={!canAfford}
                        onClick={() => handlePurchase(item)}
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

      {unlockedItem && (
        <ShopUnlockModal item={unlockedItem} onClose={() => setUnlockedItem(null)} />
      )}
    </div>
  )
}
