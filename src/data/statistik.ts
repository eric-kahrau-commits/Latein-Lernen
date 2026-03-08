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

const WOCHENTAG_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Lernminuten pro Wochentag (0 = Mo, 6 = So) */
export function getMinutesByWeekday(): { weekday: number; weekdayName: string; minutes: number }[] {
  const byDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  load().sessions.forEach((s) => {
    const d = new Date(s.date + 'T12:00:00')
    const w = (d.getDay() + 6) % 7
    byDay[w] = (byDay[w] ?? 0) + s.minutes
  })
  return WOCHENTAG_NAMES.map((weekdayName, i) => ({
    weekday: i,
    weekdayName,
    minutes: byDay[i] ?? 0,
  }))
}

/** Anzahl Sessions (Durchläufe) pro Lektion */
export function getSessionCountByLesson(): { lessonId: string; lessonName: string; count: number }[] {
  const byLesson: Record<string, { lessonName: string; count: number }> = {}
  load().sessions.forEach((s) => {
    if (!byLesson[s.lessonId]) {
      byLesson[s.lessonId] = { lessonName: s.lessonName, count: 0 }
    }
    byLesson[s.lessonId].count += 1
    byLesson[s.lessonId].lessonName = s.lessonName
  })
  return Object.entries(byLesson)
    .map(([lessonId, v]) => ({ lessonId, lessonName: v.lessonName, count: v.count }))
    .sort((a, b) => b.count - a.count)
}

/** Aktivität der letzten 30 Tage: Datum, Minuten, ob aktiv */
export function getActivityLast30Days(): { date: string; minutes: number; hasActivity: boolean }[] {
  const result: { date: string; minutes: number; hasActivity: boolean }[] = []
  const byDay: Record<string, number> = {}
  load().sessions.forEach((s) => {
    byDay[s.date] = (byDay[s.date] ?? 0) + s.minutes
  })
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const minutes = byDay[date] ?? 0
    result.push({ date, minutes, hasActivity: minutes > 0 })
  }
  return result
}

function getLessonName(lessonId: string): string {
  const s = load().sessions.find((x) => x.lessonId === lessonId)
  if (s) return s.lessonName
  const opt = DEKLINATION_LESSON_OPTIONS.find((o) => o.id === lessonId)
  return opt ? opt.name : lessonId
}

/** Durchschnittliche Trefferquote pro Lektion (über alle Modi) */
export function getAveragePercentByLesson(): { lessonId: string; lessonName: string; avgPercent: number; attemptCount: number }[] {
  const data = load()
  const byLesson: Record<string, number[]> = {}
  Object.entries(data.attempts).forEach(([key, list]) => {
    const lessonId = key.split(':')[0]
    if (!byLesson[lessonId]) byLesson[lessonId] = []
    list.forEach((a) => byLesson[lessonId].push(a.percent))
  })
  return Object.entries(byLesson)
    .map(([lessonId, percents]) => {
      const sum = percents.reduce((a, b) => a + b, 0)
      return {
        lessonId,
        lessonName: getLessonName(lessonId),
        avgPercent: percents.length ? Math.round(sum / percents.length) : 0,
        attemptCount: percents.length,
      }
    })
    .filter((x) => x.attemptCount > 0)
    .sort((a, b) => b.avgPercent - a.avgPercent)
}

/** Erste vs. beste Trefferquote pro Lektion */
export function getBestVsFirstPercentByLesson(): { lessonId: string; lessonName: string; firstPercent: number; bestPercent: number }[] {
  const data = load()
  const byLesson: Record<string, { first: number; best: number }> = {}
  Object.entries(data.attempts).forEach(([key, list]) => {
    const lessonId = key.split(':')[0]
    if (list.length === 0) return
    const first = list[0].percent
    const best = Math.max(...list.map((a) => a.percent))
    if (!byLesson[lessonId]) {
      byLesson[lessonId] = { first: first, best }
    } else {
      byLesson[lessonId].first = Math.min(byLesson[lessonId].first, first)
      byLesson[lessonId].best = Math.max(byLesson[lessonId].best, best)
    }
  })
  return Object.entries(byLesson)
    .map(([lessonId, v]) => ({
      lessonId,
      lessonName: getLessonName(lessonId),
      firstPercent: v.first,
      bestPercent: v.best,
    }))
    .sort((a, b) => b.bestPercent - b.firstPercent - (a.bestPercent - a.firstPercent))
}

/** Anzahl Durchläufe (Attempts) pro Lernmodus */
export function getAttemptCountByMode(): { mode: StatistikMode; modeLabel: string; count: number }[] {
  const MODE_LABELS: Record<StatistikMode, string> = {
    anschauen: 'Anschauen',
    karteikarten: 'Karteikarten',
    lernen: 'Lernen',
    test: 'Test',
  }
  const data = load()
  const byMode: Record<StatistikMode, number> = { anschauen: 0, karteikarten: 0, lernen: 0, test: 0 }
  Object.entries(data.attempts).forEach(([key, list]) => {
    const mode = key.split(':')[1] as StatistikMode
    if (byMode[mode] !== undefined) byMode[mode] += list.length
  })
  return (['anschauen', 'karteikarten', 'lernen', 'test'] as StatistikMode[]).map((mode) => ({
    mode,
    modeLabel: MODE_LABELS[mode],
    count: byMode[mode] ?? 0,
  }))
}

/** Lernminuten pro Woche (letzte N Wochen) */
export function getMinutesByWeek(lastWeeks: number = 8): { weekLabel: string; yearWeek: string; minutes: number }[] {
  const byWeek: Record<string, number> = {}
  const sessions = load().sessions
  sessions.forEach((s) => {
    const d = new Date(s.date + 'T12:00:00')
    const start = new Date(d)
    start.setDate(start.getDate() - start.getDay() + 1)
    const key = start.toISOString().slice(0, 10)
    byWeek[key] = (byWeek[key] ?? 0) + s.minutes
  })
  const result: { weekLabel: string; yearWeek: string; minutes: number }[] = []
  for (let i = lastWeeks - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - 7 * i)
    d.setDate(d.getDate() - d.getDay() + 1)
    const yearWeek = d.toISOString().slice(0, 10)
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    result.push({
      weekLabel: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} – ${end.getDate()}.${String(end.getMonth() + 1).padStart(2, '0')}`,
      yearWeek,
      minutes: byWeek[yearWeek] ?? 0,
    })
  }
  return result
}
