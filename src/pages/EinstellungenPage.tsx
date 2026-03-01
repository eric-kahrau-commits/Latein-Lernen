import { useState, useEffect } from 'react'
import { useProfile } from '../context/ProfileContext'
import {
  UserIcon,
  EinstellungenIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  TrashIcon,
  InfoIcon,
  BellIcon,
} from '../components/icons'
import {
  getSettings,
  setTheme,
  setFontSize,
  type ThemeValue,
  type FontSizeValue,
} from '../data/settings'
import { clearStatistik } from '../data/statistik'
import { isOwned } from '../data/shop'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showReminderNotification,
} from '../data/notifications'
import './EinstellungenPage.css'

const APP_VERSION = '1.0.0'

export function EinstellungenPage() {
  const { userName, setUserName } = useProfile()
  const [editName, setEditName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState(getSettings)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())

  useEffect(() => {
    setSettings(getSettings())
  }, [])

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

  const handleFontSize = (fontSize: FontSizeValue) => {
    setFontSize(fontSize)
    setSettings(getSettings())
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

  return (
    <div className="einstellungen-page">
      <h1 className="page-title">Einstellungen</h1>

      <section className="einstellungen-section einstellungen-profil" aria-labelledby="profil-heading">
        <h2 id="profil-heading" className="einstellungen-section-title">
          <span className="einstellungen-section-icon" aria-hidden>
            <UserIcon />
          </span>
          Profil
        </h2>
        <div className={`einstellungen-profil-card ${isOwned('champion-rahmen') ? 'einstellungen-profil-card--champion' : ''}`}>
          {!isEditing ? (
            <>
              <p className="einstellungen-profil-label">Dein Name</p>
              <p className="einstellungen-profil-name">{userName || '—'}</p>
              <button type="button" className="einstellungen-profil-btn" onClick={startEdit}>
                Name ändern
              </button>
            </>
          ) : (
            <div className="einstellungen-profil-edit">
              <label htmlFor="profil-name-input" className="einstellungen-profil-label">
                Dein Name
              </label>
              <input
                id="profil-name-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Dein Name"
                className="einstellungen-profil-input"
                maxLength={50}
                autoFocus
              />
              <div className="einstellungen-profil-edit-actions">
                <button type="button" className="einstellungen-profil-btn secondary" onClick={cancelEdit}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="einstellungen-profil-btn"
                  onClick={saveName}
                  disabled={!editName.trim()}
                >
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="einstellungen-section" aria-labelledby="darstellung-heading">
        <h2 id="darstellung-heading" className="einstellungen-section-title">
          <span className="einstellungen-section-icon" aria-hidden>
            <EinstellungenIcon />
          </span>
          Darstellung
        </h2>
        <div className="einstellungen-card">
          <div className="einstellungen-row">
            <span className="einstellungen-label">Design</span>
            <div className="einstellungen-options" role="radiogroup" aria-label="Design">
              <label className="einstellungen-radio">
                <input
                  type="radio"
                  name="theme"
                  checked={settings.theme === 'system'}
                  onChange={() => handleTheme('system')}
                />
                <MonitorIcon className="einstellungen-radio-icon" />
                <span>System</span>
              </label>
              <label className="einstellungen-radio">
                <input
                  type="radio"
                  name="theme"
                  checked={settings.theme === 'light'}
                  onChange={() => handleTheme('light')}
                />
                <SunIcon className="einstellungen-radio-icon" />
                <span>Hell</span>
              </label>
              <label className="einstellungen-radio">
                <input
                  type="radio"
                  name="theme"
                  checked={settings.theme === 'dark'}
                  onChange={() => handleTheme('dark')}
                />
                <MoonIcon className="einstellungen-radio-icon" />
                <span>Dunkel</span>
              </label>
              {isOwned('theme-sonnenuntergang') && (
                <label className="einstellungen-radio">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.theme === 'sonnenuntergang'}
                    onChange={() => handleTheme('sonnenuntergang')}
                  />
                  <span>🌅 Sonnenuntergang</span>
                </label>
              )}
              {isOwned('theme-wald') && (
                <label className="einstellungen-radio">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.theme === 'wald'}
                    onChange={() => handleTheme('wald')}
                  />
                  <span>🌲 Wald</span>
                </label>
              )}
            </div>
          </div>
          <div className="einstellungen-row">
            <span className="einstellungen-label">Schriftgröße</span>
            <div className="einstellungen-options" role="radiogroup" aria-label="Schriftgröße">
              <label className="einstellungen-radio">
                <input
                  type="radio"
                  name="fontSize"
                  checked={settings.fontSize === 'normal'}
                  onChange={() => handleFontSize('normal')}
                />
                <span>Normal</span>
              </label>
              <label className="einstellungen-radio">
                <input
                  type="radio"
                  name="fontSize"
                  checked={settings.fontSize === 'large'}
                  onChange={() => handleFontSize('large')}
                />
                <span>Größer</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="einstellungen-section" aria-labelledby="erinnerungen-heading">
        <h2 id="erinnerungen-heading" className="einstellungen-section-title">
          <span className="einstellungen-section-icon" aria-hidden>
            <BellIcon />
          </span>
          Erinnerungen
        </h2>
        <div className="einstellungen-card">
          <p className="einstellungen-daten-text">
            Erlaube Benachrichtigungen, damit wir dich an dein Tagesziel erinnern können (z. B. wenn du deinen Streak noch nicht gesichert hast).
          </p>
          {notifPermission === 'granted' ? (
            <div className="einstellungen-notif-status">
              <span className="einstellungen-notif-badge">Aktiv</span>
              <button type="button" className="einstellungen-profil-btn secondary" onClick={handleTestNotification}>
                Test-Benachrichtigung senden
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="einstellungen-profil-btn"
              onClick={handleRequestNotifications}
              disabled={notifPermission === 'denied'}
            >
              {notifPermission === 'denied'
                ? 'Benachrichtigungen blockiert (in Browser-Einstellungen erlauben)'
                : 'Benachrichtigungen erlauben'}
            </button>
          )}
        </div>
      </section>

      <section className="einstellungen-section" aria-labelledby="daten-heading">
        <h2 id="daten-heading" className="einstellungen-section-title">
          <span className="einstellungen-section-icon" aria-hidden>
            <TrashIcon />
          </span>
          Daten
        </h2>
        <div className="einstellungen-card">
          <p className="einstellungen-daten-text">
            Statistik und Fortschritt (Lernminuten, Trefferquoten, Kalender) löschen. Deine Lernsets und dein Name bleiben erhalten.
          </p>
          <button
            type="button"
            className={`einstellungen-profil-btn ${resetConfirm ? 'einstellungen-btn-danger' : 'einstellungen-btn-secondary'}`}
            onClick={handleResetStatistik}
          >
            {resetConfirm ? 'Wirklich zurücksetzen? Klicken zum Bestätigen' : 'Statistik zurücksetzen'}
          </button>
        </div>
      </section>

      <section className="einstellungen-section" aria-labelledby="ueber-heading">
        <h2 id="ueber-heading" className="einstellungen-section-title">
          <span className="einstellungen-section-icon" aria-hidden>
            <InfoIcon />
          </span>
          Über die App
        </h2>
        <div className="einstellungen-card einstellungen-ueber">
          <p className="einstellungen-ueber-name">Latinum</p>
          <p className="einstellungen-ueber-version">Version {APP_VERSION}</p>
        </div>
      </section>
    </div>
  )
}
