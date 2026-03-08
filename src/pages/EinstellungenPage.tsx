import { useState, useEffect } from 'react'
import { useProfile } from '../context/ProfileContext'
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  PlayIcon,
  CheckIcon,
} from '../components/icons'
import {
  getSettings,
  setTheme,
  setFontSize,
  setSelectedVoiceName,
  setSpeakResponses,
  type ThemeValue,
} from '../data/settings'
import { getAvailableVoices, playVoiceSample } from '../data/voice'
import { clearStatistik } from '../data/statistik'
import { isOwned } from '../data/shop'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showReminderNotification,
} from '../data/notifications'
import { getFeedbackMailtoUrl } from '../data/feedback'
import './EinstellungenPage.css'

const APP_VERSION = '1.0.0'

const THEME_OPTIONS: { value: ThemeValue; label: string; Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Hell', Icon: SunIcon },
  { value: 'dark', label: 'Dunkel', Icon: MoonIcon },
  { value: 'sonnenuntergang', label: 'Sonnenuntergang' },
  { value: 'wald', label: 'Wald' },
]

export function EinstellungenPage() {
  const { userName, setUserName } = useProfile()
  const [editName, setEditName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState(getSettings)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [playingVoiceName, setPlayingVoiceName] = useState<string | null>(null)

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  useEffect(() => {
    const load = () => setVoices(getAvailableVoices())
    load()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = load
      return () => { window.speechSynthesis.onvoiceschanged = null }
    }
  }, [])

  const selectedVoiceName = settings.selectedVoiceName ?? null

  const startEdit = () => {
    setEditName(userName)
    setIsEditing(true)
  }

  const saveName = () => {
    const trimmed = editName.trim()
    if (trimmed) {
      setUserName(trimmed)
      setIsEditing(false)
    }
  }

  const cancelEdit = () => {
    setEditName('')
    setIsEditing(false)
  }

  const handleTheme = (theme: ThemeValue) => {
    setTheme(theme)
    setSettings(getSettings())
  }

  const handleFontSizeToggle = () => {
    const next = settings.fontSize === 'normal' ? 'large' : 'normal'
    setFontSize(next)
    setSettings(getSettings())
  }

  const handleSpeakResponsesToggle = () => {
    setSpeakResponses(!settings.speakResponses)
    setSettings(getSettings())
  }

  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    setSelectedVoiceName(voice.name)
    setSettings(getSettings())
  }

  const handlePlayVoice = (voice: SpeechSynthesisVoice) => {
    setPlayingVoiceName(voice.name)
    playVoiceSample(voice)
    const stop = () => setPlayingVoiceName(null)
    setTimeout(stop, 3000)
  }

  const handleResetStatistik = () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      return
    }
    clearStatistik()
    setResetConfirm(false)
  }

  const handleRequestNotifications = async () => {
    await requestNotificationPermission()
    setNotifPermission(getNotificationPermission())
  }

  const handleTestNotification = () => {
    showReminderNotification(
      'Latein Lernen',
      'Dein Streak wartet – mach heute noch eine Lektion! 🔥'
    )
  }

  const themeOptionsFiltered = THEME_OPTIONS.filter((o) => {
    if (o.value === 'sonnenuntergang') return isOwned('theme-sonnenuntergang')
    if (o.value === 'wald') return isOwned('theme-wald')
    return true
  })

  return (
    <div className="settings-page">
      <h1 className="page-title settings-title">Einstellungen</h1>

      {/* Profil */}
      <section className="settings-group" aria-labelledby="settings-profil">
        <h2 id="settings-profil" className="section-title settings-group-title">Profil</h2>
        <div className={`card settings-card ${isOwned('champion-rahmen') ? 'settings-card--champion' : ''}`}>
          {!isEditing ? (
            <div className="settings-row settings-row--profil">
              <div className="settings-row-main">
                <span className="settings-row-label">Name</span>
                <span className="settings-row-value">{userName || '—'}</span>
              </div>
              <button type="button" className="settings-btn-text" onClick={startEdit}>
                Ändern
              </button>
            </div>
          ) : (
            <div className="settings-edit-name">
              <label htmlFor="settings-name-input" className="settings-label">Dein Name</label>
              <input
                id="settings-name-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Dein Name"
                className="settings-input"
                maxLength={50}
                autoFocus
              />
              <div className="settings-edit-actions">
                <button type="button" className="btn btn-secondary settings-btn-secondary" onClick={cancelEdit}>Abbrechen</button>
                <button type="button" className="btn btn-primary settings-btn-primary" onClick={saveName} disabled={!editName.trim()}>
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Darstellung */}
      <section className="settings-group" aria-labelledby="settings-darstellung">
        <h2 id="settings-darstellung" className="section-title settings-group-title">Darstellung</h2>
        <div className="card settings-card">
          <div className="settings-row settings-row--with-options">
            <span className="settings-row-label">Design</span>
            <div className="settings-options-inline" role="radiogroup" aria-label="Design">
              {themeOptionsFiltered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === opt.value}
                  className={`settings-option-btn ${settings.theme === opt.value ? 'settings-option-btn--on' : ''}`}
                  onClick={() => handleTheme(opt.value)}
                >
                  {opt.Icon && <opt.Icon className="settings-option-icon" aria-hidden />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row settings-row--switch">
            <span className="settings-row-label">Größere Schrift</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.fontSize === 'large'}
              className={`settings-switch ${settings.fontSize === 'large' ? 'settings-switch--on' : ''}`}
              onClick={handleFontSizeToggle}
            >
              <span className="settings-switch-track">
                <span className="settings-switch-thumb" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* KI-Stimme */}
      <section className="settings-group" aria-labelledby="settings-voice">
        <h2 id="settings-voice" className="section-title settings-group-title">KI-Stimme</h2>
        <p className="settings-group-desc">
          Wähle die Stimme für die Sprachausgabe im KI-Assistenten. Tippe auf Abspielen für ein Hörbeispiel.
        </p>
        <div className="card settings-card">
          <div className="settings-row settings-row--switch">
            <span className="settings-row-label">KI-Antworten vorlesen</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.speakResponses}
              className={`settings-switch ${settings.speakResponses ? 'settings-switch--on' : ''}`}
              onClick={handleSpeakResponsesToggle}
            >
              <span className="settings-switch-track">
                <span className="settings-switch-thumb" />
              </span>
            </button>
          </div>
        </div>
        <div className="card settings-card settings-card--voice-list settings-card--voice-list-margin">
          {voices.length === 0 ? (
            <p className="settings-voice-empty">Stimmen werden geladen…</p>
          ) : (
            voices.map((voice) => {
              const isSelected = selectedVoiceName === voice.name
              const isPlaying = playingVoiceName === voice.name
              return (
                <div key={voice.name + voice.voiceURI} className="settings-voice-row">
                  <div className="settings-voice-info">
                    <span className="settings-voice-name">{voice.name}</span>
                    {voice.lang && (
                      <span className="settings-voice-lang">{voice.lang}</span>
                    )}
                  </div>
                  <div className="settings-voice-actions">
                    <button
                      type="button"
                      className={`settings-voice-play ${isPlaying ? 'settings-voice-play--active' : ''}`}
                      onClick={() => handlePlayVoice(voice)}
                      title="Hörbeispiel abspielen"
                      aria-label={`Hörbeispiel für ${voice.name}`}
                    >
                      <PlayIcon className="settings-voice-play-icon" aria-hidden />
                      <span>{isPlaying ? 'Läuft…' : 'Abspielen'}</span>
                    </button>
                    <button
                      type="button"
                      className={`settings-voice-select ${isSelected ? 'settings-voice-select--on' : ''}`}
                      onClick={() => handleSelectVoice(voice)}
                      title={isSelected ? 'Ausgewählt' : 'Als Stimme wählen'}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? (
                        <CheckIcon className="settings-voice-check" aria-hidden />
                      ) : (
                        <span className="settings-voice-select-label">Wählen</span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Erinnerungen */}
      <section className="settings-group" aria-labelledby="settings-erinnerungen">
        <h2 id="settings-erinnerungen" className="section-title settings-group-title">Erinnerungen</h2>
        <div className="card settings-card">
          <p className="settings-desc">
            Erlaube Benachrichtigungen für Erinnerungen an dein Tagesziel (z. B. Streak sichern).
          </p>
          {notifPermission === 'granted' ? (
            <div className="settings-row settings-row--notif">
              <span className="settings-badge">Aktiv</span>
              <button type="button" className="btn btn-secondary settings-btn-secondary" onClick={handleTestNotification}>
                Test senden
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary settings-btn-primary"
              onClick={handleRequestNotifications}
              disabled={notifPermission === 'denied'}
            >
              {notifPermission === 'denied'
                ? 'In Browser-Einstellungen erlauben'
                : 'Benachrichtigungen erlauben'}
            </button>
          )}
        </div>
      </section>

      {/* Daten */}
      <section className="settings-group" aria-labelledby="settings-daten">
        <h2 id="settings-daten" className="section-title settings-group-title">Daten</h2>
        <div className="card settings-card">
          <p className="settings-desc">
            Statistik und Fortschritt löschen. Lernsets und Name bleiben erhalten.
          </p>
          <button
            type="button"
            className={`btn btn-primary settings-btn-primary ${resetConfirm ? 'settings-btn-danger' : ''}`}
            onClick={handleResetStatistik}
          >
            {resetConfirm ? 'Erneut tippen zum Bestätigen' : 'Statistik zurücksetzen'}
          </button>
        </div>
      </section>

      {/* Feedback */}
      <section className="settings-group" aria-labelledby="settings-feedback">
        <h2 id="settings-feedback" className="section-title settings-group-title">Feedback &amp; Hilfe</h2>
        <div className="card settings-card">
          <p className="settings-desc">
            Hast du Anregungen oder hast du einen Fehler gefunden? Schreib uns – dein Feedback hilft uns, die App zu verbessern.
          </p>
          <a
            href={getFeedbackMailtoUrl()}
            className="btn btn-primary settings-btn-primary settings-link-feedback"
            rel="noopener noreferrer"
          >
            Feedback geben
          </a>
        </div>
      </section>

      {/* Über */}
      <section className="settings-group" aria-labelledby="settings-ueber">
        <h2 id="settings-ueber" className="section-title settings-group-title">Über die App</h2>
        <div className="card settings-card">
          <p className="settings-app-name">Latinum</p>
          <p className="settings-app-version">Version {APP_VERSION}</p>
        </div>
      </section>
    </div>
  )
}
