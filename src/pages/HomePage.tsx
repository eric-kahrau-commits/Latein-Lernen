import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { LearnQuestionBlock } from '../components/LearnQuestionBlock'
import { OnboardingModal } from '../components/OnboardingModal'
import { GitHubIcon, ShareIcon, FlameIcon } from '../components/icons'
import { getLernsets } from '../data/lernsets'
import { getFavoritenIds } from '../data/favoriten'
import { getLastUsedLernsetIds, DEKLINATION_LESSON_OPTIONS } from '../data/statistik'
import { saveLernenState } from '../data/pageState'
import {
  getTodaySessionCount,
  getDailyGoal,
  isDailyGoalReached,
} from '../data/tagesziel'
import { getStreak } from '../data/streak'
import { getAchievements } from '../data/achievements'
import { share, getShareStreakText } from '../data/share'
import { isOnboardingDone } from '../data/onboarding'
import { getFortschrittÜberblick, getEmpfohleneLektion, getFortschrittProLektion, getGesamtFortschrittXVonY, type FortschrittProLektionEntry } from '../data/fortschritt'
import './HomePage.css'

const GITHUB_URL = 'https://github.com/eric-kahrau-commits?tab=repositories'

function triggerConfetti() {
  const duration = 1200
  const end = Date.now() + duration
  const colors = ['#4f6bed', '#6b7cf6', '#5c6bc0', '#7986cb']
  const run = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0.5, y: 0.6 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 0.5, y: 0.6 },
      colors,
    })
    if (Date.now() < end) setTimeout(run, 100)
  }
  run()
}

