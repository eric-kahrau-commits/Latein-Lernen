/**
 * Spaced Repetition – Grundlage: wann welche Vokabel wieder fällig ist.
 * Key = lernsetId + ":" + index (oder vokabel für Stabilität).
 */

import type { VokabelEintrag } from './lernsets'

const STORAGE_KEY = 'latinum-spaced-repetition'

const INTERVAL_DAYS = [1, 3, 7, 14, 30] // Tage bis zur nächsten Wiederholung pro Stufe

interface ItemState {
  level: number
  nextReview: string // YYYY-MM-DD
}

interface StoredData {
  items: Record<string, ItemState>
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: {} }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { items: {} }
    const p = parsed as Record<string, unknown>
    const items =
      p.items && typeof p.items === 'object' && !Array.isArray(p.items) ? (p.items as Record<string, ItemState>) : {}
    return { items }
  } catch {
    return { items: {} }
  }
}

function save(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function getKey(lernsetId: string, index: number, vokabel: string): string {
  return `${lernsetId}:${index}:${vokabel}`
}

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Nach einer richtigen Antwort: nächsten Wiederholungstermin setzen */
export function recordReview(lernsetId: string, index: number, vokabel: string, correct: boolean): void {
  const data = load()
  const key = getKey(lernsetId, index, vokabel)
  const today = getToday()
  const current = data.items[key]
  let level = current ? current.level : 0
  if (correct) {
    level = Math.min(level + 1, INTERVAL_DAYS.length - 1)
  } else {
    level = Math.max(0, level - 1)
  }
  const days = INTERVAL_DAYS[level] ?? INTERVAL_DAYS[INTERVAL_DAYS.length - 1]
  data.items[key] = { level, nextReview: addDays(today, days) }
  save(data)
}

/** Indizes der Vokabeln, die heute fällig sind (nextReview <= heute). Noch nie gesehen = fällig. */
export function getDueIndices(lernsetId: string, items: VokabelEintrag[]): number[] {
  const data = load()
  const today = getToday()
  const due: number[] = []
  items.forEach((item, index) => {
    const key = getKey(lernsetId, index, item.vokabel)
    const state = data.items[key]
    if (!state || state.nextReview <= today) due.push(index)
  })
  return due
}

/** Alle Items eines Lernsets, sortiert: fällige zuerst, dann Rest */
export function orderByDueFirst(
  lernsetId: string,
  items: VokabelEintrag[]
): { item: VokabelEintrag; index: number; due: boolean }[] {
  const dueSet = new Set(getDueIndices(lernsetId, items))
  return items
    .map((item, index) => ({ item, index, due: dueSet.has(index) }))
    .sort((a, b) => (a.due === b.due ? 0 : a.due ? -1 : 1))
}
