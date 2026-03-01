import { useState, useEffect } from 'react'
import './LearnQuestionPopup.css'

type AnswerKey = 'ja' | 'bisschen' | 'nein'

function IconJa() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}
function IconBisschen() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconNein() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

const ANSWERS: { key: AnswerKey; label: string; Icon: () => JSX.Element; reaction: string }[] = [
  { key: 'ja', label: 'Ja, lass uns loslegen!', Icon: IconJa, reaction: 'Super, lass uns starten!' },
  { key: 'bisschen', label: 'Ein bisschen', Icon: IconBisschen, reaction: 'Okay, schau dich in Ruhe um.' },
  { key: 'nein', label: 'Nein, leider nicht', Icon: IconNein, reaction: 'Schade, vielleicht ein andermal!' },
]

type LearnQuestionPopupProps = {
  visible: boolean
  onClose: () => void
}

export function LearnQuestionPopup({ visible, onClose }: LearnQuestionPopupProps) {
  const [selected, setSelected] = useState<AnswerKey | null>(null)
  const [phase, setPhase] = useState<'choose' | 'react'>('choose')

  if (!visible) return null

  useEffect(() => {
    if (phase !== 'react') return
    const timer = setTimeout(onClose, 2200)
    return () => clearTimeout(timer)
  }, [phase, onClose])

  const handleAnswer = (key: AnswerKey) => {
    if (selected) return
    setSelected(key)
    setPhase('react')
  }

  const chosen = ANSWERS.find((a) => a.key === selected)
  const ReactionIcon = chosen?.Icon

  return (
    <div className="learn-popup-overlay" onClick={(e) => e.target === e.currentTarget && !selected && onClose()}>
      <div className={`learn-popup-card ${phase === 'react' ? 'learn-popup-card--react' : ''}`}>
        {phase === 'choose' ? (
          <>
            <p className="learn-popup-question">Hast du Lust, Latein zu lernen?</p>
            <div className="learn-popup-options">
              {ANSWERS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="learn-popup-btn"
                  onClick={() => handleAnswer(key)}
                  aria-label={label}
                >
                  <span className="learn-popup-btn-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="learn-popup-btn-label">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          chosen && ReactionIcon && (
            <div className="learn-popup-reaction">
              <span className="learn-popup-reaction-icon" aria-hidden>
                <ReactionIcon />
              </span>
              <p className="learn-popup-reaction-text">{chosen.reaction}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
