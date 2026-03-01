/**
 * Tagesziel: z.B. „1 Lektion heute“ – wird aus Statistik ermittelt.
 */

import { getSessionCountForDate } from './statistik'

const GOAL_SESSIONS_PER_DAY = 1

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Anzahl heute absolvierter Lektionen (Sessions) */
export function getTodaySessionCount(): number {
  return getSessionCountForDate(getToday())
}

/** Tagesziel (Anzahl Lektionen) */
export function getDailyGoal(): number {
  return GOAL_SESSIONS_PER_DAY
}

/** Ob das Tagesziel heute schon erreicht ist */
export function isDailyGoalReached(): boolean {
  return getTodaySessionCount() >= GOAL_SESSIONS_PER_DAY
}
