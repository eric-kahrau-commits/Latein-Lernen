/** Ein Vokabelpaar: Vokabel (z. B. Latein) + Übersetzung (z. B. Deutsch) */
export interface VokabelEintrag {
  vokabel: string
  uebersetzung: string
}

/** Ein Lernset mit Name und bis zu 500 Vokabeln */
export interface Lernset {
  id: string
  name: string
  items: VokabelEintrag[]
  createdAt: number
}

const STORAGE_KEY = 'latinum-lernsets'
const MAX_VOKABELN = 500

function loadFromStorage(): Lernset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is Lernset =>
        s &&
        typeof s === 'object' &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Array.isArray(s.items) &&
        s.items.every(
          (i: unknown) =>
            i &&
            typeof i === 'object' &&
            typeof (i as VokabelEintrag).vokabel === 'string' &&
            typeof (i as VokabelEintrag).uebersetzung === 'string'
        ) &&
        typeof s.createdAt === 'number'
    )
  } catch {
    return []
  }
}

function saveToStorage(sets: Lernset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // ignore
  }
}

export function getLernsets(): Lernset[] {
  return loadFromStorage()
}

export function saveLernset(set: Omit<Lernset, 'id' | 'createdAt'>): Lernset {
  const sets = loadFromStorage()
  const now = Date.now()
  const id = `set-${now}-${Math.random().toString(36).slice(2, 10)}`
  const newSet: Lernset = {
    id,
    name: set.name.trim(),
    items: set.items
      .filter((i) => i.vokabel.trim() || i.uebersetzung.trim())
      .map((i) => ({ vokabel: i.vokabel.trim(), uebersetzung: i.uebersetzung.trim() })),
    createdAt: now,
  }
  sets.push(newSet)
  saveToStorage(sets)
  return newSet
}

export function deleteLernset(id: string): void {
  const sets = loadFromStorage().filter((s) => s.id !== id)
  saveToStorage(sets)
}

export function getLernsetById(id: string): Lernset | undefined {
  return loadFromStorage().find((s) => s.id === id)
}

export { MAX_VOKABELN }
