import { useState, useCallback } from 'react'
import {
  getLernsets,
  saveLernset,
  deleteLernset,
  MAX_VOKABELN,
  type Lernset,
  type VokabelEintrag,
} from '../data/lernsets'
import { getFavoritenIds, toggleFavorit } from '../data/favoriten'
import { StarIcon, StarIconFilled } from '../components/icons'
import './NeuPage.css'

const initialEmptyRow: VokabelEintrag = { vokabel: '', uebersetzung: '' }

export function NeuPage() {
  const [sets, setSets] = useState<Lernset[]>(() => getLernsets())
  const [favoritenIds, setFavoritenIds] = useState<string[]>(() => getFavoritenIds())
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [setName, setSetName] = useState('')
  const [items, setItems] = useState<VokabelEintrag[]>([{ ...initialEmptyRow }])

  const refreshSets = useCallback(() => {
    setSets(getLernsets())
  }, [])

  const handleAddRow = () => {
    if (items.length >= MAX_VOKABELN) return
    setItems((prev) => [...prev, { ...initialEmptyRow }])
  }

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: 'vokabel' | 'uebersetzung', value: string) => {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const handleSave = () => {
    const name = setName.trim()
    const validItems = items.filter((i) => i.vokabel.trim() || i.uebersetzung.trim())
    if (!name) return
    if (validItems.length === 0) return
    saveLernset({ name, items: validItems })
    refreshSets()
    setMode('list')
    setSetName('')
    setItems([{ ...initialEmptyRow }])
  }

  const handleCancelCreate = () => {
    setMode('list')
    setSetName('')
    setItems([{ ...initialEmptyRow }])
  }

  const handleDeleteSet = (id: string) => {
    if (window.confirm('Dieses Lernset wirklich löschen?')) {
      deleteLernset(id)
      refreshSets()
    }
  }

  const validItemsCount = items.filter((i) => i.vokabel.trim() || i.uebersetzung.trim()).length
  const canSave = setName.trim().length > 0 && validItemsCount > 0

  if (mode === 'create') {
    return (
      <div className="neu-page">
        <header className="neu-header">
          <h1 className="page-title">Neues Lernset erstellen</h1>
          <div className="neu-header-actions">
            <button type="button" className="neu-btn neu-btn--secondary" onClick={handleCancelCreate}>
              Abbrechen
            </button>
            <button
              type="button"
              className="neu-btn neu-btn--primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              Speichern
            </button>
          </div>
        </header>

        <div className="neu-create">
          <div className="neu-set-name-block">
            <label htmlFor="neu-set-name" className="neu-label">
              Name des Lernsets
            </label>
            <input
              id="neu-set-name"
              type="text"
              className="neu-input neu-set-name-input"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="z. B. Lektion 1 – Verben"
              maxLength={100}
            />
          </div>

          <div className="neu-vokabeln-block">
            <div className="neu-vokabeln-head">
              <span className="neu-label">Vokabeln</span>
              <span className="neu-vokabeln-count">
                {validItemsCount} / {MAX_VOKABELN}
              </span>
            </div>
            <div className="neu-vokabeln-table-wrap">
              <table className="neu-vokabeln-table">
                <thead>
                  <tr>
                    <th>Vokabel</th>
                    <th>Übersetzung</th>
                    <th className="neu-th-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="neu-input neu-cell-input"
                          value={row.vokabel}
                          onChange={(e) => handleItemChange(index, 'vokabel', e.target.value)}
                          placeholder="z. B. amare"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="neu-input neu-cell-input"
                          value={row.uebersetzung}
                          onChange={(e) => handleItemChange(index, 'uebersetzung', e.target.value)}
                          placeholder="z. B. lieben"
                        />
                      </td>
                      <td className="neu-td-action">
                        <button
                          type="button"
                          className="neu-btn-icon"
                          onClick={() => handleRemoveRow(index)}
                          disabled={items.length <= 1}
                          aria-label="Zeile entfernen"
                        >
                          −
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="neu-btn neu-btn--outline"
              onClick={handleAddRow}
              disabled={items.length >= MAX_VOKABELN}
            >
              + Weitere Vokabel hinzufügen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="neu-page">
      <header className="neu-header">
        <h1 className="page-title">Neu</h1>
        <button
          type="button"
          className="neu-btn neu-btn--primary"
          onClick={() => setMode('create')}
        >
          Neues Lernset erstellen
        </button>
      </header>

      <p className="neu-intro">Deine selbst erstellten Lernsets. Erstelle neue Sets mit bis zu 500 Vokabeln.</p>

      {sets.length === 0 ? (
        <div className="neu-empty">
          <p className="neu-empty-text">Noch keine Lernsets vorhanden.</p>
          <p className="neu-empty-hint">Klicke auf „Neues Lernset erstellen“, um dein erstes Set anzulegen.</p>
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
                    {set.items.length} {set.items.length === 1 ? 'Vokabel' : 'Vokabeln'}
                  </p>
                </div>
                <div className="neu-set-card-actions">
                  <button
                    type="button"
                    className="neu-btn-icon neu-star-btn"
                    onClick={() => {
                      toggleFavorit(set.id)
                      setFavoritenIds(getFavoritenIds())
                    }}
                    aria-label={isFav ? `${set.name} aus Favoriten entfernen` : `${set.name} zu Favoriten hinzufügen`}
                    title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
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
                    aria-label={`Set „${set.name}“ löschen`}
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
