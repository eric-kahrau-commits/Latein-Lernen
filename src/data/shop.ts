/**
 * Shop – Items für Lobeskronen, Besitz in localStorage.
 * Kategorien: spaß, aussehen, hilfe (für Filter). Consumables (z. B. Streak-Freeze) sind mehrfach kaufbar.
 */

const STORAGE_KEY = 'latinum-shop-owned'

export type ShopCategory = 'spaß' | 'aussehen' | 'hilfe'

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  icon: 'crown' | 'sparkle' | 'ring' | 'theme' | 'shield' | 'star' | 'sound' | 'gift'
  category: ShopCategory
  /** Kurzer Text im Freischalt-Popup: Was man jetzt damit machen kann. */
  unlockMessage: string
  /** true = mehrfach kaufbar (z. B. Streak-Freeze), wird nicht in owned gespeichert */
  consumable?: boolean
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'konfetti-explosion',
    name: 'Konfetti-Explosion',
    description: 'Bei 100 % richtig: Mega-Konfetti-Show statt normalem Konfetti.',
    price: 30,
    icon: 'sparkle',
    category: 'spaß',
    unlockMessage: 'Ab sofort siehst du bei 100 % Trefferquote die Mega-Konfetti-Show in der Auswertung!',
  },
  {
    id: 'erfolgs-sound',
    name: 'Erfolgs-Sound',
    description: 'Ein kurzer, motivierender Sound wenn du eine Lektion mit 100 % abschließt.',
    price: 25,
    icon: 'sound',
    category: 'spaß',
    unlockMessage: 'Ab jetzt ertönt beim Erreichen von 100 % ein Erfolgs-Sound – hör dich an!',
  },
  {
    id: 'goldener-ring',
    name: 'Goldener Erfolgsring',
    description: 'Die Prozentanzeige wird bei der Auswertung von einem goldenen Ring umgeben.',
    price: 25,
    icon: 'ring',
    category: 'aussehen',
    unlockMessage: 'Deine Auswertung ziert jetzt ein goldener Ring um die Prozentanzeige.',
  },
  {
    id: 'theme-sonnenuntergang',
    name: 'Theme: Sonnenuntergang',
    description: 'Schalte ein warmes Orange-Violett-Theme frei (Hell & Dunkel).',
    price: 35,
    icon: 'theme',
    category: 'aussehen',
    unlockMessage: 'Theme freigeschaltet! Gehe zu Einstellungen → Design und wähle „Sonnenuntergang“.',
  },
  {
    id: 'theme-wald',
    name: 'Theme: Wald',
    description: 'Schalte ein ruhiges Grün-Theme frei (Hell & Dunkel).',
    price: 35,
    icon: 'theme',
    category: 'aussehen',
    unlockMessage: 'Theme freigeschaltet! Gehe zu Einstellungen → Design und wähle „Wald“.',
  },
  {
    id: 'champion-rahmen',
    name: 'Champion-Rahmen',
    description: 'Zeig einen exklusiven Rahmen um deinen Namen auf der Startseite und in den Einstellungen.',
    price: 50,
    icon: 'star',
    category: 'aussehen',
    unlockMessage: 'Du trägst jetzt den Champion-Rahmen – sichtbar in den Einstellungen und auf der Startseite!',
  },
  {
    id: 'streak-freeze',
    name: 'Streak-Freeze',
    description: 'Einmal pro Kauf: Ein Tag Pause, ohne deinen Streak zu verlieren. Mehrfach kaufbar.',
    price: 40,
    icon: 'shield',
    category: 'hilfe',
    unlockMessage: 'Ein Streak-Freeze wurde deinem Vorrat hinzugefügt. Bei einem verpassten Tag wird er automatisch genutzt.',
    consumable: true,
  },
  {
    id: 'taeglicher-bonus',
    name: 'Täglicher Kronen-Bonus',
    description: 'Einmal pro Tag: +2 Lobeskronen extra, wenn du mindestens eine Lektion absolvierst.',
    price: 45,
    icon: 'gift',
    category: 'hilfe',
    unlockMessage: 'Ab heute bekommst du einmal pro Tag 2 Extra-Kronen, sobald du deine erste Lektion machst!',
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

/** Item als gekauft markieren (Kronen-Abzug erfolgt separat in kronen.spendKronen). Consumables werden nicht in owned gespeichert. */
export function purchase(itemId: string): boolean {
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  if (!item) return false
  if (item.consumable) {
    return true
  }
  if (isOwned(itemId)) return false
  const owned = loadOwned()
  owned.push(itemId)
  saveOwned(owned)
  return true
}

export function getItemPrice(itemId: string): number {
  return SHOP_ITEMS.find((i) => i.id === itemId)?.price ?? 0
}

export function getItemById(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === itemId)
}

export const SHOP_CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'spaß', label: 'Spaß & Feiern' },
  { id: 'aussehen', label: 'Aussehen' },
  { id: 'hilfe', label: 'Lernen & Hilfe' },
]
