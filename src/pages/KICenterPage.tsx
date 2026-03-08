import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NeuPage } from './NeuPage'
import { KarteikartenCreatePage } from './KarteikartenCreatePage'
import { chatLernSupport, isOnline, OFFLINE_MESSAGE } from '../data/aiClient'
import { share, getShareLernsetPayload } from '../data/share'
import { getLernsets, deleteLernset } from '../data/lernsets'
import { getKarteikartenSets, deleteKarteikartenSet } from '../data/karteikartenSets'
import { getAiDeklinationSets, deleteAiDeklinationSet } from '../data/aiDeklinationSets'
import { SparklesIcon, PenLineIcon, LightbulbIcon, TrashIcon, CardIcon, WifiOffIcon, ShareIcon } from '../components/icons'
import './KIPage.css'

type HelperMessage = { role: 'user' | 'assistant'; content: string }

type MainTab = 'erstellen' | 'dateien'
type ErstellenSection = null | 'ki' | 'vokabel' | 'karteikarten' | 'helper'

const TYP_LABELS: Record<string, string> = {
  a: 'a-Deklination',
  o: 'o-Deklination',
  u: 'u-Deklination',
  konsonantisch: 'konsonantische Deklination',
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function KICenterPage() {
  const navigate = useNavigate()
  const [mainTab, setMainTab] = useState<MainTab>('erstellen')
  const [createSection, setCreateSection] = useState<ErstellenSection>(null)

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const [helperMessages, setHelperMessages] = useState<HelperMessage[]>([
    {
      role: 'assistant',
      content:
        'Hallo, ich bin dein Lernunterstützer. Frag mich alles zu Mathe, Latein, Deutsch oder Sachkunde – ich erkläre es dir Schritt für Schritt.',
    },
  ])
  const [helperInput, setHelperInput] = useState('')
  const [helperLoading, setHelperLoading] = useState(false)
  const [helperError, setHelperError] = useState<string | null>(null)
  const [online, setOnline] = useState(() => isOnline())
  const [shareLernsetFeedbackId, setShareLernsetFeedbackId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOnline(isOnline())
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const handleSendHelper = async () => {
    const text = helperInput.trim()
    if (!text || helperLoading) return
    const nextMessages: HelperMessage[] = [...helperMessages, { role: 'user', content: text }]
    setHelperMessages(nextMessages)
    setHelperInput('')
    setHelperError(null)
    setHelperLoading(true)
    try {
      const reply = await chatLernSupport(nextMessages)
      setHelperMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Der Lernunterstützer konnte gerade nicht antworten.'
      setHelperError(msg)
    } finally {
      setHelperLoading(false)
    }
  }

  const handleHelperKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!helperLoading) handleSendHelper()
    }
  }

  const handleRetryHelper = async () => {
    const lastUser = [...helperMessages].reverse().find((m) => m.role === 'user')
    if (!lastUser || helperLoading) return
    setHelperError(null)
    setHelperLoading(true)
    try {
      const reply = await chatLernSupport(helperMessages)
      setHelperMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Der Lernunterstützer konnte gerade nicht antworten.'
      setHelperError(msg)
    } finally {
      setHelperLoading(false)
    }
  }

  const aiDeklSets = getAiDeklinationSets().slice().sort((a, b) => b.createdAt - a.createdAt)
  const allLernsets = getLernsets().slice().sort((a, b) => b.createdAt - a.createdAt)
  const aiVokabelSets = allLernsets.filter((s) => s.source === 'ai')
  const manualVokabelSets = allLernsets.filter((s) => s.source !== 'ai')
  const karteikartenSets = getKarteikartenSets().slice().sort((a, b) => b.createdAt - a.createdAt)

  const handleDeleteAiDekl = (id: string) => {
    if (window.confirm('Dieses KI-Lernset wirklich löschen?')) deleteAiDeklinationSet(id)
  }
  const handleDeleteLernset = (id: string) => {
    if (window.confirm('Dieses Lernset wirklich löschen?')) deleteLernset(id)
  }
  const handleDeleteKarteikartenSet = (id: string) => {
    if (window.confirm('Dieses Karteikarten-Lernset wirklich löschen?')) deleteKarteikartenSet(id)
  }

  const handleShareLernset = async (set: { name: string; items: Array<{ vokabel: string; uebersetzung: string }>; id?: string }) => {
    const ok = await share(getShareLernsetPayload(set))
    if (ok) {
      setShareLernsetFeedbackId(set.id ?? set.name)
      setTimeout(() => setShareLernsetFeedbackId(null), 2000)
    }
  }

  return (
    <div className="ki-page ki-page--hub ki-page--modern">
      <header className="ki-hub-header ki-hub-header--modern">
        <div className="ki-hub-header-text">
          <h1 className="page-title ki-hub-title">KI &amp; Lernsets</h1>
          <p className="ki-hub-subtitle">
            Erstelle Lernsets mit KI, eigene Vokabelsets oder nutze den Lernunterstützer.
          </p>
        </div>
        <nav className="ki-hub-nav" aria-label="Bereich wählen">
          <button
            type="button"
            className={`ki-hub-nav-btn ${mainTab === 'erstellen' ? 'ki-hub-nav-btn--active' : ''}`}
            onClick={() => { setMainTab('erstellen'); setCreateSection(null) }}
          >
            Erstellen
          </button>
          <button
            type="button"
            className={`ki-hub-nav-btn ${mainTab === 'dateien' ? 'ki-hub-nav-btn--active' : ''}`}
            onClick={() => setMainTab('dateien')}
          >
            Meine Dateien
          </button>
        </nav>
      </header>

      {mainTab === 'erstellen' && (
        <section className="ki-erstellen-section" aria-label="Erstellen">
          {createSection === null && (
            <div className="ki-erstellen-cards">
              <p className="ki-erstellen-lead">Womit möchtest du starten?</p>
              <div className="ki-create-cards-grid">
                <button
                  type="button"
                  className="card ki-create-card ki-create-card--ki"
                  onClick={() => navigate('/ki/assistent')}
                >
                  <span className="ki-create-card-icon" aria-hidden>
                    <SparklesIcon />
                  </span>
                  <span className="ki-create-card-title">KI-Lernset erstellen</span>
                  <span className="ki-create-card-desc">Mit dem KI-Assistenten Vokabeln oder Deklinationen erstellen</span>
                </button>
                <button
                  type="button"
                  className="card ki-create-card ki-create-card--vokabel"
                  onClick={() => setCreateSection('vokabel')}
                >
                  <span className="ki-create-card-icon" aria-hidden>
                    <PenLineIcon />
                  </span>
                  <span className="ki-create-card-title">Vokabelset erstellen</span>
                  <span className="ki-create-card-desc">Manuell ein eigenes Vokabel-Lernset anlegen</span>
                </button>
                <button
                  type="button"
                  className="card ki-create-card ki-create-card--karteikarten"
                  onClick={() => setCreateSection('karteikarten')}
                >
                  <span className="ki-create-card-icon" aria-hidden>
                    <CardIcon />
                  </span>
                  <span className="ki-create-card-title">Karteikarten erstellen</span>
                  <span className="ki-create-card-desc">Karteikarten für jedes Fach – Vorderseite, Rückseite, Bilder, Formeln</span>
                </button>
                <button
                  type="button"
                  className="card ki-create-card ki-create-card--helper"
                  onClick={() => setCreateSection('helper')}
                >
                  <span className="ki-create-card-icon" aria-hidden>
                    <LightbulbIcon />
                  </span>
                  <span className="ki-create-card-title">Lernunterstützer</span>
                  <span className="ki-create-card-desc">Frag die KI zu Themen aus Mathe, Latein, Deutsch, Sachkunde</span>
                </button>
              </div>
            </div>
          )}

          {createSection === 'vokabel' && (
            <div className="ki-erstellen-inline">
              <button
                type="button"
                className="ki-back-to-cards"
                onClick={() => setCreateSection(null)}
              >
                ‹ Zurück zur Auswahl
              </button>
              <NeuPage
                initialMode="create"
                onBack={() => setCreateSection(null)}
              />
            </div>
          )}

          {createSection === 'karteikarten' && (
            <div className="ki-erstellen-inline">
              <button
                type="button"
                className="ki-back-to-cards"
                onClick={() => setCreateSection(null)}
              >
                ‹ Zurück zur Auswahl
              </button>
              <KarteikartenCreatePage
                initialMode="create"
                onBack={() => setCreateSection(null)}
              />
            </div>
          )}

          {createSection === 'helper' && (
            <div className="ki-erstellen-inline">
              <button
                type="button"
                className="ki-back-to-cards"
                onClick={() => setCreateSection(null)}
              >
                ‹ Zurück zur Auswahl
              </button>
              {!online && (
                <div className="ki-offline-hinweis" role="status" aria-live="polite">
                  <WifiOffIcon className="ki-offline-hinweis-icon" aria-hidden />
                  <span>{OFFLINE_MESSAGE}</span>
                </div>
              )}
              <div className="card ki-helper-card ki-helper-card--standalone">
                <h2 className="ki-helper-title">Lernunterstützer</h2>
                <p className="ki-helper-subtitle">
                  Stelle der KI Fragen wie „Wie löst man eine quadratische Gleichung?“ oder „Erkläre mir die A-Deklination“.
                </p>
                <div className="ki-chat-box ki-chat-box--bubbles ki-helper-chat">
                  {helperMessages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`ki-chat-bubble ki-chat-bubble--${msg.role}`}
                    >
                      <p className="ki-chat-bubble-text">{msg.content}</p>
                    </div>
                  ))}
                  {helperLoading && <p className="ki-chat-loading">Der Lernunterstützer denkt kurz nach …</p>}
                </div>
                <div className="ki-helper-input-row">
                  <textarea
                    className="ki-input ki-helper-textarea"
                    placeholder="Schreibe deine Frage an die KI …"
                    value={helperInput}
                    onChange={(e) => setHelperInput(e.target.value)}
                    onKeyDown={handleHelperKeyDown}
                    rows={3}
                    disabled={helperLoading}
                  />
                  <button
                    type="button"
                    className="btn btn-primary ki-btn ki-btn--primary ki-helper-send-btn"
                    onClick={handleSendHelper}
                    disabled={helperLoading || !helperInput.trim()}
                  >
                    Senden
                  </button>
                </div>
                {helperError && (
                  <div className="ki-error-block">
                    <p className="ki-error ki-helper-error">
                      {helperError === OFFLINE_MESSAGE && (
                        <>
                          <WifiOffIcon className="ki-error-offline-icon" aria-hidden />
                          <span className="ki-error-offline-label">Keine Verbindung:</span>{' '}
                        </>
                      )}
                      {helperError}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary ki-btn ki-btn--secondary ki-retry-btn"
                      onClick={handleRetryHelper}
                      disabled={helperLoading}
                    >
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      )}

      {mainTab === 'dateien' && (
        <section className="ki-dateien-section" aria-label="Meine Dateien">
          <p className="ki-dateien-lead">Deine erstellten Lernsets – gruppiert nach Art.</p>

          {aiDeklSets.length > 0 && (
            <div className="ki-dateien-block">
              <button
                type="button"
                className="ki-dateien-block-head"
                onClick={() => toggleSection('ki-dekl')}
                aria-expanded={!collapsedSections['ki-dekl']}
              >
                <span className="ki-dateien-block-title">KI-Deklinations-Lernsets</span>
                <span className="ki-dateien-block-badge">{aiDeklSets.length}</span>
                <span className="ki-dateien-block-chevron">{collapsedSections['ki-dekl'] ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections['ki-dekl'] && (
                <div className="ki-dateien-kacheln">
                  {aiDeklSets.map((set) => (
                    <div key={set.id} className="ki-dateien-kachel">
                      <div className="ki-dateien-kachel-main">
                        <span className="ki-dateien-kachel-name">{set.title}</span>
                        <span className="ki-dateien-kachel-meta">
                          {TYP_LABELS[set.typ] ?? set.typ} · {formatDate(set.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="ki-dateien-kachel-action"
                        onClick={() => handleDeleteAiDekl(set.id)}
                        aria-label="Löschen"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(aiVokabelSets.length > 0 || manualVokabelSets.length > 0) && (
            <div className="ki-dateien-block">
              <button
                type="button"
                className="ki-dateien-block-head"
                onClick={() => toggleSection('vokabel')}
                aria-expanded={!collapsedSections['vokabel']}
              >
                <span className="ki-dateien-block-title">Vokabel-Lernsets</span>
                <span className="ki-dateien-block-badge">{aiVokabelSets.length + manualVokabelSets.length}</span>
                <span className="ki-dateien-block-chevron">{collapsedSections['vokabel'] ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections['vokabel'] && (
                <div className="ki-dateien-kacheln">
                  {[...aiVokabelSets, ...manualVokabelSets].map((set) => (
                    <div key={set.id} className="ki-dateien-kachel ki-dateien-kachel--vokabel">
                      <div className="ki-dateien-kachel-main">
                        <span className="ki-dateien-kachel-name">{set.name}</span>
                        <span className="ki-dateien-kachel-meta">
                          {set.items.length} Vokabeln · {formatDate(set.createdAt)}
                          {set.source === 'ai' && ' · KI'}
                        </span>
                      </div>
                      <div className="ki-dateien-kachel-actions">
                        <button
                          type="button"
                          className="ki-dateien-kachel-action ki-dateien-kachel-action--share"
                          onClick={() => handleShareLernset(set)}
                          aria-label="Lernset teilen"
                          title="Lernset teilen"
                        >
                          <ShareIcon />
                        </button>
                        <button
                          type="button"
                          className="ki-dateien-kachel-action"
                          onClick={() => handleDeleteLernset(set.id)}
                          aria-label="Löschen"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      {shareLernsetFeedbackId === set.id && (
                        <span className="ki-dateien-share-ok">Kopiert!</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {karteikartenSets.length > 0 && (
            <div className="ki-dateien-block">
              <button
                type="button"
                className="ki-dateien-block-head"
                onClick={() => toggleSection('karteikarten')}
                aria-expanded={!collapsedSections['karteikarten']}
              >
                <span className="ki-dateien-block-title">Karteikarten-Lernsets</span>
                <span className="ki-dateien-block-badge">{karteikartenSets.length}</span>
                <span className="ki-dateien-block-chevron">{collapsedSections['karteikarten'] ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections['karteikarten'] && (
                <div className="ki-dateien-kacheln">
                  {karteikartenSets.map((set) => (
                    <div key={set.id} className="ki-dateien-kachel ki-dateien-kachel--karteikarten">
                      <div className="ki-dateien-kachel-main">
                        <span className="ki-dateien-kachel-name">{set.name}</span>
                        <span className="ki-dateien-kachel-meta">
                          {set.items.length} {set.items.length === 1 ? 'Karte' : 'Karten'} · {formatDate(set.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="ki-dateien-kachel-action"
                        onClick={() => handleDeleteKarteikartenSet(set.id)}
                        aria-label="Löschen"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {aiDeklSets.length === 0 && aiVokabelSets.length === 0 && manualVokabelSets.length === 0 && karteikartenSets.length === 0 && (
            <div className="ki-dateien-leer">
              <p className="ki-dateien-leer-text">Noch keine Dateien vorhanden.</p>
              <p className="ki-dateien-leer-hint">Wechsle zu „Erstellen“ und lege dein erstes KI- oder Vokabel-Lernset an.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
