/**
 * Favoriten (Stern) für Lernsets – gespeichert in localStorage.
 * Key: latinum-favoriten (JSON-Array von Lernset-IDs)
 */

const STORAGE_KEY = 'latinum-favoriten'

function load(): string[] {
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

function save(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

/** Alle favorisierten Lernset-IDs */
export function getFavoritenIds(): string[] {
  return load()
}

/** Prüfen, ob ein Lernset favorisiert ist */
export function isFavorit(lernsetId: string): boolean {
  return load().includes(lernsetId)
}

const MAX_FAVORITEN = 5

/** Favorit umschalten (Stern setzen/entfernen). Max. 5 Favoriten. */
export function toggleFavorit(lernsetId: string): void {
  const ids = load()
  const i = ids.indexOf(lernsetId)
  if (i >= 0) {
    ids.splice(i, 1)
  } else {
    if (ids.length >= MAX_FAVORITEN) ids.shift()
    ids.push(lernsetId)
  }
  save(ids)
}

/** Max. erlaubte Anzahl Favoriten */
export function getMaxFavoriten(): number {
  return MAX_FAVORITEN
}
