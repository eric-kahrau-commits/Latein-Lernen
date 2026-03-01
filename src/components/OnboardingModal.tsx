import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setOnboardingDone } from '../data/onboarding'
import { LernenIcon } from './icons'
import './OnboardingModal.css'

const STEPS = [
  {
    title: 'Willkommen bei Latein Lernen!',
    text: 'Hier lernst du Vokabeln, Deklinationen und Sachkunde – mit Karteikarten, Quiz und Spielen.',
    cta: 'Weiter',
  },
  {
    title: 'So geht\'s',
    text: 'Wähle unter **Lernen** ein Thema: Vokabeln, Endungen (Substantive, Verben, Adjektive) oder Sachkunde. Jede Lektion kannst du anschauen, mit Karteikarten üben oder im Test prüfen.',
    cta: 'Weiter',
  },
  {
    title: 'Los geht\'s!',
    text: 'Dein Streak zählt jeden Tag, an dem du eine Lektion abschließt. Viel Erfolg!',
    cta: 'Starten',
  },
]

export function OnboardingModal() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      setOnboardingDone()
      navigate('/lernen')
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-modal">
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i <= step ? 'onboarding-dot--active' : ''}`}
              aria-hidden
            />
          ))}
        </div>
        <h2 id="onboarding-title" className="onboarding-title">
          {current.title}
        </h2>
        <p className="onboarding-text">
          {current.text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
        </p>
        <div className="onboarding-actions">
          <button type="button" className="onboarding-btn" onClick={handleNext}>
            {isLast ? (
              <>
                <LernenIcon className="onboarding-btn-icon" />
                {current.cta}
              </>
            ) : (
              current.cta
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
