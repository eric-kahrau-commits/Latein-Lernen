import { type DeklinationBeispiel } from './deklinationen'

const STORAGE_KEY = 'latinum-ai-deklinationen'

export type AiDeklTyp = 'a' | 'o' | 'u' | 'konsonantisch'

export interface AiDeklinationSet {
  id: string
  title: string
  typ: AiDeklTyp
  beispiel: DeklinationBeispiel
  createdAt: number
  /** Fach (Ordner) – Pflicht beim Speichern. */
  fachId?: string
}

function load(): AiDeklinationSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is AiDeklinationSet => {
      return (
        s &&
        typeof s === 'object' &&
        typeof (s as AiDeklinationSet).id === 'string' &&
        typeof (s as AiDeklinationSet).title === 'string' &&
        (['a', 'o', 'u', 'konsonantisch'] as const).includes((s as AiDeklinationSet).typ) &&
        (s as AiDeklinationSet).beispiel != null
      )
    })
  } catch {
    return []
  }
}

function save(data: AiDeklinationSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function getAiDeklinationSets(): AiDeklinationSet[] {
  return load()
}

export function saveAiDeklinationSet(input: Omit<AiDeklinationSet, 'id' | 'createdAt'>): AiDeklinationSet {
  if (!input.fachId || typeof input.fachId !== 'string' || !input.fachId.trim()) {
    throw new Error('Ein Fach (Ordner) muss ausgewählt werden, um das Lernset zu speichern.')
  }
  const all = load()
  const now = Date.now()
  const id = `ai-dekl-${now}-${Math.random().toString(36).slice(2, 10)}`
  const set: AiDeklinationSet = {
    id,
    title: input.title.trim() || input.beispiel.name,
    typ: input.typ,
    beispiel: input.beispiel,
    createdAt: now,
    fachId: input.fachId.trim(),
  }
  all.push(set)
  save(all)
  return set
}

export function deleteAiDeklinationSet(id: string): void {
  const all = load().filter((s) => s.id !== id)
  save(all)
}

export function getAiDeklinationenForTyp(typ: AiDeklTyp): DeklinationBeispiel[] {
  return load()
    .filter((s) => s.typ === typ)
    .map((s) => s.beispiel)
}

export function getAiDeklinationSetById(id: string): AiDeklinationSet | undefined {
  return load().find((s) => s.id === id)
}

/** Alle KI-Deklinations-Sets eines Faches. */
export function getAiDeklinationSetsByFach(fachId: string): AiDeklinationSet[] {
  return load()
    .filter((s) => s.fachId === fachId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

