import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AiDeklTyp, AiDeklinationSet } from '../data/aiDeklinationSets'
import { getAiDeklinationSets, deleteAiDeklinationSet } from '../data/aiDeklinationSets'
import {
  chatLernsetAssistant,
  generateKarteikartenSetWithAI,
  type LernsetAssistantState,
  isOnline,
  OFFLINE_MESSAGE,
} from '../data/aiClient'
import { getLernsets } from '../data/lernsets'
import { getFachById } from '../data/faecher'
import { getKiVoice } from '../data/voice'
import { getSettings } from '../data/settings'
import { TrashIcon, ShareIcon, CloseIcon, MicrophoneIcon, WifiOffIcon } from '../components/icons'
import { VoiceBubble } from '../components/VoiceBubble'
import './KIPage.css'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const TYP_OPTIONS: { value: AiDeklTyp; label: string }[] = [
  { value: 'a', label: 'a‑Deklination' },
  { value: 'o', label: 'o‑Deklination' },
  { value: 'u', label: 'u‑Deklination' },
  { value: 'konsonantisch', label: 'konsonantische Deklination' },
]

export function KIAssistantPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const fromState = (location.state as { editMessage?: string })?.editMessage
    if (fromState) {
      return [
        { role: 'assistant', content: 'Hallo, ich bin dein KI-Lernassistent. In welchem Fach möchtest du ein Lernset erstellen?' },
        { role: 'user', content: fromState },
        { role: 'assistant', content: 'Du bist zurück zur Bearbeitung. Schreib mir, was du anpassen möchtest – z. B. weniger Karten, einfachere Formulierungen oder ein anderes Thema.' },
      ]
    }
    return [
      {
        role: 'assistant',
        content: 'Hallo! In welchem Fach möchtest du ein Lernset erstellen? (z. B. Mathe, Latein, Bio)',
      },
    ]
  })
  const [assistantState, setAssistantState] = useState<LernsetAssistantState>(
    (location.state as { assistantState?: LernsetAssistantState })?.assistantState ?? {}
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedAction, setLastFailedAction] = useState<'chat' | 'create' | null>(null)
  const [online, setOnline] = useState(() => isOnline())
  const [inputValue, setInputValue] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'speech'>('text')

  const [speechSupported, setSpeechSupported] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [speechTranscript, setSpeechTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const [showProgressOverlay, setShowProgressOverlay] = useState(false)
  const [createProgress, setCreateProgress] = useState(0)

  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dictationBufferRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      return
    }
    setSpeechSupported(true)
  }, [])

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

  const stopDictation = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    dictationBufferRef.current = ''
    setSpeechTranscript('')
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const speak = (text: string) => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    stopDictation()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 1.25
    utterance.pitch = 0.88
    const voice = getKiVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (!chatEndRef.current) return
    chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages])

  const fachLabel = assistantState.fachId ? (getFachById(assistantState.fachId)?.name ?? assistantState.fachId) : ''
  const schwierigkeitLabel = assistantState.schwierigkeit?.trim() ? `: ${assistantState.schwierigkeit.trim().slice(0, 30)}${(assistantState.schwierigkeit.trim().length > 30 ? '…' : '')}` : ''
  const checklist = [
    { id: 'fach', label: 'Fach' + (fachLabel ? `: ${fachLabel}` : ''), done: !!assistantState.fachId },
    { id: 'count', label: 'Anzahl Karten', done: typeof assistantState.count === 'number' && assistantState.count >= 1 },
    { id: 'topic', label: 'Thema', done: !!assistantState.topic?.trim() },
    { id: 'klasse', label: 'Klassenstufe (5–10)', done: typeof assistantState.klasse === 'number' && assistantState.klasse >= 5 && assistantState.klasse <= 10 },
    { id: 'schwierigkeit', label: 'Schwierigkeit (optional)' + schwierigkeitLabel, done: !!assistantState.schwierigkeit?.trim() },
  ]

  const canCreate =
    !!assistantState.fachId &&
    typeof assistantState.count === 'number' &&
    assistantState.count >= 1 &&
    assistantState.count <= 100 &&
    !!assistantState.topic?.trim() &&
    typeof assistantState.klasse === 'number' &&
    assistantState.klasse >= 5 &&
    assistantState.klasse <= 10

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: trimmed }]
    setChatMessages(newMessages)
    setInputValue('')
    setError(null)
    setIsGenerating(true)

    try {
      const turn = await chatLernsetAssistant(newMessages, assistantState)
      setLastFailedAction(null)
      setAssistantState(turn.state)
      setChatMessages([...newMessages, { role: 'assistant', content: turn.reply }])
      if (turn.error) {
        setError(turn.error)
      }
      if (speechSupported && getSettings().speakResponses) {
        speak(turn.reply)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unerwarteter Fehler beim KI-Chat.')
      setLastFailedAction('chat')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetryChat = useCallback(async () => {
    setError(null)
    setLastFailedAction(null)
    setIsGenerating(true)
    try {
      const turn = await chatLernsetAssistant(chatMessages, assistantState)
      setAssistantState(turn.state)
      setChatMessages([...chatMessages, { role: 'assistant', content: turn.reply }])
      if (turn.error) setError(turn.error)
      if (speechSupported && getSettings().speakResponses) speak(turn.reply)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unerwarteter Fehler beim KI-Chat.')
      setLastFailedAction('chat')
    } finally {
      setIsGenerating(false)
    }
  }, [chatMessages, assistantState, speechSupported])


  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isGenerating) {
        handleSend(inputValue)
      }
    }
  }

  const DICTATION_SILENCE_MS = 3000

  const startListening = () => {
    if (typeof window === 'undefined') return
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      setError('Dein Browser unterstützt die Diktierfunktion leider nicht.')
      return
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    dictationBufferRef.current = ''
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }
    const rec: SpeechRecognition = new SR()
    recognitionRef.current = rec
    rec.lang = 'de-DE'
    ;(rec as any).interimResults = true
    ;(rec as any).maxAlternatives = 1
    rec.continuous = true
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        fullTranscript += t
        if (event.results[i].isFinal && t.trim()) {
          dictationBufferRef.current =
            (dictationBufferRef.current ? dictationBufferRef.current + ' ' : '') + t.trim()
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = setTimeout(() => {
            silenceTimeoutRef.current = null
            const toSend = dictationBufferRef.current.trim()
            dictationBufferRef.current = ''
            if (toSend) handleSend(toSend)
            setSpeechTranscript('')
          }, DICTATION_SILENCE_MS)
        }
      }
      setSpeechTranscript(fullTranscript)
    }
    rec.onerror = () => {
      setIsListening(false)
    }
    rec.onend = () => {
      setIsListening(false)
    }
    setSpeechTranscript('')
    setIsListening(true)
    rec.start()
  }

  const handleCreateLernset = async () => {
    if (!canCreate) return
    const fach = getFachById(assistantState.fachId!)
    if (!fach) {
      setError('Bitte wähle ein gültiges Fach.')
      return
    }
    setError(null)
    setLastFailedAction(null)
    setShowProgressOverlay(true)
    setCreateProgress(0)
    setIsGenerating(true)

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    progressIntervalRef.current = setInterval(() => {
      setCreateProgress((p) => {
        if (p >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          return 95
        }
        return p + 4
      })
    }, 90)

    try {
      const count = Math.max(1, Math.min(100, assistantState.count ?? 20))
      const resp = await generateKarteikartenSetWithAI({
        fachId: assistantState.fachId!,
        fachName: fach.name,
        topic: assistantState.topic!.trim(),
        count,
        klasse: assistantState.klasse!,
        schwierigkeit: assistantState.schwierigkeit?.trim(),
      })
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setCreateProgress(100)
      setTimeout(() => {
        setShowProgressOverlay(false)
        setCreateProgress(0)
        setIsGenerating(false)
        navigate('/ki/assistent/vorschau', {
          state: {
            items: resp.items,
            assistantState: { ...assistantState, count },
          },
          replace: false,
        })
      }, 400)
    } catch (e) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setShowProgressOverlay(false)
      setCreateProgress(0)
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler beim Erstellen des Lernsets.')
      setLastFailedAction('create')
      setIsGenerating(false)
    }
  }

  const handleRetryCreate = () => {
    setError(null)
    setLastFailedAction(null)
    handleCreateLernset()
  }

  const handleRetry = () => {
    if (lastFailedAction === 'chat') handleRetryChat()
    else if (lastFailedAction === 'create') handleRetryCreate()
  }

  return (
    <div className="ki-page ki-page--assistant">
      <header className="ki-header">
        <h1 className="page-title">KI-Lernset erstellen</h1>
      </header>

      {!online && (
        <div className="ki-offline-hinweis" role="status" aria-live="polite">
          <WifiOffIcon className="ki-offline-hinweis-icon" aria-hidden />
          <span>{OFFLINE_MESSAGE}</span>
        </div>
      )}

      <div className="ki-checklist ki-checklist--top" aria-label="Checkliste für Lernset-Infos">
        {checklist.map((item) => (
          <div key={item.id} className={`ki-checklist-item ${item.done ? 'ki-checklist-item--done' : ''}`}>
            <span className="ki-checklist-icon">{item.done ? '✓' : '○'}</span>
            <span className="ki-checklist-label">{item.label}</span>
          </div>
        ))}
      </div>

      <section className="ki-create-chat ki-create-chat--assistant" aria-label="KI-Lernset-Assistent (Chat)">
        <div className="ki-chat-box ki-chat-box--bubbles">
          {chatMessages.length === 0 ? (
            <p className="ki-chat-placeholder">
              Sag zuerst, in welchem Fach du ein Lernset erstellen möchtest. Danach fragt die KI nach Anzahl, Thema und Klassenstufe.
            </p>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`ki-chat-bubble ki-chat-bubble--${msg.role}`}>
                <p className="ki-chat-bubble-text">{msg.content}</p>
              </div>
            ))
          )}
          {isGenerating && <p className="ki-chat-loading">Die KI denkt kurz nach …</p>}
          <div ref={chatEndRef} />
        </div>

        {canCreate && (
          <button
            type="button"
            className="ki-btn ki-btn--primary ki-btn--wide"
            onClick={handleCreateLernset}
            disabled={isGenerating}
          >
            {isGenerating ? 'Lernset wird erstellt …' : 'Lernset erstellen'}
          </button>
        )}

        {error && (
          <div className="ki-error-block">
            <p className="ki-error">
              {error === OFFLINE_MESSAGE && (
                <>
                  <WifiOffIcon className="ki-error-offline-icon" aria-hidden />
                  <span className="ki-error-offline-label">Keine Verbindung:</span>{' '}
                </>
              )}
              {error}
            </p>
            <button type="button" className="ki-btn ki-btn--secondary ki-retry-btn" onClick={handleRetry} disabled={isGenerating}>
              Erneut versuchen
            </button>
          </div>
        )}
      </section>

      <div className="ki-input-bar">
        <div className="ki-input-mode-toggle" aria-label="Eingabemodus wählen">
          <button
            type="button"
            className={`ki-input-mode-toggle-btn ${
              inputMode === 'text' ? 'ki-input-mode-toggle-btn--active' : ''
            }`}
            onClick={() => setInputMode('text')}
          >
            Schreiben
          </button>
          <button
            type="button"
            className={`ki-input-mode-toggle-btn ${
              inputMode === 'speech' ? 'ki-input-mode-toggle-btn--active' : ''
            }`}
            onClick={() => setInputMode('speech')}
          >
            Diktieren
          </button>
        </div>
        {inputMode === 'text' && (
          <div className="ki-chat-input-row ki-chat-input-row--bubble">
            <div className="ki-input-bubble glass-card">
              <input
                type="text"
                className="ki-input ki-input--bubble input-glass"
                placeholder="Deine Nachricht …"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
              />
              <span className="ki-bubble-wave" aria-hidden="true" />
            </div>
            <button
              type="button"
              className="ki-btn ki-btn--primary ki-btn--send btn-glass"
              onClick={() => handleSend(inputValue)}
              disabled={isGenerating || !inputValue.trim()}
            >
              <ShareIcon width={20} height={20} />
            </button>
          </div>
        )}
        {inputMode === 'speech' && (
          <div className="ki-chat-input-row ki-chat-input-row--speech">
            {isListening ? (
              <VoiceBubble 
                isListening={isListening}
                transcript={speechTranscript || 'Ich höre dir zu…'}
              />
            ) : (
              <button
                type="button"
                className="ki-mic-btn btn-glass"
                onClick={startListening}
                disabled={isGenerating || !speechSupported}
              >
                {speechSupported ? (
                  <>
                    <MicrophoneIcon width={20} height={20} />
                    Diktieren starten
                  </>
                ) : (
                  <>
                    <CloseIcon width={20} height={20} />
                    {' Nicht unterstützt'}
                  </>
                )}
              </button>
            )}
            {!speechSupported && (
              <p className="ki-error">Dein Browser unterstützt die Diktierfunktion leider nicht.</p>
            )}
          </div>
        )}
      </div>

      {showProgressOverlay && (
        <div className="ki-progress-overlay" role="status" aria-live="polite" aria-label="Lernset wird erstellt">
          <div className="ki-progress-backdrop" aria-hidden="true" />
          <div className="ki-progress-card">
            <p className="ki-progress-title">Lernset wird erstellt …</p>
            <div className="ki-progress-bar-wrap">
              <div
                className="ki-progress-bar-fill"
                style={{ width: `${createProgress}%` }}
              />
            </div>
            <p className="ki-progress-percent">{createProgress} %</p>
          </div>
        </div>
      )}

    </div>
  )
}

