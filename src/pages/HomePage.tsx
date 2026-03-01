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
        step: 'chooseMode',
      })
    }
    navigate('/lernen')
  }

  return (
    <div className="home">
      {!isOnboardingDone() && <OnboardingModal />}

      <header className="home-hero">
        <h1 className="home-hero-title">Latinum</h1>
        <p className="home-hero-tagline">Latein lernen</p>
        <button
          type="button"
          className="home-hero-cta"
          onClick={handleJetztLernen}
        >
          Jetzt lernen
        </button>
      </header>

      <section className="home-stats" aria-label="Überblick">
        <div className={`home-stats-card home-stats-card--tagesziel ${goalReached ? 'home-stats-card--done' : ''}`}>
          <span className="home-stats-value">{todayCount}/{dailyGoal}</span>
          <span className="home-stats-label">{goalReached ? 'Tagesziel erreicht' : 'Lektionen heute'}</span>
        </div>
        <div className="home-stats-card home-stats-card--streak">
          <FlameIcon className="home-stats-streak-icon" aria-hidden />
          <span className="home-stats-value">{streak}</span>
          <span className="home-stats-label">{streak === 1 ? 'Tag' : 'Tage'} in Folge</span>
        </div>
        <div className="home-stats-card home-stats-card--share">
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

      <section className="home-achievements" aria-labelledby="home-achievements-heading">
        <h2 id="home-achievements-heading" className="home-section-title">Erfolge</h2>
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
        <p className="home-achievements-summary">{unlockedCount} von {achievements.length} freigeschaltet</p>
      </section>

      <LearnQuestionBlock />

      <div className="home-quick-grid">
        <section className="home-quick-section" aria-labelledby="home-favoriten-heading">
          <h2 id="home-favoriten-heading" className="home-section-title">Deine Favoriten</h2>
          {favoritenItems.length === 0 ? (
            <p className="home-quick-empty">
              Noch keine Favoriten. Unter <strong>Lernen</strong> oder <strong>Neu</strong> einem Set einen Stern geben – dann erscheint es hier.
            </p>
          ) : (
            <ul className="home-quick-list">
              {favoritenItems.map((item) => (
                <li key={item.id} className="home-quick-item">
                  <div className="home-quick-item-info">
                    <span className="home-quick-item-title">{item.name}</span>
                    <span className="home-quick-item-meta">
                      {item.kind === 'lernset'
                        ? `${lernsets.find((s) => s.id === item.id)?.items.length ?? 0} Vokabeln`
                        : 'Deklination'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="home-quick-btn"
                    onClick={() => handleLernen(item)}
                  >
                    Lernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home-quick-section" aria-labelledby="home-zuletzt-heading">
          <h2 id="home-zuletzt-heading" className="home-section-title">Zuletzt genutzt</h2>
          {lastUsedLernsets.length === 0 ? (
            <p className="home-quick-empty">
              Noch keine Lernsets genutzt. Starte unter <strong>Lernen</strong> – die zuletzt genutzten erscheinen hier.
            </p>
          ) : (
            <ul className="home-quick-list">
              {lastUsedLernsets.map((set) => (
                <li key={set.id} className="home-quick-item">
                  <div className="home-quick-item-info">
                    <span className="home-quick-item-title">{set.name}</span>
                    <span className="home-quick-item-meta">
                      {set.items.length} {set.items.length === 1 ? 'Vokabel' : 'Vokabeln'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="home-quick-btn"
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
