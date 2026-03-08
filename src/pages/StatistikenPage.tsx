import { useState, useMemo, useEffect } from 'react'
import {
  getMinutesByDayInMonth,
  getMinutesByLesson,
  getMinutesByWeekday,
  getSessionCountByLesson,
  getActivityLast30Days,
  getAveragePercentByLesson,
  getBestVsFirstPercentByLesson,
  getAttemptCountByMode,
  getMinutesByWeek,
} from '../data/statistik'
import { loadStatistikUI, saveStatistikUI } from '../data/pageState'
import './StatistikenPage.css'

function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): Date[] {
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

const CHART_COLORS = [
  'var(--stat-chart-1, #6366f1)',
  'var(--stat-chart-2, #8b5cf6)',
  'var(--stat-chart-3, #06b6d4)',
  'var(--stat-chart-4, #10b981)',
  'var(--stat-chart-5, #f59e0b)',
]

const initialStat = loadStatistikUI()

export function StatistikenPage() {
  const [statMonth, setStatMonth] = useState(initialStat.statMonth)

  const [y, m] = statMonth.split('-').map(Number)
  const daysInMonth = useMemo(() => getDaysInMonth(y, m - 1), [y, m])
  const minutesByDay = useMemo(() => getMinutesByDayInMonth(statMonth), [statMonth])
  const minutesByLesson = useMemo(() => getMinutesByLesson(), [])
  const sessionCountByLesson = useMemo(() => getSessionCountByLesson(), [])
  const activity30 = useMemo(() => getActivityLast30Days(), [])
  const avgPercentByLesson = useMemo(() => getAveragePercentByLesson(), [])
  const bestVsFirst = useMemo(() => getBestVsFirstPercentByLesson(), [])
  const attemptCountByMode = useMemo(() => getAttemptCountByMode(), [])
  const minutesByWeek = useMemo(() => getMinutesByWeek(8), [])
  const minutesByWeekday = useMemo(() => getMinutesByWeekday(), [])

  const maxMinutesLesson = Math.max(1, ...minutesByLesson.map((l) => l.minutes))
  const maxMinutesDay = Math.max(1, ...Object.values(minutesByDay))
  const maxSessionCount = Math.max(1, ...sessionCountByLesson.map((l) => l.count))
  const maxAttemptMode = Math.max(1, ...attemptCountByMode.map((x) => x.count))
  const maxMinutesWeek = Math.max(1, ...minutesByWeek.map((w) => w.minutes))
  const maxMinutesWeekday = Math.max(1, ...minutesByWeekday.map((w) => w.minutes))

  const prevMonth = () => {
    const [yy, mm] = statMonth.split('-').map(Number)
    setStatMonth(formatYearMonth(new Date(yy, mm - 2, 1)))
  }
  const nextMonth = () => {
    const [yy, mm] = statMonth.split('-').map(Number)
    setStatMonth(formatYearMonth(new Date(yy, mm, 1)))
  }

  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  useEffect(() => {
    saveStatistikUI({ statMonth, trefferLessonId: '', trefferMode: 'lernen' })
  }, [statMonth])

  return (
    <div className="stat-page">
      <header className="stat-header">
        <h1 className="page-title stat-title">Statistiken</h1>
        <p className="stat-intro">
          Hier siehst du deine Lernaktivität auf einen Blick. Jedes Diagramm zeigt einen anderen Ausschnitt – nutze die
          Hinweise, um mehr daraus zu machen.
        </p>
      </header>

      {/* 1. Lernminuten pro Lektion */}
      <section className="card stat-card" aria-labelledby="stat-1-heading">
        <h2 id="stat-1-heading" className="stat-card-title">
          Lernminuten pro Lektion
        </h2>
        <p className="stat-card-hint">
          Wo deine Zeit hingeht: Lektionen mit den meisten Minuten. So erkennst du deine Schwerpunkte und ob die
          Verteilung zu deinen Zielen passt.
        </p>
        <div className="stat-chart stat-chart--horizontal">
          {minutesByLesson.length === 0 ? (
            <p className="stat-empty">Noch keine Lernaktivität.</p>
          ) : (
            <div className="stat-bars stat-bars--horizontal">
              {minutesByLesson.slice(0, 10).map((l, i) => (
                <div key={l.lessonId} className="stat-bar-row">
                  <span className="stat-bar-label" title={l.lessonName}>
                    {l.lessonName.length > 28 ? l.lessonName.slice(0, 26) + '…' : l.lessonName}
                  </span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${(l.minutes / maxMinutesLesson) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="stat-bar-value">{Math.round(l.minutes)} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="stat-conclusion">
          {minutesByLesson.length === 0
            ? 'Noch keine Lernaktivität – starte mit einer Lektion.'
            : `Du hast insgesamt ${Math.round(minutesByLesson.reduce((s, l) => s + l.minutes, 0))} Minuten in ${minutesByLesson.length} Lektion${minutesByLesson.length === 1 ? '' : 'en'} gelernt${minutesByLesson.length > 0 ? `, dein Fokus liegt bei „${minutesByLesson[0].lessonName.length > 25 ? minutesByLesson[0].lessonName.slice(0, 24) + '…' : minutesByLesson[0].lessonName}“.` : '.'}`}
        </p>
      </section>

      {/* 2. Lernminuten pro Tag im Monat */}
      <section className="card stat-card" aria-labelledby="stat-2-heading">
        <h2 id="stat-2-heading" className="stat-card-title">
          Lernminuten pro Tag
        </h2>
        <p className="stat-card-hint">
          Dein Rhythmus im gewählten Monat: An welchen Tagen du aktiv warst. Regelmäßigkeit hilft beim Behalten.
        </p>
        <div className="stat-month-nav">
          <button type="button" className="stat-nav-btn" onClick={prevMonth} aria-label="Vorheriger Monat">
            ‹
          </button>
          <span className="stat-month-label">{monthLabel}</span>
          <button type="button" className="stat-nav-btn" onClick={nextMonth} aria-label="Nächster Monat">
            ›
          </button>
        </div>
        <div className="stat-chart stat-chart--vertical stat-chart--days">
          {daysInMonth.length === 0 ? null : (
            <div className={`stat-bars stat-bars--vertical ${daysInMonth.length > 10 ? 'stat-bars--scroll-mobile' : ''}`} style={{ '--bars': daysInMonth.length } as React.CSSProperties}>
              {daysInMonth.map((d) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const min = minutesByDay[key] ?? 0
                return (
                  <div key={key} className="stat-bar-col" title={`${d.getDate()}. ${monthLabel}: ${Math.round(min)} min`}>
                    <div
                      className="stat-bar-fill-vert"
                      style={{
                        height: `${(min / maxMinutesDay) * 100}%`,
                        backgroundColor: min > 0 ? CHART_COLORS[2] : 'var(--bg-elevated)',
                      }}
                    />
                    <span className="stat-bar-col-value">{min > 0 ? Math.round(min) : ''}</span>
                    <span className="stat-bar-col-label">{d.getDate()}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <p className="stat-conclusion">
          {(() => {
            const daysActive = Object.keys(minutesByDay).filter((k) => (minutesByDay[k] ?? 0) > 0).length
            const totalMin = Object.values(minutesByDay).reduce((a, b) => a + b, 0)
            if (totalMin === 0) return `Im ${monthLabel} warst du noch nicht aktiv.`
            return `Im ${monthLabel} warst du an ${daysActive} Tag${daysActive === 1 ? '' : 'en'} aktiv und hast insgesamt ${Math.round(totalMin)} Minuten gelernt.`
          })()}
        </p>
      </section>

      {/* 3. Durchschnittliche Trefferquote pro Lektion */}
      <section className="card stat-card" aria-labelledby="stat-3-heading">
        <h2 id="stat-3-heading" className="stat-card-title">
          Durchschnittliche Trefferquote pro Lektion
        </h2>
        <p className="stat-card-hint">
          Wo stehst du im Schnitt? Hohe Balken = Themen sitzen. Niedrige = hier lohnt sich noch Übung.
        </p>
        <div className="stat-chart stat-chart--horizontal">
          {avgPercentByLesson.length === 0 ? (
            <p className="stat-empty">Noch keine Trefferquoten erfasst.</p>
          ) : (
            <div className="stat-bars stat-bars--horizontal">
              {avgPercentByLesson.slice(0, 8).map((l, _i) => (
                <div key={l.lessonId} className="stat-bar-row">
                  <span className="stat-bar-label" title={l.lessonName}>
                    {l.lessonName.length > 24 ? l.lessonName.slice(0, 22) + '…' : l.lessonName}
                  </span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${l.avgPercent}%`,
                        backgroundColor: l.avgPercent >= 80 ? CHART_COLORS[3] : l.avgPercent >= 50 ? CHART_COLORS[2] : CHART_COLORS[4],
                      }}
                    />
                  </div>
                  <span className="stat-bar-value">{l.avgPercent} %</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="stat-conclusion">
          {avgPercentByLesson.length === 0
            ? 'Noch keine Trefferquoten – absolviere Lernen oder Test mit Auswertung.'
            : (() => {
                const avg = Math.round(avgPercentByLesson.reduce((s, l) => s + l.avgPercent, 0) / avgPercentByLesson.length)
                const best = avgPercentByLesson[0]
                return `Deine durchschnittliche Trefferquote liegt bei ${avg} % (über ${avgPercentByLesson.length} Lektion${avgPercentByLesson.length === 1 ? '' : 'en'}). Am besten abgeschnitten: „${best.lessonName.length > 30 ? best.lessonName.slice(0, 29) + '…' : best.lessonName}“ mit ${best.avgPercent} %.`
              })()}
        </p>
      </section>

      {/* 5. Lernminuten pro Wochentag */}
      <section className="card stat-card" aria-labelledby="stat-5-heading">
        <h2 id="stat-5-heading" className="stat-card-title">
          Lernminuten pro Wochentag
        </h2>
        <p className="stat-card-hint">
          An welchen Tagen lernst du am meisten? Ideal für feste Lernzeiten (z. B. immer Di/Do).
        </p>
        <div className="stat-chart stat-chart--vertical">
          <div className="stat-bars stat-bars--vertical stat-bars--7" style={{ '--bars': 7 } as React.CSSProperties}>
            {minutesByWeekday.map((w, i) => (
              <div key={w.weekday} className="stat-bar-col" title={`${w.weekdayName}: ${Math.round(w.minutes)} min`}>
                <div
                  className="stat-bar-fill-vert"
                  style={{
                    height: `${(w.minutes / maxMinutesWeekday) * 100}%`,
                    backgroundColor: w.minutes > 0 ? CHART_COLORS[i % CHART_COLORS.length] : 'var(--bg-elevated)',
                  }}
                />
                <span className="stat-bar-col-value">{w.minutes > 0 ? Math.round(w.minutes) : ''}</span>
                <span className="stat-bar-col-label">{w.weekdayName}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="stat-conclusion">
          {maxMinutesWeekday === 0 || minutesByWeekday.every((w) => w.minutes === 0)
            ? 'Noch keine Aktivität nach Wochentag – lerne ein paar Tage und schau wieder vorbei.'
            : (() => {
                const top = minutesByWeekday.reduce((best, w) => (w.minutes > (best?.minutes ?? 0) ? w : best), minutesByWeekday[0])
                return `Am meisten lernst du ${top.weekdayName} (${Math.round(top.minutes)} Minuten).`
              })()}
        </p>
      </section>

      {/* 6. Anzahl Sessions pro Lektion */}
      <section className="card stat-card" aria-labelledby="stat-6-heading">
        <h2 id="stat-6-heading" className="stat-card-title">
          Anzahl Übungsdurchläufe pro Lektion
        </h2>
        <p className="stat-card-hint">
          Wie oft hast du jede Lektion geübt? Mehr Wiederholungen helfen beim Einprägen – aber Abwechslung ist auch gut.
        </p>
        <div className="stat-chart stat-chart--horizontal">
          {sessionCountByLesson.length === 0 ? (
            <p className="stat-empty">Noch keine Sessions.</p>
          ) : (
            <div className="stat-bars stat-bars--horizontal">
              {sessionCountByLesson.slice(0, 10).map((l, i) => (
                <div key={l.lessonId} className="stat-bar-row">
                  <span className="stat-bar-label" title={l.lessonName}>
                    {l.lessonName.length > 28 ? l.lessonName.slice(0, 26) + '…' : l.lessonName}
                  </span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${(l.count / maxSessionCount) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="stat-bar-value">{l.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="stat-conclusion">
          {sessionCountByLesson.length === 0
            ? 'Noch keine Übungsdurchläufe – starte eine Lektion und schließe sie ab.'
            : `Du hast insgesamt ${sessionCountByLesson.reduce((s, l) => s + l.count, 0)} Durchläufe in ${sessionCountByLesson.length} Lektion${sessionCountByLesson.length === 1 ? '' : 'en'} absolviert.`}
        </p>
      </section>

      {/* 7. Aktivität letzte 30 Tage */}
      <section className="card stat-card" aria-labelledby="stat-7-heading">
        <h2 id="stat-7-heading" className="stat-card-title">
          Aktivität der letzten 30 Tage
        </h2>
        <p className="stat-card-hint">
          Jeder Block = ein Tag. Volle Höhe = du hast gelernt. So siehst du deine Regelmäßigkeit und Lücken auf einen Blick.
        </p>
        <div className="stat-chart stat-chart--streak">
          <div className="stat-streak-grid">
            {activity30.map((day) => (
              <div
                key={day.date}
                className={`stat-streak-cell ${day.hasActivity ? 'stat-streak-cell--active' : ''}`}
                title={`${day.date}: ${Math.round(day.minutes)} min`}
                style={
                  day.hasActivity
                    ? { opacity: Math.min(1, 0.4 + (day.minutes / 60) * 0.6) }
                    : undefined
                }
              />
            ))}
          </div>
          <div className="stat-streak-legend">
            <span>vor 30 Tagen</span>
            <span>heute</span>
          </div>
        </div>
        <p className="stat-conclusion">
          {activity30.filter((d) => d.hasActivity).length === 0
            ? 'In den letzten 30 Tagen warst du noch nicht aktiv – heute ist ein guter Tag zum Starten.'
            : `In den letzten 30 Tagen warst du an ${activity30.filter((d) => d.hasActivity).length} Tag${activity30.filter((d) => d.hasActivity).length === 1 ? '' : 'en'} aktiv.`}
        </p>
      </section>

      {/* 8. Erste vs. beste Trefferquote */}
      <section className="card stat-card" aria-labelledby="stat-8-heading">
        <h2 id="stat-8-heading" className="stat-card-title">
          Erste vs. beste Trefferquote pro Lektion
        </h2>
        <p className="stat-card-hint">
          Vergleich: dein erster Durchlauf vs. deine beste Leistung. Großer Abstand = du hast dich stark verbessert.
        </p>
        <div className="stat-chart stat-chart--horizontal">
          {bestVsFirst.length === 0 ? (
            <p className="stat-empty">Noch keine Vergleichsdaten (mind. 1 Durchlauf pro Lektion nötig).</p>
          ) : (
            <div className="stat-bars stat-bars--grouped">
              {bestVsFirst.slice(0, 6).map((l, _i) => (
                <div key={l.lessonId} className="stat-grouped-row">
                  <span className="stat-bar-label" title={l.lessonName}>
                    {l.lessonName.length > 22 ? l.lessonName.slice(0, 20) + '…' : l.lessonName}
                  </span>
                  <div className="stat-grouped-bars">
                    <div className="stat-grouped-bar-wrap">
                      <span className="stat-grouped-legend">Erster</span>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill"
                          style={{ width: `${l.firstPercent}%`, backgroundColor: 'var(--text-secondary)' }}
                        />
                      </div>
                      <span className="stat-bar-value">{l.firstPercent}%</span>
                    </div>
                    <div className="stat-grouped-bar-wrap">
                      <span className="stat-grouped-legend">Beste</span>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill"
                          style={{ width: `${l.bestPercent}%`, backgroundColor: CHART_COLORS[3] }}
                        />
                      </div>
                      <span className="stat-bar-value">{l.bestPercent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="stat-conclusion">
          {bestVsFirst.length === 0
            ? 'Noch keine Vergleichsdaten – mindestens ein Durchlauf pro Lektion nötig.'
            : (() => {
                const mostImproved = bestVsFirst.reduce((best, l) =>
                  l.bestPercent - l.firstPercent > best.bestPercent - best.firstPercent ? l : best
                )
                return `Du hast dich am stärksten bei „${mostImproved.lessonName.length > 28 ? mostImproved.lessonName.slice(0, 27) + '…' : mostImproved.lessonName}“ verbessert (von ${mostImproved.firstPercent} % auf ${mostImproved.bestPercent} %).`
              })()}
        </p>
      </section>

      {/* 9. Nutzung der Lernmodi */}
      <section className="card stat-card" aria-labelledby="stat-9-heading">
        <h2 id="stat-9-heading" className="stat-card-title">
          Genutzte Lernmodi
        </h2>
        <p className="stat-card-hint">
          Welche Modi du am häufigsten nutzt. Abwechslung (Karteikarten, Lernen, Test) festigt den Stoff besser.
        </p>
        <div className="stat-chart stat-chart--vertical">
          <div className="stat-bars stat-bars--vertical stat-bars--4" style={{ '--bars': 4 } as React.CSSProperties}>
            {attemptCountByMode.map((x, i) => (
              <div key={x.mode} className="stat-bar-col" title={`${x.modeLabel}: ${x.count} Durchläufe`}>
                <div
                  className="stat-bar-fill-vert"
                  style={{
                    height: `${(x.count / maxAttemptMode) * 100}%`,
                    backgroundColor: x.count > 0 ? CHART_COLORS[i % CHART_COLORS.length] : 'var(--bg-elevated)',
                  }}
                />
                <span className="stat-bar-col-value">{x.count}</span>
                <span className="stat-bar-col-label">{x.modeLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="stat-conclusion">
          {attemptCountByMode.every((x) => x.count === 0)
            ? 'Noch keine Lernmodi genutzt – probiere Karteikarten, Lernen oder Test aus.'
            : (() => {
                const top = attemptCountByMode.reduce((best, x) => (x.count > best.count ? x : best), attemptCountByMode[0])
                const total = attemptCountByMode.reduce((s, x) => s + x.count, 0)
                return `Am häufigsten nutzt du „${top.modeLabel}“ (${top.count} von ${total} Durchläufen).`
              })()}
        </p>
      </section>

      {/* 10. Lernminuten pro Woche (Trend) */}
      <section className="card stat-card" aria-labelledby="stat-10-heading">
        <h2 id="stat-10-heading" className="stat-card-title">
          Lernminuten pro Woche (Trend)
        </h2>
        <p className="stat-card-hint">
          Dein wöchentlicher Lernumfang der letzten 8 Wochen. So erkennst du, ob du dranbleibst oder nachlegen solltest.
        </p>
        <div className="stat-chart stat-chart--vertical">
          <div className="stat-bars stat-bars--vertical stat-bars--weeks" style={{ '--bars': 8 } as React.CSSProperties}>
            {minutesByWeek.map((w, _i) => (
              <div key={w.yearWeek} className="stat-bar-col" title={`${w.weekLabel}: ${Math.round(w.minutes)} min`}>
                <div
                  className="stat-bar-fill-vert"
                  style={{
                    height: `${(w.minutes / maxMinutesWeek) * 100}%`,
                    backgroundColor: w.minutes > 0 ? CHART_COLORS[1] : 'var(--bg-elevated)',
                  }}
                />
                <span className="stat-bar-col-value">{w.minutes > 0 ? Math.round(w.minutes) : ''}</span>
                <span className="stat-bar-col-label stat-bar-col-label--week">{w.weekLabel.split(' – ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="stat-conclusion">
          {minutesByWeek.every((w) => w.minutes === 0)
            ? 'In den letzten 8 Wochen warst du noch nicht aktiv – dein wöchentlicher Trend erscheint hier.'
            : (() => {
                const total = minutesByWeek.reduce((s, w) => s + w.minutes, 0)
                const avg = total / 8
                return `In den letzten 8 Wochen hast du durchschnittlich ${Math.round(avg)} Minuten pro Woche gelernt (gesamt ${Math.round(total)} Minuten).`
              })()}
        </p>
      </section>
    </div>
  )
}
