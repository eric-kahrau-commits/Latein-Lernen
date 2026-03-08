/** Ein Vokabelpaar: Vokabel + Übersetzung, optional mit Bildern (Base64) für Karteikarten-Modus */
export interface VokabelEintrag {
  vokabel: string
  uebersetzung: string
  /** Optional: Bild zur Vorderseite (Base64 Data-URL), nur im Karteikarten-Modus angezeigt */
  vokabelImage?: string
  /** Optional: Bild zur Rückseite (Base64 Data-URL), nur im Karteikarten-Modus angezeigt */
  uebersetzungImage?: string
  /** Optional: 3 plausible Falschantworten für Multiple-Choice (z. B. von KI generiert); Glücksrad, Lernen, Test, Autorennen */
  wrongOptions?: string[]
}

/** Ein Lernset mit Name und bis zu 500 Vokabeln. Gehört immer einem Fach (fachId). */
export interface Lernset {
  id: string
  name: string
  items: VokabelEintrag[]
  createdAt: number
  /** Fach (Ordner) – Pflicht beim Speichern; ältere Sets können fehlen. */
  fachId?: string
  /** optional: Herkunft des Sets (manuell oder KI) */
  source?: 'manual' | 'ai'
  /** optional: Thema / Unterthema, z. B. „freizeit“ */
  topicId?: string
}

const STORAGE_KEY = 'latinum-lernsets'
const MAX_VOKABELN = 500
const MAX_SET_NAME_LENGTH = 150

function loadFromStorage(): Lernset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const filtered = parsed.filter(
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
    return filtered.map((s) => ({
      ...s,
      name: s.name.slice(0, MAX_SET_NAME_LENGTH),
      items: s.items.slice(0, MAX_VOKABELN),
    }))
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
  if (!set.fachId || typeof set.fachId !== 'string' || !set.fachId.trim()) {
    throw new Error('Ein Fach (Ordner) muss ausgewählt werden, um das Lernset zu speichern.')
  }
  const sets = loadFromStorage()
  const now = Date.now()
  const id = `set-${now}-${Math.random().toString(36).slice(2, 10)}`
  const safeName = (typeof set.name === 'string' ? set.name : '').trim().slice(0, MAX_SET_NAME_LENGTH)
  const safeItems = (Array.isArray(set.items) ? set.items : [])
    .filter((i) => i && typeof i.vokabel === 'string' && typeof i.uebersetzung === 'string')
    .map((i) => {
      const entry: VokabelEintrag = {
        vokabel: String(i.vokabel).trim().slice(0, 500),
        uebersetzung: String(i.uebersetzung).trim().slice(0, 500),
      }
      if (typeof (i as VokabelEintrag).vokabelImage === 'string' && (i as VokabelEintrag).vokabelImage!.startsWith('data:')) {
        entry.vokabelImage = (i as VokabelEintrag).vokabelImage
      }
      if (typeof (i as VokabelEintrag).uebersetzungImage === 'string' && (i as VokabelEintrag).uebersetzungImage!.startsWith('data:')) {
        entry.uebersetzungImage = (i as VokabelEintrag).uebersetzungImage
      }
      const wrongOpts = (i as VokabelEintrag).wrongOptions
      if (Array.isArray(wrongOpts) && wrongOpts.length >= 3) {
        entry.wrongOptions = wrongOpts.slice(0, 3).filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
        if (entry.wrongOptions.length < 3) entry.wrongOptions = undefined
      }
      return entry
    })
    .filter((i) => i.vokabel || i.uebersetzung)
    .slice(0, MAX_VOKABELN)
  const newSet: Lernset = {
    id,
    name: safeName || 'Unbenannt',
    items: safeItems,
    createdAt: now,
    fachId: set.fachId.trim(),
    source: set.source === 'ai' ? 'ai' : 'manual',
    topicId: typeof set.topicId === 'string' ? set.topicId.trim().slice(0, 100) : undefined,
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

/** Alle Lernsets eines Faches (für Lernseite). */
export function getLernsetsByFach(fachId: string): Lernset[] {
  return loadFromStorage()
    .filter((s) => s.fachId === fachId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export { MAX_VOKABELN }
