/**
 * Lobeskronen – Belohnungswährung mit Tageslimit.
 * Max. 20 Kronen pro Tag; in 2 guten Lektionen (z. B. 80 % und 100 %) erreichbar.
 */

const STORAGE_KEY = 'latinum-kronen'
const BONUS_USED_KEY = 'latinum-kronen-daily-bonus-date'
const DAILY_CAP = 20
const DAILY_BONUS_CROWNS = 2

interface StoredKronen {
  balance: number
  earnedToday: number
  date: string // YYYY-MM-DD
}

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function load(): StoredKronen {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { balance: 0, earnedToday: 0, date: '' }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { balance: 0, earnedToday: 0, date: '' }
    const p = parsed as Record<string, unknown>
    const balance = typeof p.balance === 'number' && p.balance >= 0 ? p.balance : 0
    const earnedToday = typeof p.earnedToday === 'number' && p.earnedToday >= 0 ? p.earnedToday : 0
    const date = typeof p.date === 'string' ? p.date : ''
    return { balance, earnedToday, date }
  } catch {
    return { balance: 0, earnedToday: 0, date: '' }
  }
}

function save(data: StoredKronen) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** Aktueller Kontostand */
export function getKronenBalance(): number {
  return load().balance
}

/** Heute schon verdiente Kronen (für Anzeige „X / 12 heute“) */
export function getEarnedToday(): number {
  const data = load()
  const today = getToday()
  if (data.date !== today) return 0
  return data.earnedToday
}

/** Tageslimit */
export function getDailyCap(): number {
  return DAILY_CAP
}

/** Kronen ausgeben (z. B. im Shop). Gibt true zurück wenn genug vorhanden. */
export function spendKronen(amount: number): boolean {
  const data = load()
  if (data.balance < amount || amount <= 0) return false
  data.balance -= amount
  save(data)
  return true
}

export interface KronenAwardResult {
  awarded: number
  newBalance: number
  earnedToday: number
  dailyCap: number
}

/**
 * Kronen pro Lektion (0–10) nach Ergebnis. So erreichbar: max. 20/Tag in ca. 2 Lektionen.
 * < 50 %: 0 | 50–59: 3 | 60–69: 4 | 70–79: 5 | 80–89: 7 | 90–99: 9 | 100: 10
 */
function crownsForPercent(percent: number): number {
  if (percent < 50) return 0
  if (percent < 60) return 3
  if (percent < 70) return 4
  if (percent < 80) return 5
  if (percent < 90) return 7
  if (percent < 100) return 9
  return 10
}

/**
 * Nach absolvierter Lektion aufrufen. Vergibt 0–10 Kronen (je nach Prozent),
 * maximal DAILY_CAP pro Tag. Einmal pro Abschluss (nicht pro Frage).
 * Zwei gute Lektionen (z. B. 80 % + 100 %) reichen für das Tageslimit.
 */
export function awardKronenForLesson(percent: number): KronenAwardResult {
  const today = getToday()
  let data = load()

  if (data.date !== today) {
    data = { ...data, earnedToday: 0, date: today }
  }

  const remaining = Math.max(0, DAILY_CAP - data.earnedToday)
  if (remaining <= 0) {
    return { awarded: 0, newBalance: data.balance, earnedToday: data.earnedToday, dailyCap: DAILY_CAP }
  }

  const crowns = Math.min(crownsForPercent(percent), remaining)

  data.earnedToday += crowns
  data.balance += crowns
  save(data)
  return {
    awarded: crowns,
    newBalance: data.balance,
    earnedToday: data.earnedToday,
    dailyCap: DAILY_CAP,
  }
}

/**
 * Täglicher Kronen-Bonus (Shop-Item „Täglicher Kronen-Bonus“).
 * Einmal pro Tag: +2 Kronen, wenn der Aufrufer gerade Kronen verdient hat.
 * Gibt die zusätzlich vergebenen Kronen zurück (0 oder 2).
 */
export function addDailyBonusIfEligible(): number {
  const today = getToday()
  try {
    const used = localStorage.getItem(BONUS_USED_KEY)
    if (used === today) return 0
  } catch {
    return 0
  }
  const data = load()
  data.balance += DAILY_BONUS_CROWNS
  save(data)
  try {
    localStorage.setItem(BONUS_USED_KEY, today)
  } catch {
    // ignore
  }
  return DAILY_BONUS_CROWNS
}