export function HomePage() {
  const navigate = useNavigate()
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'ok' | 'fail'>('idle')
  const lernsets = getLernsets()
  const lernsetIds = new Set(lernsets.map((s) => s.id))
  const favoritenIds = getFavoritenIds()
  const favoritenItems: { id: string; name: string; kind: 'lernset' | 'deklination' }[] = []
  favoritenIds.forEach((id) => {
    const dekl = DEKLINATION_LESSON_OPTIONS.find((o) => o.id === id)
    if (dekl) {
      favoritenItems.push({ id: dekl.id, name: dekl.name, kind: 'deklination' })
    } else {
      const set = lernsets.find((s) => s.id === id)
      if (set) favoritenItems.push({ id: set.id, name: set.name, kind: 'lernset' })
    }
  })
  const lastUsedIds = getLastUsedLernsetIds(lernsetIds)
  const lastUsedLernsets = lastUsedIds
    .map((id) => lernsets.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null)

  const todayCount = getTodaySessionCount()
  const dailyGoal = getDailyGoal()
  const goalReached = isDailyGoalReached()
  const streak = getStreak()
  const achievements = getAchievements()
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length
  const fortschritt = getFortschrittÜberblick()
  const empfohleneLektion = getEmpfohleneLektion()
  const fortschrittProLektion = getFortschrittProLektion(5)
  const xVonY = getGesamtFortschrittXVonY()

  const handleShareStreak = async () => {
    setShareFeedback('idle')
    const ok = await share(getShareStreakText(streak))
    setShareFeedback(ok ? 'ok' : 'fail')
    if (ok) setTimeout(() => setShareFeedback('idle'), 2000)
  }

  const handleJetztLernen = () => {
    triggerConfetti()
    navigate('/lernen')
  }

  const handleLernen = (item: { id: string; kind: 'lernset' | 'deklination' }) => {
    if (item.kind === 'lernset') {
      saveLernenState({
        view: 'vokabeln',
        breadcrumb: ['Vokabeln'],
        selectedTyp: null,
        selectedLernsetId: item.id,
        selectedGrammatikTopicId: null,
        selectedSachkundeTopicId: null,
        step: 'chooseMode',
      })
    } else {
      const view = item.id.startsWith('substantive-') ? 'substantive' : 'adjektive'
      const selectedTyp = item.id.slice(view.length + 1) as string
      const breadcrumb = view === 'substantive' ? ['Endungen', 'Substantive'] : ['Endungen', 'Adjektive']
      saveLernenState({
        view,
        breadcrumb,
        selectedTyp,
        selectedLernsetId: null,
        selectedGrammatikTopicId: null,
        selectedSachkundeTopicId: null,
        step: 'chooseMode',
      })
    }
    navigate('/lernen')
  }

  const handleLernenFromFortschritt = (entry: FortschrittProLektionEntry) => {
    const isLernset = lernsetIds.has(entry.lessonId)
    const isDeklination = DEKLINATION_LESSON_OPTIONS.some((o) => o.id === entry.lessonId) &&
      (entry.lessonId.startsWith('substantive-') || entry.lessonId.startsWith('adjektive-'))
    if (isLernset) handleLernen({ id: entry.lessonId, kind: 'lernset' })
    else if (isDeklination) handleLernen({ id: entry.lessonId, kind: 'deklination' })
    else navigate('/lernen')
  }

  return (
    <div className="home">
      {!isOnboardingDone() && <OnboardingModal />}

      <header className="home-hero">
        <h1 className="home-hero-title">Latinum</h1>
        <p className="home-hero-tagline">Latein lernen</p>
        <button
          type="button"
          className="btn btn-primary home-hero-cta"
          onClick={handleJetztLernen}
        >
          Jetzt lernen
        </button>
      </header>

      <section className="home-stats" aria-label="Überblick">
        <div className={`card home-stats-card home-stats-card--tagesziel ${goalReached ? 'home-stats-card--done' : ''}`}>
          <span className="home-stats-value">{todayCount}/{dailyGoal}</span>
          <span className="home-stats-label">{goalReached ? 'Tagesziel erreicht' : 'Lektionen heute'}</span>
          {goalReached && <span className="home-stats-tagesziel-sub">Streak gesichert</span>}
        </div>
        <div className="card home-stats-card home-stats-card--streak">
          <FlameIcon className="home-stats-streak-icon" aria-hidden />
          <span className="home-stats-value">{streak}</span>
          <span className="home-stats-label">{streak === 1 ? 'Tag' : 'Tage'} in Folge</span>
        </div>
        <div className="card home-stats-card home-stats-card--share">
          <button
            type="button"
            className="home-stats-share-btn"
            onClick={handleShareStreak}
            aria-label="Streak teilen"
          >
            <ShareIcon className="home-stats-share-icon" />
            <span>Teilen</span>
          </button>
          {shareFeedback === 'ok' && <span className="home-stats-share-ok">Kopiert!</span>}
        </div>
      </section>

      <section className="page-section home-fortschritt" aria-labelledby="home-fortschritt-heading">
        <h2 id="home-fortschritt-heading" className="page-section-title home-section-title">Dein Fortschritt</h2>
        <div className="card home-fortschritt-card">
          {xVonY.gesamt > 0 && (
            <div className="home-fortschritt-row">
              <span className="home-fortschritt-value">{xVonY.absolviert} / {xVonY.gesamt}</span>
              <span className="home-fortschritt-label caption" title="Lektionen mind. einmal absolviert">Absolviert</span>
            </div>
          )}
          <div className="home-fortschritt-row">
            <span className="home-fortschritt-value">{fortschritt.gesamteLektionen}</span>
            <span className="home-fortschritt-label caption">Lektionen absolviert</span>
          </div>
          {fortschritt.durchschnittProzent != null && (
            <div className="home-fortschritt-row">
              <span className="home-fortschritt-value">{fortschritt.durchschnittProzent} %</span>
              <span className="home-fortschritt-label caption">Durchschnitt</span>
            </div>
          )}
          {fortschritt.vokabelnFälligHeute > 0 && (
            <div className="home-fortschritt-row">
              <span className="home-fortschritt-value">{fortschritt.vokabelnFälligHeute}</span>
              <span className="home-fortschritt-label caption">Vokabeln heute fällig</span>
            </div>
          )}
          {fortschritt.gesamteLektionen === 0 && fortschritt.durchschnittProzent == null && fortschritt.vokabelnFälligHeute === 0 && (
            <p className="home-fortschritt-empty caption">Noch keine Lektionen. Starte mit „Jetzt lernen“.</p>
          )}
        </div>
        {fortschrittProLektion.length > 0 && (
          <div className="home-fortschritt-lektionen">
            <span className="home-fortschritt-lektionen-title caption">Nach Lektion</span>
            <ul className="home-fortschritt-lektionen-list" aria-label="Fortschritt nach Lektion">
              {fortschrittProLektion.map((entry) => (
                <li key={entry.lessonId} className="list-row home-fortschritt-lektionen-item">
                  <div className="list-row-info home-fortschritt-lektionen-info">
                    <span className="list-row-title home-fortschritt-lektionen-name">{entry.lessonName}</span>
                    <span className="list-row-meta home-fortschritt-lektionen-meta">{entry.avgPercent} % sicher · {entry.attemptCount} Durchläufe</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary home-quick-btn home-fortschritt-lektionen-btn"
                    onClick={() => handleLernenFromFortschritt(entry)}
                  >
                    Lernen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="page-section home-achievements" aria-labelledby="home-achievements-heading">
        <h2 id="home-achievements-heading" className="page-section-title home-section-title">Erfolge</h2>
        <div className="home-achievements-row">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`home-achievement ${a.unlockedAt ? 'home-achievement--unlocked' : ''}`}
              title={a.title}
            >
              <span className="home-achievement-icon" aria-hidden>{a.icon}</span>
              <span className="home-achievement-name">{a.title}</span>
            </div>
          ))}
        </div>
        <p className="home-achievements-summary caption">{unlockedCount} von {achievements.length} freigeschaltet</p>
      </section>

      <LearnQuestionBlock />

      {empfohleneLektion && (
        <section className="page-section home-empfohlen" aria-labelledby="home-empfohlen-heading">
          <h2 id="home-empfohlen-heading" className="page-section-title home-section-title">Tipp des Tages</h2>
          <div className="card home-empfohlen-card">
            <div className="list-row-info home-empfohlen-info">
              <span className="home-empfohlen-title">{empfohleneLektion.name}</span>
              <span className="home-empfohlen-meta">
                {empfohleneLektion.reason === 'fällig' && empfohleneLektion.dueCount != null
                  ? `${empfohleneLektion.dueCount} Vokabeln fällig`
                  : empfohleneLektion.reason === 'zuletzt'
                    ? 'Zuletzt genutzt'
                    : 'Gut zum Einstieg'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary home-quick-btn home-empfohlen-btn"
              onClick={() => handleLernen({ id: empfohleneLektion.id, kind: 'lernset' })}
            >
              Lernen
            </button>
          </div>
        </section>
      )}

      <div className="home-quick-grid">
        <section className="page-section home-quick-section" aria-labelledby="home-favoriten-heading">
          <h2 id="home-favoriten-heading" className="page-section-title home-section-title">Deine Favoriten</h2>
          {favoritenItems.length === 0 ? (
            <p className="home-quick-empty">
              Noch keine Favoriten. Unter <strong>Lernen</strong> oder <strong>Neu</strong> einem Set einen Stern geben – dann erscheint es hier.
            </p>
          ) : (
            <ul className="home-quick-list">
              {favoritenItems.map((item) => (
                <li key={item.id} className="list-row home-quick-item">
                  <div className="list-row-info home-quick-item-info">
                    <span className="list-row-title home-quick-item-title">{item.name}</span>
                    <span className="list-row-meta home-quick-item-meta">
                      {item.kind === 'lernset'
                        ? `${lernsets.find((s) => s.id === item.id)?.items.length ?? 0} Vokabeln`
                        : 'Deklination'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary home-quick-btn"
                    onClick={() => handleLernen(item)}
                  >
                    Lernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-section home-quick-section" aria-labelledby="home-zuletzt-heading">
          <h2 id="home-zuletzt-heading" className="page-section-title home-section-title">Zuletzt genutzt</h2>
          {lastUsedLernsets.length === 0 ? (
            <p className="home-quick-empty">
              Noch keine Lernsets genutzt. Starte unter <strong>Lernen</strong> – die zuletzt genutzten erscheinen hier.
            </p>
          ) : (
            <ul className="home-quick-list">
              {lastUsedLernsets.map((set) => (
                <li key={set.id} className="list-row home-quick-item">
                  <div className="list-row-info home-quick-item-info">
                    <span className="list-row-title home-quick-item-title">{set.name}</span>
                    <span className="list-row-meta home-quick-item-meta">
                      {set.items.length} {set.items.length === 1 ? 'Vokabel' : 'Vokabeln'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary home-quick-btn"
                    onClick={() => handleLernen({ id: set.id, kind: 'lernset' })}
                  >
                    Lernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="home-footer" aria-label="Impressum und Rechtliches">
        <span className="home-footer-name">Eric Kahrau</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="home-footer-link"
          aria-label="GitHub (öffnet in neuem Tab)"
        >
          <GitHubIcon className="home-footer-icon" />
        </a>
        <span className="home-footer-sep">·</span>
        <Link to="/impressum" className="home-footer-link">Impressum</Link>
        <span className="home-footer-sep">·</span>
        <Link to="/datenschutz" className="home-footer-link">Datenschutz</Link>
      </footer>
    </div>
  )
}
