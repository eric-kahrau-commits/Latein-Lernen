import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { LernsetAssistantState } from '../data/aiClient'
import { getFaecher, getFachById } from '../data/faecher'
import { saveLernset } from '../data/lernsets'
import { generateConfetti } from '../utils/animationHelpers'
import './KIPage.css'

type PreviewItem = { front: string; back: string; wrongOptions?: [string, string, string] }

type LocationState = {
  items?: PreviewItem[]
  assistantState?: LernsetAssistantState
}

const FEEDBACK_EMAIL = 'feedback@latinum-app.de'
const FEEDBACK_SUBJECT = 'Fehler im KI-Lernset'

export function KILernsetVorschauPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const initialItems = state.items ?? []
  const assistantState = state.assistantState ?? {}

  const [localItems, setLocalItems] = useState<PreviewItem[]>(initialItems)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showSaveBlock, setShowSaveBlock] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveFachId, setSaveFachId] = useState(assistantState.fachId ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (initialItems.length > 0) setLocalItems(initialItems)
  }, [initialItems.length])

  const faecher = getFaecher()
  const hasValidFach = !!assistantState.fachId && faecher.some((f) => f.id === assistantState.fachId)

  useEffect(() => {
    if (!saveFachId && hasValidFach) {
      setSaveFachId(assistantState.fachId!)
    }
  }, [hasValidFach, assistantState.fachId, saveFachId])

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => {
        generateConfetti(document.body, 40)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [saved])

  useEffect(() => {
    if (initialItems.length === 0) {
      navigate('/ki/assistent', { replace: true })
    }
  }, [initialItems.length, navigate])

  const updateItem = (idx: number, patch: Partial<PreviewItem>) => {
    setLocalItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const handleFehlerMelden = () => {
    const name = saveName.trim() || (assistantState.topic ? `${assistantState.topic} (KI)` : 'KI-Lernset')
    const body = `Lernset: ${name}\n\nBitte beschreibe den Fehler (z. B. falsche Übersetzung, Tippfehler):\n\n`
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT + ' – ' + name)}&body=${encodeURIComponent(body)}`
    window.location.href = url
  }

  if (initialItems.length === 0) {
    return null
  }

  const handleBearbeiten = () => {
    navigate('/ki/assistent', {
      state: {
        assistantState,
        editMessage: 'Ich möchte etwas anpassen (z. B. weniger Karten oder einfachere Formulierungen).',
      },
      replace: false,
    })
  }

  const handleSpeichernClick = () => {
    setSaveError(null)
    setShowSaveBlock(true)
    if (!saveName.trim()) {
      const topic = assistantState.topic?.trim()
      setSaveName(topic ? `${topic} (KI)` : 'KI-Lernset')
    }
    if (!saveFachId && assistantState.fachId && faecher.some((f) => f.id === assistantState.fachId)) {
      setSaveFachId(assistantState.fachId)
    }
  }

  const handleSaveConfirm = () => {
    const name = saveName.trim()
    if (!name) {
      setSaveError('Bitte gib einen Namen ein.')
      return
    }
    const fachId = saveFachId?.trim()
    if (!fachId || !faecher.some((f) => f.id === fachId)) {
      setSaveError('Bitte wähle ein Fach (Ordner) aus.')
      return
    }
    setSaveError(null)
    try {
      saveLernset({
        name,
        fachId,
        items: localItems.map((it) => {
          const entry: { vokabel: string; uebersetzung: string; wrongOptions?: string[] } = {
            vokabel: it.front,
            uebersetzung: it.back,
          }
          if (Array.isArray(it.wrongOptions) && it.wrongOptions.length >= 3) {
            entry.wrongOptions = it.wrongOptions.slice(0, 3)
          }
          return entry
        }),
        source: 'ai',
      })
      setSaved(true)
      setShowSaveBlock(false)
      setTimeout(() => {
        navigate('/lernen', { state: { openKiVokabeln: true }, replace: true })
      }, 1500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    }
  }

  const fachLabel = assistantState.fachId ? getFachById(assistantState.fachId)?.name : null

  return (
    <div className="ki-page ki-page--assistant ki-page--vorschau">
      <header className="ki-header">
        <h1 className="page-title">KI-Lernset – Vorschau</h1>
      </header>

      <nav className="ki-vorschau-toolbar" aria-label="Aktionen">
        <button
          type="button"
          className="ki-btn ki-btn--secondary"
          onClick={handleBearbeiten}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          className="ki-btn ki-btn--primary"
          onClick={handleSpeichernClick}
        >
          Speichern
        </button>
      </nav>

      <section className="ki-preview ki-preview--vorschau" aria-label="Übersicht der Karteikarten">
        <div className="ki-preview-ki-hinweis" role="note">
          Von KI erstellt – bei Fehlern bitte melden oder Karten unten bearbeiten.
        </div>
        <p className="ki-preview-subtitle">
          {localItems.length} Karteikarten
          {fachLabel && ` · Fach: ${fachLabel}`}
          {assistantState.topic && ` · Thema: ${assistantState.topic}`}
        </p>
        <div className="ki-preview-table-wrapper">
          <table className="ki-preview-table">
            <thead>
              <tr>
                <th>Vorderseite</th>
                <th>Rückseite</th>
                <th aria-label="Aktionen" className="ki-preview-th-actions" />
              </tr>
            </thead>
            <tbody>
              {localItems.map((it, idx) => (
                <tr key={idx}>
                  {editingIndex === idx ? (
                    <>
                      <td className="ki-col-vokabel">
                        <input
                          type="text"
                          className="ki-preview-edit-input"
                          value={it.front}
                          onChange={(e) => updateItem(idx, { front: e.target.value })}
                          aria-label="Vorderseite bearbeiten"
                        />
                      </td>
                      <td className="ki-col-uebersetzung">
                        <input
                          type="text"
                          className="ki-preview-edit-input"
                          value={it.back}
                          onChange={(e) => updateItem(idx, { back: e.target.value })}
                          aria-label="Rückseite bearbeiten"
                        />
                      </td>
                      <td className="ki-preview-td-actions">
                        <button
                          type="button"
                          className="ki-btn ki-btn--secondary ki-preview-edit-done"
                          onClick={() => setEditingIndex(null)}
                        >
                          Fertig
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="ki-col-vokabel">{it.front}</td>
                      <td className="ki-col-uebersetzung">{it.back}</td>
                      <td className="ki-preview-td-actions">
                        <button
                          type="button"
                          className="ki-btn ki-btn--secondary ki-preview-edit-btn"
                          onClick={() => setEditingIndex(idx)}
                          aria-label={`Karte ${idx + 1} bearbeiten`}
                        >
                          Bearbeiten
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ki-preview-feedback-row">
          <button type="button" className="ki-btn ki-btn--secondary ki-preview-feedback-btn" onClick={handleFehlerMelden}>
            Fehler melden
          </button>
        </p>
      </section>

      {showSaveBlock && (
        <div className="ki-save-overlay" role="dialog" aria-modal="true" aria-labelledby="ki-vorschau-save-title">
          <div
            className="ki-save-backdrop"
            aria-hidden="true"
            onClick={() => setShowSaveBlock(false)}
          />
          <div className="ki-save-dialog">
            <h2 id="ki-vorschau-save-title" className="ki-save-title">
              Lernset speichern
            </h2>
            <p className="ki-save-text">Wie soll dein Lernset heißen?</p>
            <input
              className="ki-input ki-save-input"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={150}
              placeholder="Name des Lernsets"
            />
            <div className="ki-save-fach-row">
              <label htmlFor="ki-vorschau-fach" className="ki-save-label">
                Fach (Ordner) <span className="ki-required">*</span>
              </label>
              <select
                id="ki-vorschau-fach"
                className="ki-input ki-save-fach-select"
                value={saveFachId}
                onChange={(e) => setSaveFachId(e.target.value)}
              >
                <option value="">— Fach wählen —</option>
                {faecher.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {saveError && <p className="ki-error">{saveError}</p>}
            <div className="ki-save-buttons">
              <button
                type="button"
                className="ki-btn ki-btn--secondary"
                onClick={() => setShowSaveBlock(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="ki-btn ki-btn--primary"
                onClick={handleSaveConfirm}
                disabled={!saveName.trim() || !saveFachId}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="ki-save-overlay">
          <div className="ki-save-backdrop" aria-hidden="true" />
          <div className="ki-save-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ki-success-title">
            <h2 id="ki-success-title" className="ki-save-title">
              Gespeichert!
            </h2>
            <div className="ki-check ki-check--inline">
              <div className="ki-check-circle">
                <span className="ki-check-mark">✓</span>
              </div>
              <p className="ki-check-text">Dein Lernset wurde gespeichert. Du wirst zur Lernseite weitergeleitet – dort findest du es unter „KI-Lernsets“ → „Vokabeln“.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
