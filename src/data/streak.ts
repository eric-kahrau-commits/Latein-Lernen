/**
 * Streak-System: Einmal pro Tag steigt der Streak, wenn eine Lektion absolviert wurde.
 */

const STORAGE_KEY = 'latinum-streak'
const FREEZE_STORAGE_KEY = 'latinum-streak-freeze'

interface StoredStreak {
  streak: number
  lastDate: string // YYYY-MM-DD
}

function load(): StoredStreak {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { streak: 0, lastDate: '' }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { streak: 0, lastDate: '' }
    const p = parsed as Record<string, unknown>
    const streak = typeof p.streak === 'number' && p.streak >= 0 ? p.streak : 0
    const lastDate = typeof p.lastDate === 'string' ? p.lastDate : ''
    return { streak, lastDate }
  } catch {
    return { streak: 0, lastDate: '' }
  }
}

function save(data: StoredStreak) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadFreezeBalance(): number {
  try {
    const raw = localStorage.getItem(FREEZE_STORAGE_KEY)
    if (raw == null) return 0
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function saveFreezeBalance(n: number) {
  try {
    localStorage.setItem(FREEZE_STORAGE_KEY, String(Math.max(0, n)))
  } catch {
    // ignore
  }
}

/** Anzahl verfügbarer Streak-Freezes (Shop-Item) */
export function getFreezeBalance(): number {
  return loadFreezeBalance()
}

/** +1 Freeze (nach Kauf im Shop aufrufen) */
export function addFreeze(): void {
  saveFreezeBalance(loadFreezeBalance() + 1)
}

/** Verbraucht einen Freeze; gibt true zurück, wenn einer verbraucht wurde */
export function useFreeze(): boolean {
  const b = loadFreezeBalance()
  if (b <= 0) return false
  saveFreezeBalance(b - 1)
  return true
}

/** Aktuellen Streak lesen (ohne zu ändern) */
export function getStreak(): number {
  return load().streak
}

export interface StreakUpdateResult {
  streak: number
  updated: boolean // true wenn heute erstmals gezählt (Streak erhöht oder auf 1 gesetzt)
}

/**
 * Nach Abschluss einer Lektion aufrufen. Zählt maximal einmal pro Tag.
 * - Heute schon gezählt → keine Änderung.
 * - Gestern war letzter Tag → Streak +1.
 * - Länger her → Streak wird auf 1 gesetzt.
 */
export function updateStreak(): StreakUpdateResult {
  const today = getToday()
  const yesterday = getYesterday()
  const current = load()

  if (current.lastDate === today) {
    return { streak: current.streak, updated: false }
  }

  let newStreak: number
  if (current.lastDate === yesterday) {
    newStreak = current.streak + 1
  } else if (current.lastDate && current.lastDate !== today) {
    newStreak = getFreezeBalance() > 0 && useFreeze() ? current.streak : 1
  } else {
    newStreak = 1
  }

  save({ streak: newStreak, lastDate: today })
  return { streak: newStreak, updated: true }
}
