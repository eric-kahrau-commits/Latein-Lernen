import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLernsets, saveLernset, deleteLernset, type Lernset } from '../data/lernsets'
import { getFaecher } from '../data/faecher'
import { getFavoritenIds, toggleFavorit } from '../data/favoriten'
import { StarIcon, StarIconFilled, CardIcon } from '../components/icons'
import { ImageIcon } from '../components/icons-extended'
import './KarteikartenCreatePage.css'

/** Max. Zeichen pro Vorderseite/Rückseite (kurze Begriffe). */
const MAX_CHARS = 20
/** Max. Karten pro Set. */
const MAX_CARDS = 100

type CardEntry = { front: string; back: string; frontImage?: string; backImage?: string }

const emptyCard: CardEntry = { front: '', back: '' }

export interface KarteikartenCreatePageProps {
  onBack?: () => void
  initialMode?: 'list' | 'create'
}

export function KarteikartenCreatePage({
  onBack,
  initialMode = 'list',
}: KarteikartenCreatePageProps = {}) {
  const navigate = useNavigate()
  const [sets, setSets] = useState<Lernset[]>(() => getLernsets())
  const [favoritenIds, setFavoritenIds] = useState<string[]>(() => getFavoritenIds())
  const [mode, setMode] = useState<'list' | 'create'>(initialMode)
  const [items, setItems] = useState<CardEntry[]>([{ ...emptyCard }])
  const [showOverview, setShowOverview] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveFachId, setSaveFachId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const faecher = getFaecher()

  const refreshSets = useCallback(() => {
    setSets(getLernsets())
  }, [])

  const handleAddCard = () => {
    if (items.length >= MAX_CARDS) return
    setItems((prev) => [...prev, { ...emptyCard }])
  }

  const handleRemoveCard = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
    const trimmed = value.slice(0, MAX_CHARS)
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: trimmed } : row))
    )
  }

  const handleImageChange = (index: number, side: 'front' | 'back', file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setItems((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, [side === 'front' ? 'frontImage' : 'backImage']: dataUrl }
            : row
        )
      )
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (index: number, side: 'front' | 'back') => {
    setItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, [side === 'front' ? 'frontImage' : 'backImage']: undefined }
          : row
      )
    )
  }

  const validItems = items.filter((i) => i.front.trim() || i.back.trim())
  const canOpenSaveDialog = validItems.length > 0

  const handleSpeichernClick = () => {
    if (!canOpenSaveDialog) return
    setSaveError(null)
    setShowSaveDialog(true)
    if (!saveName.trim()) setSaveName('')
    if (!saveFachId && faecher.length > 0) setSaveFachId(faecher[0].id)
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
        items: validItems.map((i) => ({
          vokabel: i.front.trim() || '(leer)',
          uebersetzung: i.back.trim() || '(leer)',
          vokabelImage: i.frontImage,
          uebersetzungImage: i.backImage,
        })),
        source: 'manual',
      })
      setShowSaveDialog(false)
      setSaveName('')
      setSaveFachId('')
      refreshSets()
      if (onBack) {
        onBack()
      } else {
        navigate('/lernen')
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler beim Speichern.')
    }
  }

  const handleCancelCreate = () => {
    if (onBack) {
      onBack()
    } else {
      setMode('list')
    }
    setItems([{ ...emptyCard }])
    setShowOverview(false)
    setShowSaveDialog(false)
    setSaveError(null)
  }

  const handleDeleteSet = (id: string) => {
    if (window.confirm('Dieses Lernset wirklich löschen?')) {
      deleteLernset(id)
      refreshSets()
    }
  }

  const canSave = canOpenSaveDialog

  if (mode === 'create') {
    return (
      <div className="karteikarten-create-page">
        <header className="karteikarten-create-header">
          <h1 className="page-title">Karteikarten erstellen</h1>
          <div className="karteikarten-create-header-actions">
            <button
              type="button"
              className="neu-btn neu-btn--secondary"
              onClick={handleCancelCreate}
            >
              {onBack ? 'Zurück' : 'Abbrechen'}
            </button>
            <button
              type="button"
              className="neu-btn neu-btn--primary"
              onClick={handleSpeichernClick}
              disabled={!canSave}
            >
              Speichern &amp; Lernen
            </button>
          </div>
        </header>

        <div className="karteikarten-create-content">
          <div className="karteikarten-cards-section">
            <div className="karteikarten-cards-head">
              <span className="neu-label">Karteikarten</span>
              <span className="neu-vokabeln-count">
                {validItems.length} / {MAX_CARDS}
              </span>
            </div>
            <p className="karteikarten-create-hint">
              Kurze Begriffe (max. {MAX_CHARS} Zeichen pro Seite). Wird als Vokabelset gespeichert – dann stehen dir alle Lernmodi (Karteikarten, Lernen, Test, Wortpaare, Autorennen usw.) zur Verfügung.
            </p>

            <div className="karteikarten-cards-list">
              {items.map((card, index) => (
                <div key={index} className="karteikarten-card-editor">
                  <div className="karteikarten-card-editor-header">
                    <span className="karteikarten-card-number">Karte {index + 1}</span>
                    <button
                      type="button"
                      className="neu-btn-icon"
                      onClick={() => handleRemoveCard(index)}
                      disabled={items.length <= 1}
                      aria-label="Karte entfernen"
                    >
                      −
                    </button>
                  </div>
                  <div className="karteikarten-card-sides">
                    <div className="karteikarten-card-side">
                      <label className="neu-label">Vorderseite</label>
                      <input
                        type="text"
                        className="neu-input karteikarten-input"
                        value={card.front}
                        onChange={(e) => handleCardChange(index, 'front', e.target.value)}
                        placeholder="Begriff, Frage …"
                        maxLength={MAX_CHARS}
                      />
                      <span className="karteikarten-char-count">{card.front.length}/{MAX_CHARS}</span>
                      <div className="karteikarten-image-row">
                        <input
                          id={`karteikarten-front-${index}`}
                          type="file"
                          accept="image/*"
                          className="karteikarten-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            handleImageChange(index, 'front', file ?? null)
                            e.target.value = ''
                          }}
                        />
                        {card.frontImage ? (
                          <div className="karteikarten-image-preview karteikarten-image-preview--large">
                            <img src={card.frontImage} alt="Vorderseite" className="karteikarten-preview-img" />
                            <button type="button" className="karteikarten-remove-img" onClick={() => handleRemoveImage(index, 'front')} aria-label="Bild entfernen">×</button>
                          </div>
                        ) : (
                          <button type="button" className="neu-btn neu-btn--outline karteikarten-add-img" onClick={() => document.getElementById(`karteikarten-front-${index}`)?.click()}>
                            <ImageIcon className="karteikarten-add-img-icon" /> Bild hinzufügen
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="karteikarten-card-side">
                      <label className="neu-label">Rückseite</label>
                      <input
                        type="text"
                        className="neu-input karteikarten-input"
                        value={card.back}
                        onChange={(e) => handleCardChange(index, 'back', e.target.value)}
                        placeholder="Antwort, Definition …"
                        maxLength={MAX_CHARS}
                      />
                      <span className="karteikarten-char-count">{card.back.length}/{MAX_CHARS}</span>
                      <div className="karteikarten-image-row">
                        <input
                          id={`karteikarten-back-${index}`}
                          type="file"
                          accept="image/*"
                          className="karteikarten-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            handleImageChange(index, 'back', file ?? null)
                            e.target.value = ''
                          }}
                        />
                        {card.backImage ? (
                          <div className="karteikarten-image-preview karteikarten-image-preview--large">
                            <img src={card.backImage} alt="Rückseite" className="karteikarten-preview-img" />
                            <button type="button" className="karteikarten-remove-img" onClick={() => handleRemoveImage(index, 'back')} aria-label="Bild entfernen">×</button>
                          </div>
                        ) : (
                          <button type="button" className="neu-btn neu-btn--outline karteikarten-add-img" onClick={() => document.getElementById(`karteikarten-back-${index}`)?.click()}>
                            <ImageIcon className="karteikarten-add-img-icon" /> Bild hinzufügen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="neu-btn neu-btn--outline"
              onClick={handleAddCard}
              disabled={items.length >= MAX_CARDS}
            >
              + Weitere Karte hinzufügen
            </button>
          </div>

          <button
            type="button"
            className="neu-btn neu-btn--ghost karteikarten-overview-toggle"
            onClick={() => setShowOverview((v) => !v)}
          >
            {showOverview ? '▼ Übersicht ausblenden' : '▶ Übersicht anzeigen'}
          </button>

          {showOverview && validItems.length > 0 && (
            <div className="karteikarten-overview">
              <h3 className="karteikarten-overview-title">Übersicht</h3>
              <ul className="karteikarten-overview-list">
                {validItems.map((item, i) => (
                  <li key={i} className="karteikarten-overview-item">
                    <span className="karteikarten-overview-front">{item.front.trim() || '(leer)'}</span>
                    <span className="karteikarten-overview-arrow">→</span>
                    <span className="karteikarten-overview-back">{item.back.trim() || '(leer)'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="karteikarten-save-hint">
            Beim Klick auf „Speichern & Lernen“ kannst du einen Namen vergeben und ein Fach wählen. Das Set wird als Vokabelset gespeichert und erscheint unter Lernen in deinem gewählten Fach mit allen Lernmodi.
          </p>
        </div>

        {showSaveDialog && (
          <div className="karteikarten-save-overlay" role="dialog" aria-modal="true" aria-labelledby="karteikarten-save-title">
            <div className="karteikarten-save-backdrop" onClick={() => setShowSaveDialog(false)} aria-hidden />
            <div className="karteikarten-save-dialog">
              <h2 id="karteikarten-save-title" className="karteikarten-save-title">Lernset speichern</h2>
              <p className="karteikarten-save-text">Wie soll dein Lernset heißen?</p>
              <input
                type="text"
                className="neu-input karteikarten-save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="z. B. Mathe-Formeln"
                maxLength={150}
              />
              <div className="karteikarten-save-fach-row">
                <label htmlFor="karteikarten-save-fach" className="neu-label">
                  Fach (Ordner) <span className="neu-required">*</span>
                </label>
                <select
                  id="karteikarten-save-fach"
                  className="neu-input neu-fach-select"
                  value={saveFachId}
                  onChange={(e) => setSaveFachId(e.target.value)}
                >
                  <option value="">— Fach wählen —</option>
                  {faecher.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              {saveError && <p className="karteikarten-save-error">{saveError}</p>}
              <div className="karteikarten-save-buttons">
                <button type="button" className="neu-btn neu-btn--secondary" onClick={() => setShowSaveDialog(false)}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="neu-btn neu-btn--primary"
                  onClick={handleSaveConfirm}
                  disabled={!saveName.trim() || !saveFachId}
                >
                  Speichern &amp; zu Lernen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="karteikarten-create-page">
      <header className="karteikarten-create-header">
        <h1 className="page-title">Karteikarten</h1>
        <button
          type="button"
          className="neu-btn neu-btn--primary"
          onClick={() => setMode('create')}
        >
          <CardIcon className="karteikarten-header-icon" />
          Neues Lernset erstellen
        </button>
      </header>

      <p className="neu-intro">
        Erstelle kurze Karteikarten (max. {MAX_CHARS} Zeichen pro Seite). Gespeichert wird als Vokabelset – dann stehen dir alle Lernmodi (Karteikarten, Lernen, Test, Wortpaare, Autorennen) zur Verfügung.
      </p>

      {sets.length === 0 ? (
        <div className="neu-empty">
          <p className="neu-empty-text">Noch keine Lernsets.</p>
          <p className="neu-empty-hint">
            Klicke auf „Neues Lernset erstellen“, um Karteikarten anzulegen. Nach dem Speichern findest du sie unter Lernen in deinem gewählten Fach.
          </p>
        </div>
      ) : (
        <ul className="neu-set-list">
          {sets.map((set) => {
            const isFav = favoritenIds.includes(set.id)
            return (
              <li key={set.id} className="neu-set-card">
                <div className="neu-set-card-main">
                  <h2 className="neu-set-name">{set.name}</h2>
                  <p className="neu-set-meta">
                    {set.items.length} {set.items.length === 1 ? 'Karte' : 'Karten'}
                  </p>
                </div>
                <div className="neu-set-card-actions">
                  <button
                    type="button"
                    className="neu-btn neu-btn--outline"
                    onClick={() => navigate('/lernen')}
                  >
                    Lernen
                  </button>
                  <button
                    type="button"
                    className="neu-btn-icon neu-star-btn"
                    onClick={() => {
                      toggleFavorit(set.id)
                      setFavoritenIds(getFavoritenIds())
                    }}
                    aria-label={isFav ? `${set.name} aus Favoriten entfernen` : `${set.name} zu Favoriten hinzufügen`}
                  >
                    {isFav ? (
                      <StarIconFilled className="neu-star-icon neu-star-icon--filled" />
                    ) : (
                      <StarIcon className="neu-star-icon" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="neu-btn neu-btn--ghost neu-btn--danger"
                    onClick={() => handleDeleteSet(set.id)}
                  >
                    Löschen
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
