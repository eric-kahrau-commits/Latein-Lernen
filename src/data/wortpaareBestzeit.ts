/**
 * Bestzeiten für das Wortpaare-Spiel pro Lernset/Thema (localStorage).
 */

const STORAGE_KEY = 'latinum-wortpaare-bestzeiten'

function load(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(data)) {
      if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v) && v > 0) {
        out[k] = v
      }
    }
    return out
  } catch {
    return {}
  }
}

function save(data: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Bestzeit in Millisekunden für einen Schlüssel (z. B. Lernset-ID, verben-imperativ). */
export function getWortpaareBestzeit(key: string): number | null {
  const ms = load()[key]
  return typeof ms === 'number' && ms > 0 ? ms : null
}

/** Bestzeit setzen, wenn neue Zeit besser oder noch keine vorhanden. Gibt true zurück, wenn neue Bestzeit. */
export function setWortpaareBestzeitIfBetter(key: string, timeMs: number): boolean {
  const data = load()
  const prev = data[key]
  if (prev != null && prev <= timeMs) return false
  data[key] = timeMs
  save(data)
  return true
}
