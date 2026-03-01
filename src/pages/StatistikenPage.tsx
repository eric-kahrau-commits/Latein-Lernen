import { useState, useMemo, useEffect } from 'react'
import {
  getMinutesByDayInMonth,
  getMinutesByLesson,
  getAttempts,
  getLessonOptions,
  type StatistikMode,
} from '../data/statistik'
import { getLernsets } from '../data/lernsets'
import { loadStatistikUI, saveStatistikUI } from '../data/pageState'
import './StatistikenPage.css'

const MODI: { id: StatistikMode; label: string }[] = [
  { id: 'anschauen', label: 'Anschauen' },
  { id: 'karteikarten', label: 'Karteikarten' },
  { id: 'lernen', label: 'Lernen' },
  { id: 'test', label: 'Test' },
]

function getDaysInMonth(year: number, month: number): Date[] {
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const WOCHENTAG = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const initialStat = loadStatistikUI()

export function StatistikenPage() {
  const [statMonth, setStatMonth] = useState(initialStat.statMonth)
  const [trefferLessonId, setTrefferLessonId] = useState<string>(initialStat.trefferLessonId)
  const [trefferMode, setTrefferMode] = useState<StatistikMode>(initialStat.trefferMode)

  useEffect(() => {
    saveStatistikUI({ statMonth, trefferLessonId, trefferMode })
  }, [statMonth, trefferLessonId, trefferMode])

  const today = new Date()
  const lernsets = useMemo(() => getLernsets(), [])
  const lessonOptions = useMemo(
    () => getLessonOptions(lernsets.map((s) => ({ id: s.id, name: s.name }))),
    [lernsets]
  )

  const [y, m] = statMonth.split('-').map(Number)
  const daysInMonth = useMemo(() => getDaysInMonth(y, m - 1), [y, m])
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7 // Mo = 0
  const minutesByDay = useMemo(() => getMinutesByDayInMonth(statMonth), [statMonth])
  const minutesByLesson = useMemo(() => getMinutesByLesson(), [])
  const maxMinutes = Math.max(1, ...minutesByLesson.map((l) => l.minutes))
  const attempts = useMemo(
    () => (trefferLessonId ? getAttempts(trefferLessonId, trefferMode) : []),
    [trefferLessonId, trefferMode]
  )

  const prevMonth = () => {
    const [yy, mm] = statMonth.split('-').map(Number)
    const d = new Date(yy, mm - 2, 1)
    setStatMonth(formatYearMonth(d))
  }
  const nextMonth = () => {
    const [yy, mm] = statMonth.split('-').map(Number)
    const d = new Date(yy, mm, 1)
    setStatMonth(formatYearMonth(d))
  }
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className="statistik-page">
      <h1 className="page-title">Statistiken</h1>

      {/* 1. Kalender: an welchen Tagen gelernt */}
      <section className="statistik-section" aria-labelledby="stat-kalender-heading">
        <h2 id="stat-kalender-heading" className="statistik-heading">
          Lernaktivität im Monat
        </h2>
        <div className="statistik-kalender-wrap">
          <div className="statistik-kalender-nav">
            <button type="button" className="statistik-nav-btn" onClick={prevMonth} aria-label="Vorheriger Monat">
              ‹
            </button>
            <span className="statistik-kalender-month">{monthLabel}</span>
            <button type="button" className="statistik-nav-btn" onClick={nextMonth} aria-label="Nächster Monat">
              ›
            </button>
          </div>
          <div className="statistik-kalender-grid">
            {WOCHENTAG.map((w) => (
              <div key={w} className="statistik-kalender-wochentag">
                {w}
              </div>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <div key={`pad-${i}`} className="statistik-kalender-tag statistik-kalender-tag--leer" />
            ))}
            {daysInMonth.map((d) => {
              const key = formatDayKey(d)
              const min = minutesByDay[key] ?? 0
              const hasActivity = min > 0
              const isToday =
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear()
              return (
                <div
                  key={key}
                  className={`statistik-kalender-tag ${hasActivity ? 'statistik-kalender-tag--aktiv' : ''} ${isToday ? 'statistik-kalender-tag--heute' : ''}`}
                  title={hasActivity ? `${min} Min. gelernt` : 'Keine Aktivität'}
                >
                  <span className="statistik-kalender-tag-num">{d.getDate()}</span>
                  {hasActivity && <span className="statistik-kalender-tag-min">{Math.round(min)}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2. Balkendiagramm: Lektionen nach Lernminuten */}
      <section className="statistik-section" aria-labelledby="stat-lektionen-heading">
        <h2 id="stat-lektionen-heading" className="statistik-heading">
          Lernminuten pro Lektion
        </h2>
        <div className="statistik-balken-wrap">
          {minutesByLesson.length === 0 ? (
            <p className="statistik-leer">Noch keine Lernaktivität.</p>
          ) : (
            <div className="statistik-balken-list">
              {minutesByLesson.map((l) => (
                <div key={l.lessonId} className="statistik-balken-row">
                  <span className="statistik-balken-label" title={l.lessonName}>
                    {l.lessonName}
                  </span>
                  <div className="statistik-balken-track">
                    <div
                      className="statistik-balken-fill"
                      style={{ width: `${(l.minutes / maxMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="statistik-balken-wert">{Math.round(l.minutes)} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Trefferquote: Lektion + Modus wählen, Balken = Versuch → Prozent */}
      <section className="statistik-section" aria-labelledby="stat-treffer-heading">
        <h2 id="stat-treffer-heading" className="statistik-heading">
          Trefferquote im Verlauf
        </h2>
        <p className="statistik-hinweis">
          Wähle ein Lernset bzw. eine Lektion und einen Lernmodus. Das Diagramm zeigt, wie sich deine Trefferquote bei
          jedem Durchlauf entwickelt hat.
        </p>
        <div className="statistik-treffer-auswahl">
          <div className="statistik-select-wrap">
            <label htmlFor="stat-lesson">Lektion / Lernset</label>
            <select
              id="stat-lesson"
              value={trefferLessonId}
              onChange={(e) => setTrefferLessonId(e.target.value)}
              className="statistik-select"
            >
              <option value="">Bitte wählen …</option>
              {lessonOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="statistik-select-wrap">
            <label htmlFor="stat-mode">Lernmodus</label>
            <select
              id="stat-mode"
              value={trefferMode}
              onChange={(e) => setTrefferMode(e.target.value as StatistikMode)}
              className="statistik-select"
            >
              {MODI.map((modus) => (
                <option key={modus.id} value={modus.id}>
                  {modus.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="statistik-balken-wrap statistik-treffer-diagramm">
          {!trefferLessonId ? (
            <p className="statistik-leer">Bitte wähle eine Lektion und einen Modus.</p>
          ) : attempts.length === 0 ? (
            <p className="statistik-leer">Noch keine Durchläufe mit Trefferquote für diese Auswahl.</p>
          ) : (
            <div className="statistik-balken-list statistik-treffer-balken">
              {attempts.map((a) => (
                <div key={a.attempt} className="statistik-balken-row">
                  <span className="statistik-balken-label">{a.attempt}. Durchlauf</span>
                  <div className="statistik-balken-track">
                    <div
                      className="statistik-balken-fill statistik-balken-fill--prozent"
                      style={{ width: `${a.percent}%` }}
                    />
                  </div>
                  <span className="statistik-balken-wert">{a.percent} %</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
