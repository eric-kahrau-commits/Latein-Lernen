import { useState, useEffect } from 'react'
import './LearnQuestionBlock.css'

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

export function LearnQuestionBlock() {
  const [selected, setSelected] = useState<AnswerKey | null>(null)
  const [showJaPopup, setShowJaPopup] = useState(false)
  const [jaPhase, setJaPhase] = useState<'smiley' | 'thumbsup'>('smiley')

  const handleAnswer = (key: AnswerKey) => {
    const wasJa = selected === 'ja'
    setSelected(key)
    if (key === 'ja') {
      setShowJaPopup(true)
      setJaPhase('smiley')
    } else if (wasJa) {
      setShowJaPopup(false)
    }
  }

  useEffect(() => {
    if (!showJaPopup) return
    const t = setTimeout(() => setJaPhase('thumbsup'), 1800)
    return () => clearTimeout(t)
  }, [showJaPopup])

  const chosen = selected ? ANSWERS.find((a) => a.key === selected) : null

  return (
    <>
      <section className="learn-block" aria-labelledby="learn-question-heading">
        <div
          className={`learn-block-card ${selected ? `learn-block-card--${selected}` : ''}`}
        >
          <h2 id="learn-question-heading" className="learn-block-question">
            Hast du Lust, Latein zu lernen?
          </h2>
          <div className="learn-block-options">
            {ANSWERS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                className={`learn-block-btn ${selected === key ? 'learn-block-btn--selected' : ''}`}
                onClick={() => handleAnswer(key)}
                aria-label={label}
                aria-pressed={selected === key}
              >
                <span className="learn-block-btn-icon" aria-hidden>
                  <Icon />
                </span>
                <span className="learn-block-btn-label">{label}</span>
              </button>
            ))}
          </div>
          {chosen && (
            <p className="learn-block-chosen-text" aria-live="polite">
              {chosen.reaction}
            </p>
          )}
        </div>
      </section>

      {/* Bei Ja: Popup mit Smiley → "Genau die richtige Einstellung" → Daumen hoch */}
      {showJaPopup && (
        <div
          className="learn-ja-popup-overlay"
          onClick={() => setShowJaPopup(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setShowJaPopup(false)}
          aria-label="Schließen"
        >
          <div className="learn-ja-popup-card" onClick={(e) => e.stopPropagation()}>
            {jaPhase === 'smiley' ? (
              <>
                <span className="learn-ja-popup-smiley" aria-hidden>
                  😊
                </span>
                <p className="learn-ja-popup-text">Genau die richtige Einstellung!</p>
              </>
            ) : (
              <>
                <span className="learn-ja-popup-thumbsup" aria-hidden>
                  <IconJa />
                </span>
                <p className="learn-ja-popup-text">Los geht&apos;s!</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
