import { useState, FormEvent } from 'react'
import { useProfile } from '../context/ProfileContext'
import './LoginModal.css'

export function LoginModal() {
  const { userName, setUserName } = useProfile()
  const [input, setInput] = useState('')

  if (userName) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed) setUserName(trimmed)
  }

  return (
    <div className="login-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="login-modal">
        <h2 id="login-modal-title" className="login-modal-title">Wie heißt du?</h2>
        <p className="login-modal-desc">Dein Name wird als Profil gespeichert und in der App angezeigt.</p>
        <form onSubmit={handleSubmit} className="login-modal-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dein Name"
            className="login-modal-input"
            autoFocus
            maxLength={50}
            aria-label="Dein Name"
          />
          <button type="submit" className="login-modal-btn" disabled={!input.trim()}>
            Speichern
          </button>
        </form>
      </div>
    </div>
  )
}
