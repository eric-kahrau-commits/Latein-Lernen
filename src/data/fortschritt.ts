/**
 * Fortschritts-Überblick und Empfohlene Lektion für Home und Lernen.
 * Nutzt statistik, spacedRepetition und lernsets.
 */

import { getLernsets } from './lernsets'
import { getKarteikartenSets } from './karteikartenSets'
import { getDueIndices } from './spacedRepetition'
import {
  getSessionCountByLesson,
  getAveragePercentByLesson,
  getLastUsedLernsetIds,
  DEKLINATION_LESSON_OPTIONS,
} from './statistik'

export interface FortschrittÜberblick {
  gesamteLektionen: number
  durchschnittProzent: number | null
  vokabelnFälligHeute: number
}

/**
 * Übersicht: wie viele Lektionen absolviert, Durchschnitts-Quote, heute fällige Vokabeln.
 */
export function getFortschrittÜberblick(): FortschrittÜberblick {
  const byLesson = getSessionCountByLesson()
  const gesamteLektionen = byLesson.length

  const avgByLesson = getAveragePercentByLesson()
  let durchschnittProzent: number | null = null
  if (avgByLesson.length > 0) {
    const sum = avgByLesson.reduce((a, b) => a + b.avgPercent, 0)
    durchschnittProzent = Math.round(sum / avgByLesson.length)
  }

  const lernsets = getLernsets()
  let vokabelnFälligHeute = 0
  lernsets.forEach((set) => {
    if (set.items.length > 0) {
      vokabelnFälligHeute += getDueIndices(set.id, set.items).length
    }
  })

  return {
    gesamteLektionen,
    durchschnittProzent,
    vokabelnFälligHeute,
  }
}

export type EmpfohleneLektionReason = 'fällig' | 'zuletzt' | 'start'

export interface EmpfohleneLektion {
  type: 'lernset'
  id: string
  name: string
  reason: EmpfohleneLektionReason
  /** Bei reason 'fällig': Anzahl fälliger Vokabeln in diesem Set */
  dueCount?: number
}

/**
 * Eine Lektion zum Weitermachen: Priorität fällige Vokabeln → zuletzt genutzt → Einstieg.
 */
export function getEmpfohleneLektion(): EmpfohleneLektion | null {
  const lernsets = getLernsets()
  if (lernsets.length === 0) return null

  const lernsetIds = new Set(lernsets.map((s) => s.id))

  // 1. Sets mit fälligen Vokabeln (meiste zuerst)
  const withDue: { set: (typeof lernsets)[0]; dueCount: number }[] = []
  lernsets.forEach((set) => {
    if (set.items.length === 0) return
    const due = getDueIndices(set.id, set.items)
    if (due.length > 0) withDue.push({ set, dueCount: due.length })
  })
  if (withDue.length > 0) {
    withDue.sort((a, b) => b.dueCount - a.dueCount)
    const first = withDue[0]
    return {
      type: 'lernset',
      id: first.set.id,
      name: first.set.name,
      reason: 'fällig',
      dueCount: first.dueCount,
    }
  }

  // 2. Zuletzt genutzt
  const lastUsedIds = getLastUsedLernsetIds(lernsetIds, 1)
  if (lastUsedIds.length > 0) {
    const set = lernsets.find((s) => s.id === lastUsedIds[0])
    if (set) {
      return {
        type: 'lernset',
        id: set.id,
        name: set.name,
        reason: 'zuletzt',
      }
    }
  }

  // 3. Einstieg: erstes Lernset
  return {
    type: 'lernset',
    id: lernsets[0].id,
    name: lernsets[0].name,
    reason: 'start',
  }
}

export interface FortschrittProLektionEntry {
  lessonId: string
  lessonName: string
  avgPercent: number
  attemptCount: number
}

/**
 * Top-Lektionen nach Durchschnitts-Prozent (für „Fortschritt nach Lektion“ auf Home).
 */
export function getFortschrittProLektion(limit: number = 5): FortschrittProLektionEntry[] {
  const list = getAveragePercentByLesson()
  return list.slice(0, limit).map((x) => ({
    lessonId: x.lessonId,
    lessonName: x.lessonName,
    avgPercent: x.avgPercent,
    attemptCount: x.attemptCount,
  }))
}

/**
 * „X von Y Lektionen mindestens einmal absolviert“ – Y = alle verfügbaren Lektionen (Lernsets + Deklinationen/Verben/Sachkunde + Karteikarten).
 */
export function getGesamtFortschrittXVonY(): { absolviert: number; gesamt: number } {
  const lernsets = getLernsets()
  const karteikarten = getKarteikartenSets()
  const allIds = new Set<string>([
    ...lernsets.map((s) => s.id),
    ...DEKLINATION_LESSON_OPTIONS.map((o) => o.id),
    ...karteikarten.map((s) => s.id),
  ])
  const gesamt = allIds.size
  const byLesson = getSessionCountByLesson()
  const absolviertIds = new Set(byLesson.map((x) => x.lessonId))
  let absolviert = 0
  allIds.forEach((id) => {
    if (absolviertIds.has(id)) absolviert += 1
  })
  return { absolviert, gesamt }
}
