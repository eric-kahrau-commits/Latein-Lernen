/**
 * Shop – Items für Lobeskronen, Besitz in localStorage.
 */

const STORAGE_KEY = 'latinum-shop-owned'

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  icon: 'crown' | 'sparkle' | 'ring' | 'theme' | 'shield' | 'star'
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'konfetti-explosion',
    name: 'Konfetti-Explosion',
    description: 'Bei 100 % richtig: Mega-Konfetti-Show statt normalem Konfetti.',
    price: 30,
    icon: 'sparkle',
  },
  {
    id: 'goldener-ring',
    name: 'Goldener Erfolgsring',
    description: 'Die Prozentanzeige wird bei der Auswertung von einem goldenen Ring umgeben.',
    price: 25,
    icon: 'ring',
  },
  {
    id: 'theme-sonnenuntergang',
    name: 'Theme: Sonnenuntergang',
    description: 'Schalte ein warmes Orange-Violett-Theme frei (Hell & Dunkel).',
    price: 35,
    icon: 'theme',
  },
  {
    id: 'theme-wald',
    name: 'Theme: Wald',
    description: 'Schalte ein ruhiges Grün-Theme frei (Hell & Dunkel).',
    price: 35,
    icon: 'theme',
  },
  {
    id: 'champion-rahmen',
    name: 'Champion-Rahmen',
    description: 'Zeig einen exklusiven Rahmen um deinen Namen auf der Startseite.',
    price: 50,
    icon: 'star',
  },
  {
    id: 'streak-freeze',
    name: 'Streak-Freeze',
    description: 'Einmal pro Kauf: Ein Tag Pause, ohne deinen Streak zu verlieren.',
    price: 40,
    icon: 'shield',
  },
]

function loadOwned(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function saveOwned(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

export function getOwnedIds(): string[] {
  return loadOwned()
}

export function isOwned(itemId: string): boolean {
  return loadOwned().includes(itemId)
}

/** Item als gekauft markieren (Kronen-Abzug erfolgt separat in kronen.spendKronen). */
export function purchase(itemId: string): boolean {
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  if (!item || isOwned(itemId)) return false
  const owned = loadOwned()
  owned.push(itemId)
  saveOwned(owned)
  return true
}

/** Kronen nach Kauf abziehen (getrennt, da Balance in kronen.ts lebt) */
export function getItemPrice(itemId: string): number {
  return SHOP_ITEMS.find((i) => i.id === itemId)?.price ?? 0
}
