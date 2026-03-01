/** Eine abgeschlossene Lerneinheit (für Lernminuten & Kalender) */
export interface StatistikSession {
  date: string // YYYY-MM-DD
  lessonId: string
  lessonName: string
  minutes: number
}

/** Ein Durchlauf mit Trefferquote (für Diagramm Verlauf) */
export interface StatistikAttempt {
  attempt: number
  percent: number
}

const STORAGE_KEY = 'latinum-statistik'

export type StatistikMode = 'anschauen' | 'karteikarten' | 'lernen' | 'test'

interface StoredData {
  sessions: StatistikSession[]
  attempts: Record<string, StatistikAttempt[]> // key: `${lessonId}:${mode}`
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sessions: [], attempts: {} }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { sessions: [], attempts: {} }
    const p = parsed as Record<string, unknown>
    const sessions = Array.isArray(p.sessions)
      ? (p.sessions as StatistikSession[]).filter(
          (s) =>
            s &&
            typeof s.date === 'string' &&
            typeof s.lessonId === 'string' &&
            typeof s.lessonName === 'string' &&
            typeof s.minutes === 'number'
        )
      : []
    const attempts =
      p.attempts && typeof p.attempts === 'object' && !Array.isArray(p.attempts)
        ? (p.attempts as Record<string, StatistikAttempt[]>)
        : {}
    return { sessions, attempts }
  } catch {
    return { sessions: [], attempts: {} }
  }
}

function save(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** Session hinzufügen (Lernminuten + Tag) */
export function addSession(date: string, lessonId: string, lessonName: string, minutes: number) {
  const data = load()
  data.sessions.push({
    date: date.slice(0, 10),
    lessonId,
    lessonName,
    minutes: Math.max(0, Math.round(minutes * 10) / 10),
  })
  save(data)
}

/** Attempt mit Trefferquote hinzufügen */
export function addAttempt(lessonId: string, mode: StatistikMode, percent: number) {
  const data = load()
  const key = `${lessonId}:${mode}`
  const list = data.attempts[key] ?? []
  list.push({ attempt: list.length + 1, percent: Math.round(percent) })
  data.attempts[key] = list
  save(data)
}

/** Statistik komplett zurücksetzen (Sessions + Attempts) */
export function clearStatistik(): void {
  save({ sessions: [], attempts: {} })
}

/** Alle Sessions (für Kalender: nach Datum gruppieren) */
export function getSessions(): StatistikSession[] {
  return load().sessions
}

/** Anzahl abgeschlossener Lektionen (Sessions) an einem Datum (YYYY-MM-DD) */
export function getSessionCountForDate(date: string): number {
  const day = date.slice(0, 10)
  return load().sessions.filter((s) => s.date === day).length
}

/** Minuten pro Tag im angegebenen Monat (YYYY-MM) */
export function getMinutesByDayInMonth(yearMonth: string): Record<string, number> {
  const prefix = yearMonth.slice(0, 7) // YYYY-MM
  const byDay: Record<string, number> = {}
  load().sessions.forEach((s) => {
    if (s.date.startsWith(prefix)) {
      byDay[s.date] = (byDay[s.date] ?? 0) + s.minutes
    }
  })
  return byDay
}

/** Lernminuten pro Lektion (für Balkendiagramm „Lektionen“) */
export function getMinutesByLesson(): { lessonId: string; lessonName: string; minutes: number }[] {
  const byLesson: Record<string, { lessonId: string; lessonName: string; minutes: number }> = {}
  load().sessions.forEach((s) => {
    if (!byLesson[s.lessonId]) {
      byLesson[s.lessonId] = { lessonId: s.lessonId, lessonName: s.lessonName, minutes: 0 }
    }
    byLesson[s.lessonId].minutes += s.minutes
  })
  return Object.values(byLesson).sort((a, b) => b.minutes - a.minutes)
}

/** Attempts für ein Lernset/Lektion + Modus (für Trefferquote-Diagramm) */
export function getAttempts(lessonId: string, mode: StatistikMode): StatistikAttempt[] {
  const key = `${lessonId}:${mode}`
  return load().attempts[key] ?? []
}

/** Fixe Deklinations-, Verben- und Sachkunde-Lektionen (für Dropdown) */
export const DEKLINATION_LESSON_OPTIONS: { id: string; name: string }[] = [
  { id: 'sachkunde-triumphzug', name: 'Sachkunde – Triumphzug' },
  { id: 'sachkunde-patrizier-plebejer', name: 'Sachkunde – Patrizier und Plebejer' },
  { id: 'sachkunde-rom-sklaven', name: 'Sachkunde – Rom und seine Sklaven' },
  { id: 'sachkunde-etrusker', name: 'Sachkunde – Die Etrusker und ihr Einfluss auf Rom' },
  { id: 'sachkunde-raub-sabinerinnen', name: 'Sachkunde – Der Raub der Sabinerinnen' },
  { id: 'verben-imperativ', name: 'Verben – Imperativ' },
  { id: 'verben-perfekt', name: 'Verben – Perfekt' },
  { id: 'verben-imperfekt', name: 'Verben – Imperfekt' },
  { id: 'verben-plusquamperfekt', name: 'Verben – Plusquamperfekt' },
  { id: 'substantive-a', name: 'Substantive – A-Deklination' },
  { id: 'substantive-o', name: 'Substantive – O-Deklination' },
  { id: 'substantive-u', name: 'Substantive – U-Deklination' },
  { id: 'substantive-konsonantisch', name: 'Substantive – Konsonantische Deklination' },
  { id: 'adjektive-a-o', name: 'Adjektive – A-/O-Deklination (bonus)' },
  { id: 'adjektive-konsonantisch', name: 'Adjektive – Konsonantische Deklination (acer)' },
]

/** Alle wählbaren Lektionen: Lernsets + Deklinationen (für Dropdown) */
export function getLessonOptions(
  lernsetOptions: { id: string; name: string }[]
): { id: string; name: string }[] {
  const byId = new Map<string, string>()
  load().sessions.forEach((s) => byId.set(s.lessonId, s.lessonName))
  lernsetOptions.forEach((o) => byId.set(o.id, o.name))
  DEKLINATION_LESSON_OPTIONS.forEach((o) => byId.set(o.id, o.name))
  return Array.from(byId.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const DEKLINATION_IDS = new Set(DEKLINATION_LESSON_OPTIONS.map((o) => o.id))

const MAX_ZULETZT = 5

/**
 * Zuletzt genutzte Lernsets (nur Vokabel-Lernsets, keine Deklinationen). Max. 5.
 * Sessions werden von hinten durchlaufen; Reihenfolge = zuletzt genutzt zuerst.
 */
export function getLastUsedLernsetIds(lernsetIds: Set<string>, limit: number = MAX_ZULETZT): string[] {
  const sessions = load().sessions
  const result: string[] = []
  const seen = new Set<string>()
  const max = Math.min(limit, MAX_ZULETZT)
  for (let i = sessions.length - 1; i >= 0 && result.length < max; i--) {
    const id = sessions[i].lessonId
    if (DEKLINATION_IDS.has(id)) continue
    if (!lernsetIds.has(id)) continue
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}
