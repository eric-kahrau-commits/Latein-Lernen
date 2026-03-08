/** Eine Karteikarte mit Vorderseite und Rückseite – für beliebige Fächer. */
export interface KarteikartenEintrag {
  /** Text auf der Vorderseite (mehrzeilig möglich) */
  front: string
  /** Text auf der Rückseite (mehrzeilig möglich) */
  back: string
  /** Optional: Bild auf der Vorderseite (Base64 Data-URL) */
  frontImage?: string
  /** Optional: Bild auf der Rückseite (Base64 Data-URL) */
  backImage?: string
}

/** Ein Karteikarten-Lernset mit Name, Karten und Fach-Zuordnung. */
export interface KarteikartenSet {
  id: string
  name: string
  items: KarteikartenEintrag[]
  createdAt: number
  /** Fach (Ordner) – Pflicht beim Speichern. */
  fachId?: string
}

const STORAGE_KEY = 'latinum-karteikarten-sets'
const MAX_KARTEN = 200
const MAX_SET_NAME_LENGTH = 150
const MAX_TEXT_LENGTH = 2000

function loadFromStorage(): KarteikartenSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const filtered = parsed.filter(
      (s): s is KarteikartenSet =>
        s &&
        typeof s === 'object' &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Array.isArray(s.items) &&
        s.items.every(
          (i: unknown) =>
            i &&
            typeof i === 'object' &&
            typeof (i as KarteikartenEintrag).front === 'string' &&
            typeof (i as KarteikartenEintrag).back === 'string'
        ) &&
        typeof s.createdAt === 'number'
    )
    return filtered.map((s) => ({
      ...s,
      name: s.name.slice(0, MAX_SET_NAME_LENGTH),
      items: s.items.slice(0, MAX_KARTEN).map((item) => ({
        front: String(item.front).slice(0, MAX_TEXT_LENGTH),
        back: String(item.back).slice(0, MAX_TEXT_LENGTH),
        frontImage: typeof item.frontImage === 'string' ? item.frontImage : undefined,
        backImage: typeof item.backImage === 'string' ? item.backImage : undefined,
      })),
    }))
  } catch {
    return []
  }
}

function saveToStorage(sets: KarteikartenSet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // ignore
  }
}

export function getKarteikartenSets(): KarteikartenSet[] {
  return loadFromStorage()
}

export function saveKarteikartenSet(
  set: Omit<KarteikartenSet, 'id' | 'createdAt'>
): KarteikartenSet {
  if (!set.fachId || typeof set.fachId !== 'string' || !set.fachId.trim()) {
    throw new Error(
      'Ein Fach (Ordner) muss ausgewählt werden, um das Lernset zu speichern.'
    )
  }
  const sets = loadFromStorage()
  const now = Date.now()
  const id = `karteikarten-${now}-${Math.random().toString(36).slice(2, 10)}`
  const safeName = (typeof set.name === 'string' ? set.name : '')
    .trim()
    .slice(0, MAX_SET_NAME_LENGTH)
  const safeItems = (Array.isArray(set.items) ? set.items : [])
    .filter(
      (i) =>
        i &&
        typeof i.front === 'string' &&
        typeof i.back === 'string' &&
        (i.front.trim() || i.back.trim())
    )
    .map((i) => ({
      front: String(i.front).trim().slice(0, MAX_TEXT_LENGTH),
      back: String(i.back).trim().slice(0, MAX_TEXT_LENGTH),
      frontImage:
        typeof i.frontImage === 'string' && i.frontImage.startsWith('data:')
          ? i.frontImage
          : undefined,
      backImage:
        typeof i.backImage === 'string' && i.backImage.startsWith('data:')
          ? i.backImage
          : undefined,
    }))
    .slice(0, MAX_KARTEN)

  const newSet: KarteikartenSet = {
    id,
    name: safeName || 'Unbenannt',
    items: safeItems,
    createdAt: now,
    fachId: set.fachId.trim(),
  }
  sets.push(newSet)
  saveToStorage(sets)
  return newSet
}

export function deleteKarteikartenSet(id: string): void {
  const sets = loadFromStorage().filter((s) => s.id !== id)
  saveToStorage(sets)
}

export function getKarteikartenSetById(id: string): KarteikartenSet | undefined {
  return loadFromStorage().find((s) => s.id === id)
}

export function getKarteikartenSetsByFach(
  fachId: string
): KarteikartenSet[] {
  return loadFromStorage()
    .filter((s) => s.fachId === fachId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export { MAX_KARTEN }