export function KIPage() {
  const [sets, setSets] = useState<AiDeklinationSet[]>(() => getAiDeklinationSets())

  const refreshSets = useCallback(() => {
    setSets(getAiDeklinationSets())
  }, [])

  const handleDeleteSet = (id: string) => {
    if (!window.confirm('Dieses KI-Lernset wirklich löschen?')) return
    deleteAiDeklinationSet(id)
    refreshSets()
  }

  const aiVokabelSets = getLernsets()
    .filter((s) => s.source === 'ai')
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)

  const handleOpenAssistant = () => {
    if (typeof window === 'undefined') return
    window.location.assign('/ki/assistent')
  }

  return (
    <div className="ki-page">
      <header className="ki-header">
        <h1 className="page-title">KI-Bereich</h1>
        <button
          type="button"
          className="ki-btn ki-btn--primary"
          onClick={handleOpenAssistant}
        >
          Mit KI erstellen
        </button>
      </header>

      <p className="ki-intro">
        Hier siehst du deine mit KI erstellten Lernsets. Über „Mit KI erstellen“ öffnest du den KI-Assistenten in einer
        eigenen Seite und kannst neue Sets erzeugen.
      </p>

      <section aria-label="Deklinations-Lernsets (KI)">
        <h2 className="ki-section-heading">Deklinations-Lernsets (KI erstellt)</h2>
        {sets.length === 0 ? (
          <div className="ki-empty">
            <p className="ki-empty-text">Noch keine KI-Deklinationen vorhanden.</p>
          </div>
        ) : (
          <ul className="ki-set-list">
            {sets
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((set) => (
                <li key={set.id} className="ki-set-card">
                  <div className="ki-set-main">
                    <div className="ki-set-title-row">
                      <h2 className="ki-set-title">{set.title}</h2>
                      <span className="ki-set-chip">
                        {TYP_OPTIONS.find((t) => t.value === set.typ)?.label ?? set.typ}-Deklination
                      </span>
                    </div>
                    <p className="ki-set-subtitle">
                      {set.beispiel.tabelle.singular[0]} – {set.beispiel.tabelle.plural[0]}
                    </p>
                  </div>
                  <div className="ki-set-actions">
                    <button
                      type="button"
                      className="ki-btn-icon"
                      onClick={() => handleDeleteSet(set.id)}
                      aria-label="Lernset löschen"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section aria-label="Vokabel-Lernsets (KI)">
        <h2 className="ki-section-heading">Vokabel-Lernsets (KI erstellt)</h2>
        {aiVokabelSets.length === 0 ? (
          <div className="ki-empty">
            <p className="ki-empty-text">Noch keine KI-Vokabelsets vorhanden.</p>
          </div>
        ) : (
          <ul className="ki-set-list">
            {aiVokabelSets.map((set) => (
              <li key={set.id} className="ki-set-card">
                <div className="ki-set-main">
                  <div className="ki-set-title-row">
                    <h2 className="ki-set-title">{set.name}</h2>
                    <span className="ki-set-chip">Vokabeln</span>
                  </div>
                  <p className="ki-set-subtitle">{set.items.length} Einträge</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

