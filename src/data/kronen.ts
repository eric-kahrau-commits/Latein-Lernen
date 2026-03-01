/**
 * Lobeskronen – Belohnungswährung mit Tageslimit.
 * Max. 12 Kronen pro Tag, pro Lektion 1–3 Kronen (je nach Ergebnis).
 */

const STORAGE_KEY = 'latinum-kronen'
const DAILY_CAP = 12

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
 * Nach absolvierter Lektion aufrufen. Vergibt 1–3 Kronen (je nach Prozent),
 * maximal DAILY_CAP pro Tag. Einmal pro Abschluss (nicht pro Frage).
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

  let crowns = 1
  if (percent >= 80) crowns += 1
  if (percent >= 100) crowns += 1
  crowns = Math.min(crowns, remaining)

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
