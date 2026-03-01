import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import {
  SUBSTANTIV_DEKLINATIONEN,
  ADJEKTIV_DEKLINATIONEN,
  FAELLE,
} from '../data/deklinationen'
import type { DeklinationBeispiel, AdjektivDeklTyp } from '../data/deklinationen'
import { getLernsets, getLernsetById, type VokabelEintrag } from '../data/lernsets'
import { addSession, addAttempt, DEKLINATION_LESSON_OPTIONS } from '../data/statistik'
import {
  VERBEN_BEISPIELE,
  VERBEN_IMPERATIV_LESSON_ID,
  VERBEN_PERFEKT_LESSON_ID,
  VERBEN_IMPERFEKT_LESSON_ID,
  VERBEN_PLUSQUAMPERFEKT_LESSON_ID,
  VERBEN_IMPERATIV_LESSON_NAME,
  VERBEN_PERFEKT_LESSON_NAME,
  VERBEN_IMPERFEKT_LESSON_NAME,
  VERBEN_PLUSQUAMPERFEKT_LESSON_NAME,
  type VerbenTyp,
} from '../data/verben'
import { SACHKUNDE_TOPICS, getSachkundeTopic, type SachkundeQuizFrage } from '../data/sachkunde'
import type { StatistikMode } from '../data/statistik'
import { loadLernenState, saveLernenState } from '../data/pageState'
import { getFavoritenIds, toggleFavorit } from '../data/favoriten'
import { updateStreak } from '../data/streak'
import { awardKronenForLesson } from '../data/kronen'
import { isOwned } from '../data/shop'
import {
  RefreshIcon,
  FalscheUebenIcon,
  ZurStartIcon,
  EyeIcon,
  BookOpenIcon,
  PenLineIcon,
  CardIcon,
  TableIcon,
  BookMarkIcon,
  LightbulbIcon,
  ZapIcon,
  BookIcon,
  TypeIcon,
  StarIcon,
  StarIconFilled,
  FlameIcon,
  CrownIcon,
  ShareIcon,
} from '../components/icons'
import { checkAchievementsAfterLesson, getAchievements } from '../data/achievements'
import { share, getShareResultText } from '../data/share'
import './LernenPage.css'

type View =
  | 'themen'
  | 'deklinationen'
  | 'verben'
  | 'substantive'
  | 'adjektive'
  | 'vokabeln'
  | 'sachkunde'

type DeklTyp = 'a' | 'o' | 'u' | 'konsonantisch'

type Step =
  | null
  | 'chooseMode'
  | 'anschauen'
  | 'lernen'
  | 'test'
  | 'karteikarten'
  | 'spiel'
  | 'wortpaare'
  | 'glücksrad'
  | 'rennen'
type QuizMode = 'lernen' | 'test'
type RennenDifficulty = 'leicht' | 'mittel' | 'schwer'

export interface QuizFrage {
  beispielIndex: number
  wortName: string
  fallIndex: number
  fall: string
  isPlural: boolean
  zahlLabel: string
  correctAnswer: string
  options: string[]
  correctIndex: number
}

export interface VokabelQuizFrage {
  vokabel: string
  uebersetzung: string
  options: string[]
  correctIndex: number
}

const THEMEN = [
  { id: 'deklinationen' as const, label: 'Deklinationen', active: true, Icon: TableIcon },
  { id: 'vokabeln' as const, label: 'Vokabeln', active: true, Icon: BookMarkIcon },
  { id: 'sachkunde' as const, label: 'Sachkunde', active: true, Icon: LightbulbIcon },
]

const DEKLINATIONEN_OPTIONEN = [
  { id: 'verben' as const, label: 'Verben', Icon: ZapIcon },
  { id: 'substantive' as const, label: 'Substantive', Icon: BookIcon },
  { id: 'adjektive' as const, label: 'Adjektive', Icon: TypeIcon },
]

const DEKLINATIONEN_TYPEN: { id: DeklTyp; label: string; Icon: typeof TypeIcon }[] = [
  { id: 'a', label: 'A-Deklination', Icon: TypeIcon },
  { id: 'o', label: 'O-Deklination', Icon: TypeIcon },
  { id: 'u', label: 'U-Deklination', Icon: TypeIcon },
  { id: 'konsonantisch', label: 'Konsonantische Deklination', Icon: TypeIcon },
]

const DEKLINATIONEN_TYPEN_ADJEKTIV: { id: AdjektivDeklTyp; label: string; Icon: typeof TypeIcon }[] = [
  { id: 'a-o', label: 'A-/O-Deklination (bonus)', Icon: TypeIcon },
  { id: 'konsonantisch', label: 'Konsonantische Deklination (acer)', Icon: TypeIcon },
]

const VERBEN_TYPEN: { id: VerbenTyp; label: string; Icon: typeof ZapIcon }[] = [
  { id: 'imperativ', label: 'Imperativ', Icon: ZapIcon },
  { id: 'perfekt', label: 'Perfekt', Icon: ZapIcon },
  { id: 'imperfekt', label: 'Imperfekt', Icon: ZapIcon },
  { id: 'plusquamperfekt', label: 'Plusquamperfekt', Icon: ZapIcon },
]

const LERNMODI = [
  { id: 'anschauen' as const, label: 'Anschauen', Icon: EyeIcon },
  { id: 'karteikarten' as const, label: 'Karteikarten', Icon: CardIcon },
  { id: 'lernen' as const, label: 'Lernen', Icon: BookOpenIcon },
  { id: 'test' as const, label: 'Test', Icon: PenLineIcon },
]

const VOKABEL_SPIELE = [
  { id: 'wortpaare' as const, label: 'Wortpaare finden', Icon: CardIcon },
  { id: 'glücksrad' as const, label: 'Glücksrad', Icon: ZapIcon },
  { id: 'rennen' as const, label: 'Autorennspiel', Icon: ZapIcon },
]

const FRAGEN_ANZAHL = 10
const OPTIONEN_ANZAHL = 4
const TRANSITION_MS = 420

function normalizeLatin(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function buildVokabelQuiz(items: VokabelEintrag[], count: number): VokabelQuizFrage[] {
  if (items.length < 2) return []
  const pool = shuffle([...items]).slice(0, Math.min(count, items.length))
  return pool.map((item) => {
    const correctAnswer = item.uebersetzung
    const others = items.filter((i) => i.uebersetzung !== correctAnswer).map((i) => i.uebersetzung)
    let wrongs = shuffle(others).slice(0, OPTIONEN_ANZAHL - 1)
    while (wrongs.length < OPTIONEN_ANZAHL - 1 && others.length > 0) {
      wrongs.push(others[wrongs.length % others.length])
    }
    const options = shuffle([correctAnswer, ...wrongs])
    const correctIndex = options.indexOf(correctAnswer)
    return { vokabel: item.vokabel, uebersetzung: item.uebersetzung, options, correctIndex }
  })
}

function buildQuiz(beispiele: DeklinationBeispiel[]): QuizFrage[] {
  const pool: { beispielIndex: number; caseIndex: number; isPlural: boolean }[] = []
  beispiele.forEach((_, bi) => {
    for (let c = 0; c < 6; c++) {
      pool.push({ beispielIndex: bi, caseIndex: c, isPlural: false })
      pool.push({ beispielIndex: bi, caseIndex: c, isPlural: true })
    }
  })
  const selected = shuffle(pool).slice(0, FRAGEN_ANZAHL)
  return selected.map(({ beispielIndex, caseIndex, isPlural }) => {
    const b = beispiele[beispielIndex]
    const wortName = b.name.split(' ')[0]
    const fall = FAELLE[caseIndex]
    const correctAnswer = isPlural ? b.tabelle.plural[caseIndex] : b.tabelle.singular[caseIndex]
    const zahlLabel = isPlural ? 'Plural' : 'Singular'
    const allForms = [...new Set([...b.tabelle.singular, ...b.tabelle.plural])].filter((f) => f !== correctAnswer)
    let wrongs = shuffle(allForms).slice(0, OPTIONEN_ANZAHL - 1)
    while (wrongs.length < OPTIONEN_ANZAHL - 1 && wrongs.length > 0) {
      wrongs.push(wrongs[wrongs.length % wrongs.length])
    }
    const options = shuffle([correctAnswer, ...wrongs])
    const correctIndex = options.indexOf(correctAnswer)
    return {
      beispielIndex,
      wortName,
      fallIndex: caseIndex,
      fall,
      isPlural,
      zahlLabel,
      correctAnswer,
      options,
      correctIndex,
    }
  })
}

function isVerbenTyp(x: unknown): x is VerbenTyp {
  return x === 'imperativ' || x === 'perfekt' || x === 'imperfekt' || x === 'plusquamperfekt'
}

function getVerbenLessonMeta(typ: VerbenTyp): { id: string; name: string } {
  if (typ === 'imperativ') return { id: VERBEN_IMPERATIV_LESSON_ID, name: VERBEN_IMPERATIV_LESSON_NAME }
  if (typ === 'perfekt') return { id: VERBEN_PERFEKT_LESSON_ID, name: VERBEN_PERFEKT_LESSON_NAME }
  if (typ === 'imperfekt') return { id: VERBEN_IMPERFEKT_LESSON_ID, name: VERBEN_IMPERFEKT_LESSON_NAME }
  return { id: VERBEN_PLUSQUAMPERFEKT_LESSON_ID, name: VERBEN_PLUSQUAMPERFEKT_LESSON_NAME }
}

function getVerbenFallLabel(typ: VerbenTyp): string {
  if (typ === 'imperativ') return 'Imperativ'
  if (typ === 'perfekt') return 'Perfekt'
  if (typ === 'imperfekt') return 'Imperfekt'
  return 'Plusquamperfekt'
}

function buildVerbenQuiz(typ: VerbenTyp): QuizFrage[] {
  const verben = VERBEN_BEISPIELE
  const fall = getVerbenFallLabel(typ)

  if (typ === 'imperativ') {
    const pool: { verbIndex: number; isPlural: boolean }[] = []
    verben.forEach((_, vi) => {
      pool.push({ verbIndex: vi, isPlural: false })
      pool.push({ verbIndex: vi, isPlural: true })
    })
    const selected = shuffle(pool).slice(0, FRAGEN_ANZAHL)
    const allForms = [...new Set(verben.flatMap((v) => [v.imperativSg, v.imperativPl]))]
    return selected.map(({ verbIndex, isPlural }) => {
      const v = verben[verbIndex]
      const wortName = v.infinitive
      const correctAnswer = isPlural ? v.imperativPl : v.imperativSg
      const zahlLabel = isPlural ? 'Plural' : 'Singular'
      const wrongs = shuffle(allForms.filter((f) => normalizeLatin(f) !== normalizeLatin(correctAnswer))).slice(0, OPTIONEN_ANZAHL - 1)
      while (wrongs.length < OPTIONEN_ANZAHL - 1) wrongs.push(wrongs[wrongs.length % wrongs.length])
      const options = shuffle([correctAnswer, ...wrongs])
      const correctIndex = options.indexOf(correctAnswer)
      return {
        beispielIndex: verbIndex,
        wortName,
        fallIndex: 0,
        fall,
        isPlural,
        zahlLabel,
        correctAnswer,
        options,
        correctIndex,
      }
    })
  }

  const indices = shuffle(verben.map((_, i) => i)).slice(0, FRAGEN_ANZAHL)
  const allForms = [...new Set(verben.map((v) => (typ === 'perfekt' ? v.perfekt : typ === 'imperfekt' ? v.imperfekt : v.plusquamperfekt)))]
  return indices.map((verbIndex) => {
    const v = verben[verbIndex]
    const wortName = v.infinitive
    const correctAnswer = typ === 'perfekt' ? v.perfekt : typ === 'imperfekt' ? v.imperfekt : v.plusquamperfekt
    const zahlLabel = '1. Pers. Sg.'
    const wrongs = shuffle(allForms.filter((f) => normalizeLatin(f) !== normalizeLatin(correctAnswer))).slice(0, OPTIONEN_ANZAHL - 1)
    while (wrongs.length < OPTIONEN_ANZAHL - 1) wrongs.push(wrongs[wrongs.length % wrongs.length])
    const options = shuffle([correctAnswer, ...wrongs])
    const correctIndex = options.indexOf(correctAnswer)
    return {
      beispielIndex: verbIndex,
      wortName,
      fallIndex: 0,
      fall,
      isPlural: false,
      zahlLabel,
      correctAnswer,
      options,
      correctIndex,
    }
  })
}

function buildVerbenKarteikarten(typ: VerbenTyp): { front: string; back: string }[] {
  const verben = VERBEN_BEISPIELE
  const fall = getVerbenFallLabel(typ)
  if (typ === 'imperativ') {
    return verben.map((v) => ({
      front: `Bilde ${fall} von: ${v.infinitive}`,
      back: `Sg: ${v.imperativSg} · Pl: ${v.imperativPl}`,
    }))
  }
  const label = `${fall} (1. Pers. Sg.)`
  return verben.map((v) => ({
    front: `Bilde ${label} von: ${v.infinitive}`,
    back: typ === 'perfekt' ? v.perfekt : typ === 'imperfekt' ? v.imperfekt : v.plusquamperfekt,
  }))
}

function quizFrageToVokabelQuizFrage(q: QuizFrage): VokabelQuizFrage {
  return {
    vokabel: `${q.fall} ${q.zahlLabel} von ${q.wortName}`,
    uebersetzung: q.correctAnswer,
    options: q.options,
    correctIndex: q.correctIndex,
  }
}

function sachkundeQuizFrageToVokabelQuizFrage(q: SachkundeQuizFrage): VokabelQuizFrage {
  return {
    vokabel: q.question,
    uebersetzung: q.options[q.correctIndex],
    options: q.options,
    correctIndex: q.correctIndex,
  }
}

function buildSachkundeWortpaare(
  topic: { gamePairs: { begriff: string; erklaerung: string }[] }
): { id: number; text: string; pairId: number }[] {
  const pairs = topic.gamePairs
  const count = Math.min(8, pairs.length)
  const used = shuffle([...pairs]).slice(0, count)
  const cards: { id: number; text: string; pairId: number }[] = []
  used.forEach((p, i) => {
    cards.push({ id: i * 2, text: p.begriff, pairId: i })
    cards.push({ id: i * 2 + 1, text: p.erklaerung, pairId: i })
  })
  return shuffle(cards)
}

function buildDeklinationWortpaare(beispiele: DeklinationBeispiel[]): { id: number; text: string; pairId: number }[] {
  const pairs: [string, string][] = []
  beispiele.forEach((b) => {
    FAELLE.forEach((fall, i) => {
      const sg = b.tabelle.singular[i]
      const pl = b.tabelle.plural[i]
      pairs.push([sg, `${fall} Singular`])
      pairs.push([pl, `${fall} Plural`])
    })
  })
  const used = shuffle([...pairs]).slice(0, Math.min(8, pairs.length))
  const cards: { id: number; text: string; pairId: number }[] = []
  used.forEach(([form, label], i) => {
    cards.push({ id: i * 2, text: form, pairId: i })
    cards.push({ id: i * 2 + 1, text: label, pairId: i })
  })
  return shuffle(cards)
}

function buildVerbenWortpaare(typ: VerbenTyp): { id: number; text: string; pairId: number }[] {
  const verben = VERBEN_BEISPIELE
  const fall = getVerbenFallLabel(typ)
  const pairs: [string, string][] = []
  if (typ === 'imperativ') {
    verben.forEach((v) => {
      pairs.push([v.imperativSg, `${fall} Singular`])
      pairs.push([v.imperativPl, `${fall} Plural`])
    })
  } else {
    const label = `${fall} (1. Pers. Sg.)`
    verben.forEach((v) => {
      const form = typ === 'perfekt' ? v.perfekt : typ === 'imperfekt' ? v.imperfekt : v.plusquamperfekt
      pairs.push([form, label])
    })
  }
  const used = shuffle([...pairs]).slice(0, Math.min(8, pairs.length))
  const cards: { id: number; text: string; pairId: number }[] = []
  used.forEach(([form, label], i) => {
    cards.push({ id: i * 2, text: form, pairId: i })
    cards.push({ id: i * 2 + 1, text: label, pairId: i })
  })
  return shuffle(cards)
}

function DeklinationTabellen({ beispiele }: { beispiele: DeklinationBeispiel[] }) {
  return (
    <div className="dekl-tabellen">
      {beispiele.map((b) => (
        <div key={b.name} className="dekl-beispiel-block">
          <h3 className="dekl-beispiel-title">{b.name}</h3>
          <div className="dekl-zwei-tabellen">
            <div className="dekl-tabelle-wrap">
              <h4 className="dekl-tabelle-ueberschrift">Mit Beispiel</h4>
              <table className="dekl-tabelle">
                <thead>
                  <tr>
                    <th></th>
                    <th>Singular</th>
                    <th>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  {FAELLE.map((_, i) => (
                    <tr key={i}>
                      <th>{FAELLE[i]}</th>
                      <td>{b.tabelle.singular[i]}</td>
                      <td>{b.tabelle.plural[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dekl-tabelle-wrap">
              <h4 className="dekl-tabelle-ueberschrift">Nur Endungen</h4>
              <table className="dekl-tabelle">
                <thead>
                  <tr>
                    <th></th>
                    <th>Singular</th>
                    <th>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  {FAELLE.map((_, i) => (
                    <tr key={i}>
                      <th>{FAELLE[i]}</th>
                      <td>{b.endungen.singular[i]}</td>
                      <td>{b.endungen.plural[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LernenPage() {
  const [storedState] = useState(() => loadLernenState())
  const [view, setView] = useState<View>(storedState.view as View)
  const [breadcrumb, setBreadcrumb] = useState<string[]>(storedState.breadcrumb)
  const [transitionFrom, setTransitionFrom] = useState<View | null>(null)
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [selectedTyp, setSelectedTyp] = useState<DeklTyp | AdjektivDeklTyp | VerbenTyp | null>(
    storedState.selectedTyp as DeklTyp | AdjektivDeklTyp | VerbenTyp | null
  )
  const [selectedLernsetId, setSelectedLernsetId] = useState<string | null>(storedState.selectedLernsetId)
  const [step, setStep] = useState<Step | null>(storedState.step ?? null)
  const [favoritenIds, setFavoritenIds] = useState<string[]>(() => getFavoritenIds())
  const [streakPopup, setStreakPopup] = useState<{ streak: number; updated: boolean } | null>(null)
  const [crownsEarned, setCrownsEarned] = useState<number | null>(null)
  const [showCrownRewardScreen, setShowCrownRewardScreen] = useState(false)
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([])
  const [shareResultFeedback, setShareResultFeedback] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [quizQuestions, setQuizQuestions] = useState<QuizFrage[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Array<number | string | null>>([])
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null)
  const [testInput, setTestInput] = useState('')
  const [karteikartenItems, setKarteikartenItems] = useState<{ front: string; back: string }[]>([])
  const [karteikartenIndex, setKarteikartenIndex] = useState(0)
  const [karteikartenResults, setKarteikartenResults] = useState<boolean[]>([])
  const [karteikartenFlipped, setKarteikartenFlipped] = useState(false)
  const [vokabelQuizQuestions, setVokabelQuizQuestions] = useState<VokabelQuizFrage[]>([])
  const [vokabelQuizIndex, setVokabelQuizIndex] = useState(0)
  const [vokabelQuizAnswers, setVokabelQuizAnswers] = useState<Array<number | string | null>>([])
  const [vokabelQuizMode, setVokabelQuizMode] = useState<'lernen' | 'test' | null>(null)
  const [vokabelTestInput, setVokabelTestInput] = useState('')
  const [selectedSachkundeTopicId, setSelectedSachkundeTopicId] = useState<string | null>(null)
  const [sachkundeQuizQuestions, setSachkundeQuizQuestions] = useState<SachkundeQuizFrage[]>([])
  const [sachkundeQuizIndex, setSachkundeQuizIndex] = useState(0)
  const [sachkundeQuizAnswers, setSachkundeQuizAnswers] = useState<Array<number | null>>([])
  const [sachkundeSpielCards, setSachkundeSpielCards] = useState<{ id: number; text: string; pairId: number }[]>([])
  const [sachkundeSpielFlipped, setSachkundeSpielFlipped] = useState<number[]>([])
  const [sachkundeSpielMatched, setSachkundeSpielMatched] = useState<number[]>([])
  const [wortpaareCards, setWortpaareCards] = useState<{ id: number; text: string; pairId: number }[]>([])
  const [wortpaareFlipped, setWortpaareFlipped] = useState<number[]>([])
  const [wortpaareMatched, setWortpaareMatched] = useState<number[]>([])
  const [wortpaareStartTime, setWortpaareStartTime] = useState<number>(0)
  const [wortpaareEndTime, setWortpaareEndTime] = useState<number | null>(null)
  const [wortpaareTimerSec, setWortpaareTimerSec] = useState(0)
  const [glücksradQuestions, setGlücksradQuestions] = useState<VokabelQuizFrage[]>([])
  const [glücksradIndex, setGlücksradIndex] = useState(0)
  const [glücksradAnswers, setGlücksradAnswers] = useState<Array<number | null>>([])
  const [glücksradSpinning, setGlücksradSpinning] = useState(false)
  const [glücksradLanded, setGlücksradLanded] = useState(false)
  const [glücksradRichtigAnimation, setGlücksradRichtigAnimation] = useState(false)
  const [rennenDifficulty, setRennenDifficulty] = useState<RennenDifficulty | null>(null)
  const [rennenQuestions, setRennenQuestions] = useState<VokabelQuizFrage[]>([])
  const [rennenIndex, setRennenIndex] = useState(0)
  const [rennenAnswers, setRennenAnswers] = useState<Array<number | null>>([])
  const [rennenCarProgress, setRennenCarProgress] = useState(0)
  const [rennenOpponentProgress, setRennenOpponentProgress] = useState(0)
  const sessionStartRef = useRef<number>(0)
  const statistikRecordedRef = useRef(false)

  const beispiele: DeklinationBeispiel[] =
    view === 'substantive' && selectedTyp && selectedTyp in SUBSTANTIV_DEKLINATIONEN
      ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
      : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
        ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
        : []

  useEffect(() => {
    if (transitionFrom === null) return
    const t = setTimeout(() => setTransitionFrom(null), TRANSITION_MS)
    return () => clearTimeout(t)
  }, [transitionFrom])

  const pairCountDerived = wortpaareCards.length / 2
  useEffect(() => {
    if (pairCountDerived < 1 || wortpaareMatched.length !== pairCountDerived) return
    setWortpaareEndTime((prev) => (prev == null ? Date.now() : prev))
  }, [wortpaareMatched.length, pairCountDerived])

  useEffect(() => {
    if (step !== 'wortpaare' || wortpaareCards.length === 0 || wortpaareMatched.length === pairCountDerived) return
    setWortpaareTimerSec(Math.floor((Date.now() - wortpaareStartTime) / 1000))
    const id = setInterval(() => {
      setWortpaareTimerSec(Math.floor((Date.now() - wortpaareStartTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [step, wortpaareCards.length, wortpaareMatched.length, wortpaareStartTime, pairCountDerived])

  useEffect(() => {
    if (step !== null && step !== 'chooseMode') return
    saveLernenState({
      view,
      breadcrumb,
      selectedTyp,
      selectedLernsetId,
      step: step === 'chooseMode' ? 'chooseMode' : null,
    })
  }, [view, breadcrumb, selectedTyp, selectedLernsetId, step])

  const goTo = (newView: View, newBreadcrumb: string[], isBack: boolean) => {
    if (newView === view && !isBack) return
    setDirection(isBack ? 'out' : 'in')
    setTransitionFrom(view)
    setView(newView)
    setBreadcrumb(newBreadcrumb)
    if (newView !== 'verben' && newView !== 'substantive' && newView !== 'adjektive' && newView !== 'vokabeln') {
      setSelectedTyp(null)
      setStep(null)
    }
    if (newView !== 'vokabeln') setSelectedLernsetId(null)
    if (newView !== 'sachkunde') setSelectedSachkundeTopicId(null)
  }

  const handleThemaClick = (id: string) => {
    if (id === 'deklinationen') goTo('deklinationen', ['Endungen'], false)
    if (id === 'vokabeln') goTo('vokabeln', ['Vokabeln'], false)
    if (id === 'sachkunde') goTo('sachkunde', ['Sachkunde'], false)
  }

  const handleDeklinationenOptionClick = (id: 'verben' | 'substantive' | 'adjektive') => {
    const labels: Record<string, string> = { verben: 'Verben', substantive: 'Substantive', adjektive: 'Adjektive' }
    goTo(id, ['Endungen', labels[id]], false)
  }

  const handleDeklinationTypClick = (typ: DeklTyp | AdjektivDeklTyp | VerbenTyp) => {
    setSelectedTyp(typ)
    setStep('chooseMode')
  }

  const selectedSachkundeTopic = selectedSachkundeTopicId ? getSachkundeTopic(selectedSachkundeTopicId) : null

  const handleSachkundeTopicClick = (topicId: string) => {
    setSelectedSachkundeTopicId(topicId)
    setStep('chooseMode')
  }

  const handleSachkundeModusClick = (modus: 'anschauen' | 'quiz' | 'spiel') => {
    const topic = selectedSachkundeTopic
    if (!topic) return
    if (modus === 'anschauen') {
      setStep('anschauen')
      return
    }
    if (modus === 'quiz') {
      const questions = shuffle([...topic.quiz]).slice(0, Math.min(10, topic.quiz.length))
      setSachkundeQuizQuestions(questions)
      setSachkundeQuizIndex(0)
      setSachkundeQuizAnswers(Array(questions.length).fill(null))
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('lernen')
      return
    }
    if (modus === 'spiel') {
      const pairs = topic.gamePairs
      const cards: { id: number; text: string; pairId: number }[] = []
      pairs.forEach((p, i) => {
        cards.push({ id: i * 2, text: p.begriff, pairId: i })
        cards.push({ id: i * 2 + 1, text: p.erklaerung, pairId: i })
      })
      setSachkundeSpielCards(shuffle(cards))
      setSachkundeSpielFlipped([])
      setSachkundeSpielMatched([])
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('spiel')
    }
  }

  const handleLernmodusClick = (
    id: 'anschauen' | 'lernen' | 'test' | 'karteikarten' | 'wortpaare' | 'glücksrad' | 'rennen'
  ) => {
    if (id === 'anschauen') {
      setStep('anschauen')
      return
    }
    if (id === 'wortpaare' && view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 4) {
      const items = selectedLernset.items
      const pairCount = Math.min(8, Math.floor(items.length / 2) * 2)
      const used = shuffle([...items]).slice(0, pairCount)
      const cards: { id: number; text: string; pairId: number }[] = []
      used.forEach((item, i) => {
        cards.push({ id: i * 2, text: item.vokabel, pairId: i })
        cards.push({ id: i * 2 + 1, text: item.uebersetzung, pairId: i })
      })
      setWortpaareCards(shuffle(cards))
      setWortpaareFlipped([])
      setWortpaareMatched([])
      setWortpaareStartTime(Date.now())
      setWortpaareEndTime(null)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('wortpaare')
      return
    }
    if (id === 'wortpaare' && view === 'verben' && isVerbenTyp(selectedTyp)) {
      const cards = buildVerbenWortpaare(selectedTyp)
      if (cards.length >= 4) {
        setWortpaareCards(cards)
        setWortpaareFlipped([])
        setWortpaareMatched([])
        setWortpaareStartTime(Date.now())
        setWortpaareEndTime(null)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('wortpaare')
      }
      return
    }
    if (id === 'wortpaare' && (view === 'substantive' || view === 'adjektive') && selectedTyp) {
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (examples.length > 0) {
        const cards = buildDeklinationWortpaare(examples)
        if (cards.length >= 4) {
          setWortpaareCards(cards)
          setWortpaareFlipped([])
          setWortpaareMatched([])
          setWortpaareStartTime(Date.now())
          setWortpaareEndTime(null)
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('wortpaare')
        }
      }
      return
    }
    if (id === 'glücksrad' && view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 2) {
      const questions = buildVokabelQuiz(selectedLernset.items, Math.min(10, selectedLernset.items.length))
      if (questions.length > 0) {
        setGlücksradQuestions(questions)
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(questions.length).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('glücksrad')
      }
      return
    }
    if (id === 'glücksrad' && view === 'verben' && isVerbenTyp(selectedTyp)) {
      const quiz = buildVerbenQuiz(selectedTyp)
      const questions = quiz.map(quizFrageToVokabelQuizFrage)
      if (questions.length > 0) {
        setGlücksradQuestions(questions.slice(0, 10))
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(Math.min(10, questions.length)).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('glücksrad')
      }
      return
    }
    if (id === 'glücksrad' && (view === 'substantive' || view === 'adjektive') && selectedTyp) {
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (examples.length > 0) {
        const quiz = buildQuiz(examples)
        const questions = quiz.map(quizFrageToVokabelQuizFrage)
        if (questions.length > 0) {
          setGlücksradQuestions(questions.slice(0, 10))
          setGlücksradIndex(0)
          setGlücksradAnswers(Array(Math.min(10, questions.length)).fill(null))
          setGlücksradSpinning(false)
          setGlücksradLanded(false)
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('glücksrad')
        }
      }
      return
    }
    if (id === 'rennen' && view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 2) {
      setRennenDifficulty(null)
      setRennenQuestions([])
      setRennenIndex(0)
      setRennenAnswers([])
      setRennenCarProgress(0)
      setRennenOpponentProgress(0)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('rennen')
      return
    }
    if (id === 'rennen' && (view === 'verben' || view === 'substantive' || view === 'adjektive') && selectedTyp) {
      setRennenDifficulty(null)
      setRennenQuestions([])
      setRennenIndex(0)
      setRennenAnswers([])
      setRennenCarProgress(0)
      setRennenOpponentProgress(0)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('rennen')
      return
    }
    if (id === 'wortpaare' && view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.gamePairs.length >= 2) {
      const cards = buildSachkundeWortpaare(selectedSachkundeTopic)
      if (cards.length >= 4) {
        setWortpaareCards(cards)
        setWortpaareFlipped([])
        setWortpaareMatched([])
        setWortpaareStartTime(Date.now())
        setWortpaareEndTime(null)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('wortpaare')
      }
      return
    }
    if (id === 'glücksrad' && view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2) {
      const questions = shuffle([...selectedSachkundeTopic.quiz])
        .slice(0, Math.min(10, selectedSachkundeTopic.quiz.length))
        .map(sachkundeQuizFrageToVokabelQuizFrage)
      if (questions.length > 0) {
        setGlücksradQuestions(questions)
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(questions.length).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('glücksrad')
      }
      return
    }
    if (id === 'rennen' && view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2) {
      setRennenDifficulty(null)
      setRennenQuestions([])
      setRennenIndex(0)
      setRennenAnswers([])
      setRennenCarProgress(0)
      setRennenOpponentProgress(0)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('rennen')
      return
    }
    if (id === 'karteikarten' && view === 'vokabeln' && selectedLernset && selectedLernset.items.length > 0) {
      setKarteikartenItems(shuffle(selectedLernset.items.map((i) => ({ front: i.vokabel, back: i.uebersetzung }))))
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('karteikarten')
      return
    }
    if (id === 'karteikarten' && view === 'verben' && isVerbenTyp(selectedTyp)) {
      const items = shuffle(buildVerbenKarteikarten(selectedTyp))
      setKarteikartenItems(items)
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('karteikarten')
      return
    }
    if (id === 'lernen' || id === 'test') {
      if (view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 2) {
        const questions = buildVokabelQuiz(selectedLernset.items, FRAGEN_ANZAHL)
        if (questions.length > 0) {
          setVokabelQuizQuestions(questions)
          setVokabelQuizIndex(0)
          setVokabelQuizAnswers(Array(questions.length).fill(null))
          setVokabelQuizMode(id)
          setVokabelTestInput('')
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep(id)
        }
        return
      }
      if (view === 'vokabeln') return
      if (view === 'verben' && isVerbenTyp(selectedTyp)) {
        const questions = buildVerbenQuiz(selectedTyp)
        setQuizQuestions(questions)
        setQuizIndex(0)
        setQuizAnswers(Array(questions.length).fill(null))
        setQuizMode(id)
        setTestInput('')
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep(id)
        return
      }
      if ((view !== 'substantive' && view !== 'adjektive') || !selectedTyp) return
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (!examples || examples.length === 0) return
      const questions = buildQuiz(examples)
      setQuizQuestions(questions)
      setQuizIndex(0)
      setQuizAnswers(Array(questions.length).fill(null))
      setQuizMode(id)
      setTestInput('')
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep(id)
    }
  }

  const handleBack = () => {
    if (step === 'anschauen') {
      setStep('chooseMode')
      return
    }
    if (step === 'karteikarten') {
      setStep('chooseMode')
      setKarteikartenItems([])
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      return
    }
    if (step === 'wortpaare' || step === 'glücksrad' || step === 'rennen') {
      setStep('chooseMode')
      setWortpaareCards([])
      setWortpaareFlipped([])
      setWortpaareMatched([])
      setGlücksradQuestions([])
      setGlücksradIndex(0)
      setGlücksradAnswers([])
      setRennenDifficulty(null)
      setRennenQuestions([])
      setRennenIndex(0)
      setRennenAnswers([])
      return
    }
    if (step === 'lernen' || step === 'test') {
      if (view === 'sachkunde') {
        setStep('chooseMode')
        setSachkundeQuizQuestions([])
        setSachkundeQuizIndex(0)
        setSachkundeQuizAnswers([])
        return
      }
      setStep('chooseMode')
      setQuizQuestions([])
      setQuizMode(null)
      setVokabelQuizQuestions([])
      setVokabelQuizIndex(0)
      setVokabelQuizAnswers([])
      setVokabelQuizMode(null)
      return
    }
    if (step === 'spiel' && view === 'sachkunde') {
      setStep('chooseMode')
      setSachkundeSpielCards([])
      setSachkundeSpielFlipped([])
      setSachkundeSpielMatched([])
      return
    }
    if (step === 'chooseMode') {
      setStep(null)
      setSelectedTyp(null)
      setSelectedLernsetId(null)
      setSelectedSachkundeTopicId(null)
      return
    }
    if (view === 'sachkunde' && step === null) {
      goTo('themen', [], true)
      return
    }
    if (view === 'deklinationen') goTo('themen', [], true)
    else if (view === 'vokabeln') goTo('themen', [], true)
    else if (view === 'verben' || view === 'substantive' || view === 'adjektive')
      goTo('deklinationen', ['Endungen'], true)
  }

  const handleQuizAnswer = (optionIndex: number) => {
    if (quizAnswers[quizIndex] !== null) return
    const newAnswers = [...quizAnswers]
    newAnswers[quizIndex] = optionIndex
    setQuizAnswers(newAnswers)
    if (quizIndex < quizQuestions.length - 1) {
      setTimeout(() => setQuizIndex(quizIndex + 1), 400)
    }
  }

  const handleTestPrüfen = () => {
    if (quizAnswers[quizIndex] !== null) return
    const answer = testInput.trim()
    const newAnswers = [...quizAnswers]
    newAnswers[quizIndex] = answer
    setQuizAnswers(newAnswers)
    setTestInput('')
    if (quizIndex < quizQuestions.length - 1) {
      setTimeout(() => setQuizIndex(quizIndex + 1), 400)
    }
  }

  const isAnswerCorrect = (q: QuizFrage, answer: number | string | null): boolean => {
    if (answer === null) return false
    if (quizMode === 'lernen') return answer === q.correctIndex
    return normalizeLatin(String(answer)) === normalizeLatin(q.correctAnswer)
  }

  const handleNochEinmal = () => {
    if (!quizMode) return
    if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      const questions = buildVerbenQuiz(selectedTyp)
      setQuizQuestions(questions)
      setQuizIndex(0)
      setQuizAnswers(Array(questions.length).fill(null))
      setTestInput('')
      return
    }
    if (beispiele.length === 0) return
    const questions = buildQuiz(beispiele)
    setQuizQuestions(questions)
    setQuizIndex(0)
    setQuizAnswers(Array(questions.length).fill(null))
    setTestInput('')
  }

  const handleFalscheWeiter = () => {
    const wrongIndices = quizQuestions
      .map((q, i) => (isAnswerCorrect(q, quizAnswers[i]) ? -1 : i))
      .filter((i) => i >= 0)
    if (wrongIndices.length === 0) {
      handleNochEinmal()
      return
    }
    const questions = wrongIndices.map((i) => quizQuestions[i])
    setQuizQuestions(questions)
    setQuizIndex(0)
    setQuizAnswers(Array(questions.length).fill(null))
    setTestInput('')
  }

  const handleZurStartseite = () => {
    setStep('chooseMode')
    setQuizQuestions([])
    setKarteikartenItems([])
    setKarteikartenIndex(0)
    setKarteikartenResults([])
    setVokabelQuizQuestions([])
    setVokabelQuizIndex(0)
    setVokabelQuizAnswers([])
    setVokabelQuizMode(null)
    setSachkundeQuizQuestions([])
    setSachkundeQuizIndex(0)
    setSachkundeQuizAnswers([])
    setSachkundeSpielCards([])
    setSachkundeSpielFlipped([])
    setSachkundeSpielMatched([])
    setWortpaareCards([])
    setWortpaareFlipped([])
    setWortpaareMatched([])
    setGlücksradQuestions([])
    setGlücksradIndex(0)
    setGlücksradAnswers([])
    setRennenDifficulty(null)
    setRennenQuestions([])
    setRennenIndex(0)
    setRennenAnswers([])
  }

  const isVokabelAnswerCorrect = (q: VokabelQuizFrage, answer: number | string | null): boolean => {
    if (answer === null) return false
    if (vokabelQuizMode === 'lernen') return answer === q.correctIndex
    return normalizeLatin(String(answer)) === normalizeLatin(q.uebersetzung)
  }

  const handleRennenDifficultyClick = (d: RennenDifficulty) => {
    let questions: VokabelQuizFrage[] = []
    if (view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 2) {
      questions = buildVokabelQuiz(selectedLernset.items, selectedLernset.items.length)
    } else if (view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2) {
      questions = selectedSachkundeTopic.quiz.map(sachkundeQuizFrageToVokabelQuizFrage)
    } else if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      questions = buildVerbenQuiz(selectedTyp).map(quizFrageToVokabelQuizFrage)
    } else if ((view === 'substantive' || view === 'adjektive') && selectedTyp) {
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (examples.length > 0) questions = buildQuiz(examples).map(quizFrageToVokabelQuizFrage)
    }
    if (questions.length === 0) return
    setRennenDifficulty(d)
    setRennenQuestions(questions)
    setRennenIndex(0)
    setRennenAnswers(Array(questions.length).fill(null))
    setRennenCarProgress(0)
    setRennenOpponentProgress(0)
  }

  const handleWortpaareCardClick = (cardIndex: number) => {
    const card = wortpaareCards[cardIndex]
    if (!card || wortpaareMatched.includes(card.pairId) || wortpaareFlipped.includes(cardIndex)) return
    if (wortpaareFlipped.length === 2) return
    const newFlipped = [...wortpaareFlipped, cardIndex]
    setWortpaareFlipped(newFlipped)
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped
      const cardA = wortpaareCards[a]
      const cardB = wortpaareCards[b]
      if (cardA?.pairId === cardB?.pairId) {
        setWortpaareMatched((m) => [...m, cardA.pairId])
        setWortpaareFlipped([])
      } else {
        setTimeout(() => setWortpaareFlipped([]), 700)
      }
    }
  }

  const handleGlücksradSpin = () => {
    if (glücksradSpinning || glücksradLanded) return
    setGlücksradSpinning(true)
    setGlücksradLanded(false)
    const spinDuration = 3000 + Math.random() * 2000
    setTimeout(() => {
      setGlücksradSpinning(false)
      setGlücksradLanded(true)
    }, spinDuration)
  }

  const handleGlücksradAnswer = (optionIndex: number) => {
    if (!glücksradLanded || glücksradAnswers[glücksradIndex] !== null) return
    const correct = optionIndex === glücksradQuestions[glücksradIndex].correctIndex
    const newAnswers = [...glücksradAnswers]
    newAnswers[glücksradIndex] = optionIndex
    setGlücksradAnswers(newAnswers)
    setGlücksradLanded(false)
    if (correct) {
      setGlücksradRichtigAnimation(true)
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } })
      setTimeout(() => setGlücksradRichtigAnimation(false), 1200)
    }
    if (glücksradIndex < glücksradQuestions.length - 1) {
      setTimeout(() => setGlücksradIndex(glücksradIndex + 1), 500)
    }
  }

  const handleRennenAnswer = (optionIndex: number) => {
    if (rennenAnswers[rennenIndex] !== null) return
    const q = rennenQuestions[rennenIndex]
    const correct = optionIndex === q.correctIndex
    const newAnswers = [...rennenAnswers]
    newAnswers[rennenIndex] = optionIndex
    setRennenAnswers(newAnswers)
    const n = rennenQuestions.length
    const carGain = 100 / n
    const oppGain = rennenDifficulty === 'leicht' ? (100 / n) * 0.65 : rennenDifficulty === 'mittel' ? (100 / n) * 0.85 : (100 / n) * 0.92
    setRennenCarProgress((p) => Math.min(100, p + (correct ? carGain : 0)))
    setRennenOpponentProgress((p) => Math.min(100, p + oppGain))
    if (rennenIndex < n - 1) {
      setTimeout(() => setRennenIndex(rennenIndex + 1), 600)
    }
  }

  const handleSachkundeSpielCardClick = (cardIndex: number) => {
    const card = sachkundeSpielCards[cardIndex]
    if (!card || sachkundeSpielMatched.includes(card.pairId) || sachkundeSpielFlipped.includes(cardIndex)) return
    if (sachkundeSpielFlipped.length === 2) return
    const newFlipped = [...sachkundeSpielFlipped, cardIndex]
    setSachkundeSpielFlipped(newFlipped)
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped
      const cardA = sachkundeSpielCards[a]
      const cardB = sachkundeSpielCards[b]
      if (cardA?.pairId === cardB?.pairId) {
        setSachkundeSpielMatched((m) => [...m, cardA.pairId])
        setSachkundeSpielFlipped([])
      } else {
        setTimeout(() => setSachkundeSpielFlipped([]), 800)
      }
    }
  }

  const handleSachkundeNochEinmal = () => {
    if (!selectedSachkundeTopic) return
    const questions = shuffle([...selectedSachkundeTopic.quiz]).slice(0, Math.min(10, selectedSachkundeTopic.quiz.length))
    setSachkundeQuizQuestions(questions)
    setSachkundeQuizIndex(0)
    setSachkundeQuizAnswers(Array(questions.length).fill(null))
  }

  const handleSachkundeFalscheWeiter = () => {
    const wrongIndices = sachkundeQuizQuestions
      .map((q, i) => (sachkundeQuizAnswers[i] === q.correctIndex ? -1 : i))
      .filter((i) => i >= 0)
    if (wrongIndices.length === 0) {
      handleSachkundeNochEinmal()
      return
    }
    const questions = wrongIndices.map((i) => sachkundeQuizQuestions[i])
    setSachkundeQuizQuestions(questions)
    setSachkundeQuizIndex(0)
    setSachkundeQuizAnswers(Array(questions.length).fill(null))
  }

  const handleSachkundeQuizAnswer = (optionIndex: number) => {
    if (sachkundeQuizAnswers[sachkundeQuizIndex] !== null) return
    const newAnswers = [...sachkundeQuizAnswers]
    newAnswers[sachkundeQuizIndex] = optionIndex
    setSachkundeQuizAnswers(newAnswers)
    if (sachkundeQuizIndex < sachkundeQuizQuestions.length - 1) {
      setTimeout(() => setSachkundeQuizIndex(sachkundeQuizIndex + 1), 400)
    }
  }

  const handleVokabelQuizAnswer = (optionIndex: number) => {
    if (vokabelQuizAnswers[vokabelQuizIndex] !== null) return
    const newAnswers = [...vokabelQuizAnswers]
    newAnswers[vokabelQuizIndex] = optionIndex
    setVokabelQuizAnswers(newAnswers)
    if (vokabelQuizIndex < vokabelQuizQuestions.length - 1) {
      setTimeout(() => setVokabelQuizIndex(vokabelQuizIndex + 1), 400)
    }
  }

  const handleVokabelTestPrüfen = () => {
    if (vokabelQuizAnswers[vokabelQuizIndex] !== null) return
    const answer = vokabelTestInput.trim()
    const newAnswers = [...vokabelQuizAnswers]
    newAnswers[vokabelQuizIndex] = answer
    setVokabelQuizAnswers(newAnswers)
    setVokabelTestInput('')
    if (vokabelQuizIndex < vokabelQuizQuestions.length - 1) {
      setTimeout(() => setVokabelQuizIndex(vokabelQuizIndex + 1), 400)
    }
  }

  const handleVokabelNochEinmal = () => {
    if (selectedLernset && selectedLernset.items.length >= 2) {
      const questions = buildVokabelQuiz(selectedLernset.items, FRAGEN_ANZAHL)
      if (questions.length > 0) {
        setVokabelQuizQuestions(questions)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(questions.length).fill(null))
        setVokabelTestInput('')
      }
    }
  }

  const handleVokabelFalscheWeiter = () => {
    const wrongIndices = vokabelQuizQuestions
      .map((q, i) => (isVokabelAnswerCorrect(q, vokabelQuizAnswers[i]) ? -1 : i))
      .filter((i) => i >= 0)
    if (wrongIndices.length === 0) {
      handleVokabelNochEinmal()
      return
    }
    const questions = wrongIndices.map((i) => vokabelQuizQuestions[i])
    setVokabelQuizQuestions(questions)
    setVokabelQuizIndex(0)
    setVokabelQuizAnswers(Array(questions.length).fill(null))
    setVokabelTestInput('')
  }

  const handleKarteikartenFlip = () => setKarteikartenFlipped(true)

  const handleKarteikartenAnswer = (correct: boolean) => {
    setKarteikartenResults((prev) => [...prev, correct])
    setKarteikartenFlipped(false)
    setKarteikartenIndex((prev) => prev + 1)
  }

  const handleKarteikartenNochEinmal = () => {
    if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      setKarteikartenItems(shuffle(buildVerbenKarteikarten(selectedTyp)))
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
      return
    }
    if (selectedLernset && selectedLernset.items.length > 0) {
      setKarteikartenItems(shuffle(selectedLernset.items.map((i) => ({ front: i.vokabel, back: i.uebersetzung }))))
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
    }
  }

  const handleKarteikartenFalscheWeiter = () => {
    const wrongItems = karteikartenItems.filter((_, i) => !karteikartenResults[i])
    if (wrongItems.length === 0) {
      handleKarteikartenNochEinmal()
      return
    }
    setKarteikartenItems(shuffle(wrongItems))
    setKarteikartenIndex(0)
    setKarteikartenResults([])
    setKarteikartenFlipped(false)
  }

  const handleWortpaareNochEinmal = () => {
    if (view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 4) {
      const items = selectedLernset.items
      const count = Math.min(8, Math.floor(items.length / 2) * 2)
      const used = shuffle([...items]).slice(0, count)
      const cards: { id: number; text: string; pairId: number }[] = []
      used.forEach((item, i) => {
        cards.push({ id: i * 2, text: item.vokabel, pairId: i })
        cards.push({ id: i * 2 + 1, text: item.uebersetzung, pairId: i })
      })
      setWortpaareCards(shuffle(cards))
      setWortpaareFlipped([])
      setWortpaareMatched([])
      setWortpaareStartTime(Date.now())
      setWortpaareEndTime(null)
      statistikRecordedRef.current = false
      return
    }
    if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      const cards = buildVerbenWortpaare(selectedTyp)
      if (cards.length >= 4) {
        setWortpaareCards(cards)
        setWortpaareFlipped([])
        setWortpaareMatched([])
        setWortpaareStartTime(Date.now())
        setWortpaareEndTime(null)
        statistikRecordedRef.current = false
      }
      return
    }
    if ((view === 'substantive' || view === 'adjektive') && selectedTyp) {
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (examples.length > 0) {
        const cards = buildDeklinationWortpaare(examples)
        if (cards.length >= 4) {
          setWortpaareCards(cards)
          setWortpaareFlipped([])
          setWortpaareMatched([])
          setWortpaareStartTime(Date.now())
          setWortpaareEndTime(null)
          statistikRecordedRef.current = false
        }
      }
      return
    }
    if (view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.gamePairs.length >= 2) {
      const cards = buildSachkundeWortpaare(selectedSachkundeTopic)
      if (cards.length >= 4) {
        setWortpaareCards(cards)
        setWortpaareFlipped([])
        setWortpaareMatched([])
        setWortpaareStartTime(Date.now())
        setWortpaareEndTime(null)
        statistikRecordedRef.current = false
      }
    }
  }

  const handleGlücksradNochEinmal = () => {
    if (view === 'vokabeln' && selectedLernset && selectedLernset.items.length >= 2) {
      const questions = buildVokabelQuiz(selectedLernset.items, Math.min(10, selectedLernset.items.length))
      if (questions.length > 0) {
        setGlücksradQuestions(questions)
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(questions.length).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        statistikRecordedRef.current = false
      }
      return
    }
    if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      const questions = buildVerbenQuiz(selectedTyp).map(quizFrageToVokabelQuizFrage).slice(0, 10)
      if (questions.length > 0) {
        setGlücksradQuestions(questions)
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(questions.length).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        statistikRecordedRef.current = false
      }
      return
    }
    if ((view === 'substantive' || view === 'adjektive') && selectedTyp) {
      const examples =
        view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
          ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
          : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
            ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
            : []
      if (examples.length > 0) {
        const questions = buildQuiz(examples).map(quizFrageToVokabelQuizFrage).slice(0, 10)
        if (questions.length > 0) {
          setGlücksradQuestions(questions)
          setGlücksradIndex(0)
          setGlücksradAnswers(Array(questions.length).fill(null))
          setGlücksradSpinning(false)
          setGlücksradLanded(false)
          statistikRecordedRef.current = false
        }
      }
      return
    }
    if (view === 'sachkunde' && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2) {
      const questions = shuffle([...selectedSachkundeTopic.quiz])
        .slice(0, Math.min(10, selectedSachkundeTopic.quiz.length))
        .map(sachkundeQuizFrageToVokabelQuizFrage)
      if (questions.length > 0) {
        setGlücksradQuestions(questions)
        setGlücksradIndex(0)
        setGlücksradAnswers(Array(questions.length).fill(null))
        setGlücksradSpinning(false)
        setGlücksradLanded(false)
        statistikRecordedRef.current = false
      }
    }
  }

  const handleRennenNochEinmal = () => {
    setRennenDifficulty(null)
    setRennenQuestions([])
    setRennenIndex(0)
    setRennenAnswers([])
    setRennenCarProgress(0)
    setRennenOpponentProgress(0)
    statistikRecordedRef.current = false
  }

  const isVerben = view === 'verben'
  const isSubstantive = view === 'substantive'
  const isAdjektive = view === 'adjektive'
  const isVokabeln = view === 'vokabeln'
  const typenList = isVerben ? VERBEN_TYPEN : isAdjektive ? DEKLINATIONEN_TYPEN_ADJEKTIV : DEKLINATIONEN_TYPEN
  const typLabel = selectedTyp
    ? (typenList.find((t) => t.id === selectedTyp)?.label ?? '')
    : ''
  const showTypGrid = (isVerben || isSubstantive || isAdjektive) && step === null
  const showChooseMode =
    ((isVerben || isSubstantive || isAdjektive) && step === 'chooseMode' && selectedTyp) ||
    (isVokabeln && step === 'chooseMode' && selectedLernsetId) ||
    (view === 'sachkunde' && step === 'chooseMode' && selectedSachkundeTopic)
  const showAnschauen =
    ((isVerben || isSubstantive || isAdjektive) && step === 'anschauen' && selectedTyp) ||
    (isVokabeln && step === 'anschauen' && selectedLernsetId) ||
    (view === 'sachkunde' && step === 'anschauen' && selectedSachkundeTopic)
  const lernsets = isVokabeln ? getLernsets() : []
  const selectedLernset = selectedLernsetId ? getLernsetById(selectedLernsetId) : null
  const showQuiz = (step === 'lernen' || step === 'test') && quizQuestions.length > 0 && view !== 'vokabeln' && view !== 'sachkunde'
  const allAnswered = showQuiz && quizAnswers.every((a) => a !== null)
  const showAuswertung = showQuiz && allAnswered
  const showVokabelnQuiz = view === 'vokabeln' && (step === 'lernen' || step === 'test') && vokabelQuizQuestions.length > 0
  const vokabelnQuizAllAnswered = showVokabelnQuiz && vokabelQuizAnswers.every((a) => a !== null)
  const showVokabelnQuizAuswertung = showVokabelnQuiz && vokabelnQuizAllAnswered
  const vokabelnPercent = showVokabelnQuizAuswertung && vokabelQuizQuestions.length > 0
    ? Math.round(
        (vokabelQuizQuestions.filter((q, i) => isVokabelAnswerCorrect(q, vokabelQuizAnswers[i])).length /
          vokabelQuizQuestions.length) *
          100
      )
    : 0
  const vokabelnFehler = showVokabelnQuizAuswertung
    ? vokabelQuizQuestions.filter((q, i) => !isVokabelAnswerCorrect(q, vokabelQuizAnswers[i]))
    : []
  const showSachkundeQuiz = view === 'sachkunde' && step === 'lernen' && sachkundeQuizQuestions.length > 0
  const sachkundeQuizAllAnswered = showSachkundeQuiz && sachkundeQuizAnswers.every((a) => a !== null)
  const showSachkundeQuizAuswertung = showSachkundeQuiz && sachkundeQuizAllAnswered
  const sachkundeCorrectCount = showSachkundeQuizAuswertung
    ? sachkundeQuizQuestions.filter((q, i) => sachkundeQuizAnswers[i] === q.correctIndex).length
    : 0
  const sachkundePercent = showSachkundeQuizAuswertung && sachkundeQuizQuestions.length > 0
    ? Math.round((sachkundeCorrectCount / sachkundeQuizQuestions.length) * 100)
    : 0
  const sachkundeFehler = showSachkundeQuizAuswertung
    ? sachkundeQuizQuestions.filter((q, i) => sachkundeQuizAnswers[i] !== q.correctIndex)
    : []
  const showKarteikarten = step === 'karteikarten' && karteikartenItems.length > 0
  const showKarteikartenAuswertung = showKarteikarten && karteikartenIndex >= karteikartenItems.length && karteikartenResults.length === karteikartenItems.length
  const karteikartenPercent = showKarteikartenAuswertung && karteikartenResults.length > 0
    ? Math.round((karteikartenResults.filter(Boolean).length / karteikartenResults.length) * 100)
    : 0
  const karteikartenFehler = showKarteikartenAuswertung
    ? karteikartenItems.filter((_, i) => !karteikartenResults[i])
    : []

  const pairCount = wortpaareCards.length / 2
  const showWortpaare = step === 'wortpaare' && wortpaareCards.length > 0
  const showWortpaareAuswertung = showWortpaare && wortpaareMatched.length === pairCount
  const wortpaarePercent = showWortpaareAuswertung ? 100 : 0

  const showGlücksrad = step === 'glücksrad' && glücksradQuestions.length > 0
  const glücksradAllAnswered = showGlücksrad && glücksradAnswers.every((a) => a !== null)
  const showGlücksradAuswertung = showGlücksrad && glücksradAllAnswered
  const glücksradCorrect = showGlücksradAuswertung
    ? glücksradQuestions.filter((q, i) => glücksradAnswers[i] === q.correctIndex).length
    : 0
  const glücksradPercent = showGlücksradAuswertung && glücksradQuestions.length > 0
    ? Math.round((glücksradCorrect / glücksradQuestions.length) * 100)
    : 0

  const showRennen = step === 'rennen' && rennenDifficulty != null && rennenQuestions.length > 0
  const rennenAllAnswered = showRennen && rennenAnswers.every((a) => a !== null)
  const showRennenAuswertung = showRennen && rennenAllAnswered
  const rennenCorrect = showRennenAuswertung
    ? rennenQuestions.filter((q, i) => rennenAnswers[i] === q.correctIndex).length
    : 0
  const rennenPercent = showRennenAuswertung && rennenQuestions.length > 0
    ? Math.round((rennenCorrect / rennenQuestions.length) * 100)
    : 0

  const correctCount = showAuswertung
    ? quizQuestions.filter((q, i) => isAnswerCorrect(q, quizAnswers[i])).length
    : 0
  const percent = showAuswertung ? Math.round((correctCount / quizQuestions.length) * 100) : 0
  const showAnyAuswertung =
    showAuswertung ||
    showKarteikartenAuswertung ||
    showVokabelnQuizAuswertung ||
    showSachkundeQuizAuswertung ||
    showWortpaareAuswertung ||
    showGlücksradAuswertung ||
    showRennenAuswertung
  const effectivePercent = showVokabelnQuizAuswertung
    ? vokabelnPercent
    : showKarteikartenAuswertung
      ? karteikartenPercent
      : showSachkundeQuizAuswertung
        ? sachkundePercent
        : showWortpaareAuswertung
          ? wortpaarePercent
          : showGlücksradAuswertung
            ? glücksradPercent
            : showRennenAuswertung
              ? rennenPercent
              : percent
  const [displayPercent, setDisplayPercent] = useState(0)
  const [ringStroke, setRingStroke] = useState(0)
  const hasFiredConfettiRef = useRef(false)
  const hasGoldenRing = isOwned('goldener-ring')
  const hasKonfettiExplosion = isOwned('konfetti-explosion')
  useEffect(() => {
    if (!showAnyAuswertung) {
      setDisplayPercent(0)
      setRingStroke(0)
      hasFiredConfettiRef.current = false
      return
    }
    const duration = 1200
    const circumference = 339.3
    const start = performance.now()
    const easeOutQuart = (t: number) => 1 - (1 - t) ** 4
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = easeOutQuart(t)
      setDisplayPercent(Math.round(effectivePercent * eased))
      setRingStroke((effectivePercent / 100) * circumference * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [showAnyAuswertung, effectivePercent])
  useEffect(() => {
    if (!showAnyAuswertung || effectivePercent !== 100 || hasFiredConfettiRef.current) return
    hasFiredConfettiRef.current = true
    const mega = hasKonfettiExplosion
    const t = setTimeout(() => {
      const defaults = { origin: { y: 0.6 }, zIndex: 9999 }
      const colors = ['#6b7cf6', '#8b9aff', '#a5b3ff', '#c4ceff', '#e0e5ff']
      const fire = () => {
        confetti({ ...defaults, spread: mega ? 90 : 70, startVelocity: mega ? 55 : 40, colors, ticks: mega ? 200 : 150 })
        confetti({ ...defaults, spread: mega ? 130 : 100, scalar: mega ? 1.4 : 1.2, colors: ['#6b7cf6', '#8b9aff', '#e0e5ff'] })
      }
      const count = mega ? 50 : 30
      const interval = mega ? 25 : 40
      for (let i = 0; i < count; i++) setTimeout(fire, i * interval)
      if (mega) {
        setTimeout(() => {
          confetti({ ...defaults, particleCount: 80, spread: 160, scalar: 1.3, colors: ['#ff9f43', '#ff6b35', '#6b7cf6'] })
        }, 200)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [showAnyAuswertung, effectivePercent, hasKonfettiExplosion])

  useEffect(() => {
    if (!showAnyAuswertung || statistikRecordedRef.current) return
    const now = Date.now()
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const minutes = Math.max(0, (now - sessionStartRef.current) / 60000)
    let lessonId: string
    let lessonName: string
    if (view === 'vokabeln' && selectedLernsetId && selectedLernset) {
      lessonId = selectedLernsetId
      lessonName = selectedLernset.name
    } else if (view === 'sachkunde' && selectedSachkundeTopicId && selectedSachkundeTopic) {
      lessonId = `sachkunde-${selectedSachkundeTopicId}`
      lessonName = selectedSachkundeTopic.title
    } else if (view === 'verben' && isVerbenTyp(selectedTyp)) {
      const meta = getVerbenLessonMeta(selectedTyp)
      lessonId = meta.id
      lessonName = meta.name
    } else if ((view === 'substantive' || view === 'adjektive') && selectedTyp) {
      lessonId = `${view}-${selectedTyp}`
      lessonName = DEKLINATION_LESSON_OPTIONS.find((o) => o.id === lessonId)?.name ?? typLabel
    } else return
    addSession(date, lessonId, lessonName, minutes)
    const mode: StatistikMode =
      showKarteikartenAuswertung
        ? 'karteikarten'
        : showVokabelnQuizAuswertung
          ? (vokabelQuizMode!)
          : showSachkundeQuizAuswertung || showWortpaareAuswertung || showGlücksradAuswertung || showRennenAuswertung
            ? 'lernen'
            : (quizMode!)
    addAttempt(lessonId, mode, effectivePercent)
    const newlyUnlocked = checkAchievementsAfterLesson(effectivePercent)
    if (newlyUnlocked.length > 0) setNewAchievementIds(newlyUnlocked)
    const streakResult = updateStreak()
    setStreakPopup({ streak: streakResult.streak, updated: streakResult.updated })
    const kronenResult = awardKronenForLesson(effectivePercent)
    setCrownsEarned(kronenResult.awarded)
    if (kronenResult.awarded > 0) setShowCrownRewardScreen(true)
    statistikRecordedRef.current = true
  }, [
    showAnyAuswertung,
    showKarteikartenAuswertung,
    showVokabelnQuizAuswertung,
    showSachkundeQuizAuswertung,
    showWortpaareAuswertung,
    showGlücksradAuswertung,
    showRennenAuswertung,
    view,
    selectedTyp,
    selectedLernsetId,
    selectedLernset,
    selectedSachkundeTopicId,
    selectedSachkundeTopic,
    typLabel,
    vokabelQuizMode,
    quizMode,
    effectivePercent,
  ])

  useEffect(() => {
    if (!showAnyAuswertung) {
      setStreakPopup(null)
      setCrownsEarned(null)
      setShowCrownRewardScreen(false)
      setNewAchievementIds([])
    }
  }, [showAnyAuswertung])

  const lessonNameForShare =
    (view === 'vokabeln' && selectedLernset ? selectedLernset.name : null) ??
    (view === 'sachkunde' && selectedSachkundeTopic ? selectedSachkundeTopic.title : null) ??
    (view === 'verben' && isVerbenTyp(selectedTyp) ? getVerbenLessonMeta(selectedTyp).name : null) ??
    ((view === 'substantive' || view === 'adjektive') && selectedTyp
      ? DEKLINATION_LESSON_OPTIONS.find((o) => o.id === `${view}-${selectedTyp}`)?.name ?? typLabel
      : null) ??
    'Lektion'

  const handleShareResult = async () => {
    setShareResultFeedback('idle')
    const ok = await share(getShareResultText(effectivePercent, lessonNameForShare))
    setShareResultFeedback(ok ? 'ok' : 'fail')
    if (ok) setTimeout(() => setShareResultFeedback('idle'), 2000)
  }

  const streakConfettiFiredRef = useRef(false)
  useEffect(() => {
    if (streakPopup?.updated && showAnyAuswertung && !streakConfettiFiredRef.current) {
      streakConfettiFiredRef.current = true
      const colors = ['#ff9f43', '#ff6b35', '#ee5a24', '#ffcc00', '#ffdd66']
      const t = setTimeout(() => {
        confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 }, colors, scalar: 1.1 })
        confetti({ particleCount: 20, spread: 100, origin: { y: 0.65, x: 0.2 }, colors, scalar: 0.9 })
        confetti({ particleCount: 20, spread: 100, origin: { y: 0.65, x: 0.8 }, colors, scalar: 0.9 })
      }, 600)
      return () => clearTimeout(t)
    }
    if (!showAnyAuswertung) streakConfettiFiredRef.current = false
  }, [streakPopup?.updated, showAnyAuswertung])

  const auswertungMessage =
    effectivePercent >= 100
      ? 'Perfekt!'
      : effectivePercent >= 80
        ? 'Sehr gut!'
        : effectivePercent >= 60
          ? 'Gut gemacht!'
          : 'Weiter so!'
  const auswertungClass =
    effectivePercent >= 100
      ? 'lernen-auswertung lernen-auswertung--perfect'
      : effectivePercent >= 80
        ? 'lernen-auswertung lernen-auswertung--gut'
        : 'lernen-auswertung'
  const fehler: { frage: QuizFrage; index: number }[] = showAuswertung
    ? quizQuestions
        .map((q, i) => (isAnswerCorrect(q, quizAnswers[i]) ? null : { frage: q, index: i }))
        .filter((x): x is { frage: QuizFrage; index: number } => x !== null)
    : []

  const isTransitioning = transitionFrom !== null
  const showExit = isTransitioning && transitionFrom

  const showCrownScreen =
    showAnyAuswertung && showCrownRewardScreen && crownsEarned != null && crownsEarned > 0
  const showAuswertungContent = showAnyAuswertung && !showCrownScreen

  const currentFrage = showQuiz && !showAuswertung ? quizQuestions[quizIndex] : null

  const showProgress =
    ((step === 'lernen' || step === 'test') && !showAuswertung && !showVokabelnQuizAuswertung && !showSachkundeQuizAuswertung && (showQuiz || showVokabelnQuiz || showSachkundeQuiz)) ||
    (showKarteikarten && !showKarteikartenAuswertung) ||
    (showWortpaare && !showWortpaareAuswertung) ||
    (showGlücksrad && !showGlücksradAuswertung) ||
    (showRennen && !showRennenAuswertung)

  const progressText =
    (step === 'lernen' || step === 'test') && !showAuswertung && !showVokabelnQuizAuswertung && !showSachkundeQuizAuswertung && (showQuiz || showVokabelnQuiz || showSachkundeQuiz)
      ? `Frage ${showSachkundeQuiz ? sachkundeQuizIndex + 1 : showVokabelnQuiz ? vokabelQuizIndex + 1 : quizIndex + 1} / ${showSachkundeQuiz ? sachkundeQuizQuestions.length : showVokabelnQuiz ? vokabelQuizQuestions.length : quizQuestions.length}`
      : showKarteikarten && !showKarteikartenAuswertung
        ? `Karte ${karteikartenIndex + 1} / ${karteikartenItems.length}`
        : showWortpaare && !showWortpaareAuswertung
          ? `Zeit: ${wortpaareTimerSec} s`
          : showGlücksrad && !showGlücksradAuswertung
            ? `Frage ${glücksradIndex + 1} / ${glücksradQuestions.length}`
            : showRennen && !showRennenAuswertung
              ? `Frage ${rennenIndex + 1} / ${rennenQuestions.length}`
              : ''

  return (
    <div className={`lernen-page ${view === 'themen' ? 'lernen-page--start' : ''}`}>
      <header className="lernen-header">
        <div className="lernen-header-left">
          {(breadcrumb.length > 0 || step !== null) && step !== 'lernen' && step !== 'test' && (
            <button type="button" className="lernen-back" onClick={handleBack} aria-label="Zurück">
              ‹ Zurück
            </button>
          )}
        </div>
        <h1 className="lernen-title">{view === 'themen' ? 'Lernen' : 'Lernmodus'}</h1>
        <div className="lernen-header-right">
          {showProgress && (
            <span className={`lernen-progress-pill ${showWortpaare && !showWortpaareAuswertung ? 'lernen-progress-pill--timer' : ''}`}>
              {progressText}
            </span>
          )}
        </div>
      </header>
      {view === 'themen' && (
        <p className="lernen-welcome">Wähle, was du üben möchtest</p>
      )}

      <div className="lernen-carousel">
        {showExit && (
          <div
            className={`lernen-screen lernen-screen--exit ${
              direction === 'in' ? 'lernen-screen--exit-left' : 'lernen-screen--exit-right'
            }`}
            key={`exit-${transitionFrom}`}
            aria-hidden
          >
            {transitionFrom === 'themen' && (
              <div className="lernen-grid lernen-grid--themen">
                {THEMEN.map((t, i) => (
                  <div
                    key={t.id}
                    className={`lernen-tile lernen-tile--thema ${t.active ? 'lernen-tile--active' : 'lernen-tile--disabled'}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {t.Icon && <t.Icon className="lernen-tile-icon" />}
                    <span className="lernen-tile-label">{t.label}</span>
                    {!t.active && <span className="lernen-tile-badge">Bald</span>}
                  </div>
                ))}
              </div>
            )}
            {transitionFrom === 'deklinationen' && (
              <div className="lernen-grid lernen-grid--options">
                {DEKLINATIONEN_OPTIONEN.map((opt, i) => (
                  <div key={opt.id} className="lernen-tile lernen-tile--option" style={{ animationDelay: `${i * 0.1}s` }}>
                    {opt.Icon && <opt.Icon className="lernen-tile-icon" />}
                    <span className="lernen-tile-label">{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
            {(transitionFrom === 'verben' || transitionFrom === 'substantive' || transitionFrom === 'adjektive') && (
              <div className="lernen-grid lernen-grid--typen">
                {(transitionFrom === 'verben'
                  ? VERBEN_TYPEN
                  : transitionFrom === 'adjektive'
                    ? DEKLINATIONEN_TYPEN_ADJEKTIV
                    : DEKLINATIONEN_TYPEN
                ).map((typ, i) => (
                  <div key={typ.id} className="lernen-tile lernen-tile--typ" style={{ animationDelay: `${i * 0.08}s` }}>
                    {typ.Icon && <typ.Icon className="lernen-tile-icon" />}
                    <span className="lernen-tile-label">{typ.label}</span>
                  </div>
                ))}
              </div>
            )}
            {transitionFrom === 'vokabeln' && (
              <div className="lernen-inhalt">
                <p className="lernen-modus-frage">Welches Lernset möchtest du?</p>
                <div className="lernen-grid lernen-grid--options">
                  {getLernsets().slice(0, 3).map((set) => (
                    <div key={set.id} className="lernen-tile lernen-tile--option">
                      <span className="lernen-tile-label">{set.name}</span>
                      <span className="lernen-tile-meta">{set.items.length} Vokabeln</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {transitionFrom === 'sachkunde' && (
              <div className="lernen-inhalt">
                <p className="lernen-modus-frage">Wähle ein Thema</p>
                <div className="lernen-grid lernen-grid--options">
                  {SACHKUNDE_TOPICS.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="lernen-tile lernen-tile--option">
                      <span className="lernen-tile-label">{topic.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`lernen-screen lernen-screen--current ${
            isTransitioning
              ? direction === 'in'
                ? 'lernen-screen--enter-from-right'
                : 'lernen-screen--enter-from-left'
              : 'lernen-screen--visible'
          }`}
          key={view}
        >
          {view === 'themen' && (
            <div className="lernen-grid lernen-grid--themen">
              {THEMEN.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lernen-tile lernen-tile--thema ${t.active ? 'lernen-tile--active' : 'lernen-tile--disabled'}`}
                  onClick={() => t.active && handleThemaClick(t.id)}
                  disabled={!t.active}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {t.Icon && <t.Icon className="lernen-tile-icon" />}
                  <span className="lernen-tile-label">{t.label}</span>
                  {!t.active && <span className="lernen-tile-badge">Bald</span>}
                </button>
              ))}
            </div>
          )}
          {view === 'deklinationen' && (
            <div className="lernen-grid lernen-grid--options">
              {DEKLINATIONEN_OPTIONEN.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  className="lernen-tile lernen-tile--option"
                  onClick={() => handleDeklinationenOptionClick(opt.id)}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {opt.Icon && <opt.Icon className="lernen-tile-icon" />}
                  <span className="lernen-tile-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {view === 'sachkunde' && step === null && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Wähle ein Thema</p>
              <div className="lernen-grid lernen-grid--options">
                {SACHKUNDE_TOPICS.map((topic, i) => (
                  <button
                    key={topic.id}
                    type="button"
                    className="lernen-tile lernen-tile--option"
                    onClick={() => handleSachkundeTopicClick(topic.id)}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <span className="lernen-tile-label">{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'vokabeln' && !selectedLernsetId && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Welches Lernset möchtest du?</p>
              {lernsets.length === 0 ? (
                <p className="lernen-placeholder">Noch keine Lernsets vorhanden. Erstelle zuerst unter „Neu“ ein Set.</p>
              ) : (
                <div className="lernen-grid lernen-grid--options">
                  {lernsets.map((set, i) => {
                    const isFav = favoritenIds.includes(set.id)
                    return (
                      <button
                        key={set.id}
                        type="button"
                        className="lernen-tile lernen-tile--option lernen-tile--with-star"
                        onClick={() => {
                          setSelectedLernsetId(set.id)
                          setStep('chooseMode')
                        }}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="lernen-tile-label">{set.name}</span>
                        <span className="lernen-tile-meta">{set.items.length} Vokabeln</span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="lernen-star-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorit(set.id)
                            setFavoritenIds(getFavoritenIds())
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleFavorit(set.id)
                              setFavoritenIds(getFavoritenIds())
                            }
                          }}
                          aria-label={isFav ? `${set.name} aus Favoriten entfernen` : `${set.name} zu Favoriten hinzufügen`}
                          title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                          {isFav ? (
                            <StarIconFilled className="lernen-star-icon lernen-star-icon--filled" />
                          ) : (
                            <StarIcon className="lernen-star-icon" />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {(view === 'verben' || view === 'substantive' || view === 'adjektive' || (view === 'vokabeln' && selectedLernsetId) || (view === 'sachkunde' && selectedSachkundeTopicId)) && (
            <div key={`content-${view}-${step}`} className="lernen-inhalt">
              {showTypGrid && (
                <div className="lernen-grid lernen-grid--typen">
                  {typenList.map((typ, i) => {
                    const deklinationId = `${view}-${typ.id}` as string
                    const isFav = favoritenIds.includes(deklinationId)
                    return (
                      <button
                        key={typ.id}
                        type="button"
                        className="lernen-tile lernen-tile--typ lernen-tile--with-star"
                        onClick={() => handleDeklinationTypClick(typ.id)}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        {typ.Icon && <typ.Icon className="lernen-tile-icon" />}
                        <span className="lernen-tile-label">{typ.label}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="lernen-star-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorit(deklinationId)
                            setFavoritenIds(getFavoritenIds())
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleFavorit(deklinationId)
                              setFavoritenIds(getFavoritenIds())
                            }
                          }}
                          aria-label={isFav ? `${typ.label} aus Favoriten entfernen` : `${typ.label} zu Favoriten hinzufügen`}
                          title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                          {isFav ? (
                            <StarIconFilled className="lernen-star-icon lernen-star-icon--filled" />
                          ) : (
                            <StarIcon className="lernen-star-icon" />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {showChooseMode && (
                <div className="lernen-modus-auswahl">
                  <p className="lernen-modus-frage">
                    {view === 'sachkunde' ? 'Was möchtest du machen?' : 'Welchen Lernmodus möchtest du?'}
                  </p>
                  <div className="lernen-grid lernen-grid--options">
                    {view === 'sachkunde' ? (
                      <>
                        <button
                          type="button"
                          className="lernen-tile lernen-tile--option"
                          onClick={() => handleSachkundeModusClick('anschauen')}
                          style={{ animationDelay: '0s' }}
                        >
                          <EyeIcon className="lernen-tile-icon" />
                          <span className="lernen-tile-label">Bericht lesen</span>
                        </button>
                        <button
                          type="button"
                          className="lernen-tile lernen-tile--option"
                          onClick={() => handleSachkundeModusClick('quiz')}
                          style={{ animationDelay: '0.1s' }}
                        >
                          <PenLineIcon className="lernen-tile-icon" />
                          <span className="lernen-tile-label">Quiz</span>
                        </button>
                        <button
                          type="button"
                          className="lernen-tile lernen-tile--option"
                          onClick={() => handleSachkundeModusClick('spiel')}
                          style={{ animationDelay: '0.2s' }}
                        >
                          <CardIcon className="lernen-tile-icon" />
                          <span className="lernen-tile-label">Paare finden</span>
                        </button>
                      </>
                    ) : (
                      LERNMODI.map((m, i) => (
                        <button
                          key={m.id}
                          type="button"
                          className="lernen-tile lernen-tile--option"
                          onClick={() => handleLernmodusClick(m.id)}
                          disabled={
                            (m.id === 'lernen' || m.id === 'test') &&
                            (view === 'vokabeln'
                              ? !selectedLernsetId || !selectedLernset || selectedLernset.items.length < 2
                              : (view !== 'substantive' && view !== 'adjektive' && view !== 'verben') ||
                                (view === 'verben' ? !isVerbenTyp(selectedTyp) : !selectedTyp)) ||
                            (m.id === 'karteikarten' &&
                              !(
                                (view === 'vokabeln' && selectedLernset && selectedLernset.items.length > 0) ||
                                (view === 'verben' && isVerbenTyp(selectedTyp))
                              ))
                          }
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {m.Icon && <m.Icon className="lernen-tile-icon" />}
                          <span className="lernen-tile-label">{m.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {((view === 'vokabeln' && selectedLernsetId) ||
                    ((view === 'verben' || view === 'substantive' || view === 'adjektive') && selectedTyp) ||
                    (view === 'sachkunde' && selectedSachkundeTopic)) ? (
                    <>
                      <p className="lernen-modus-spiele-label">Spiele</p>
                      <div className="lernen-grid lernen-grid--options lernen-grid--spiele">
                        {VOKABEL_SPIELE.map((s, i) => {
                          const isVokabeln = view === 'vokabeln'
                          const isSachkunde = view === 'sachkunde'
                          const deklWortpaareOk =
                            view === 'verben' && isVerbenTyp(selectedTyp)
                              ? buildVerbenWortpaare(selectedTyp).length >= 4
                              : (view === 'substantive' || view === 'adjektive') && selectedTyp
                                ? (() => {
                                    const ex =
                                      view === 'substantive' && selectedTyp in SUBSTANTIV_DEKLINATIONEN
                                        ? SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp]
                                        : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
                                          ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
                                          : []
                                    return ex.length > 0 && buildDeklinationWortpaare(ex).length >= 4
                                  })()
                                : false
                          const sachkundeWortpaareOk =
                            isSachkunde && selectedSachkundeTopic && selectedSachkundeTopic.gamePairs.length >= 2
                          const sachkundeQuizOk =
                            isSachkunde && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2
                          const disabled = isVokabeln
                            ? (s.id === 'wortpaare' && (!selectedLernset || selectedLernset.items.length < 4)) ||
                              (s.id !== 'wortpaare' && (!selectedLernset || selectedLernset.items.length < 2))
                            : isSachkunde
                              ? (s.id === 'wortpaare' && !sachkundeWortpaareOk) ||
                                (s.id !== 'wortpaare' && !sachkundeQuizOk)
                              : s.id === 'wortpaare'
                                ? !deklWortpaareOk
                                : false
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className="lernen-tile lernen-tile--option"
                              onClick={() => handleLernmodusClick(s.id)}
                              disabled={disabled}
                              style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                            >
                              {s.Icon && <s.Icon className="lernen-tile-icon" />}
                              <span className="lernen-tile-label">{s.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {showAnschauen && (
                <div className="lernen-anschauen">
                  <h2 className="lernen-anschauen-title">
                    {view === 'sachkunde' && selectedSachkundeTopic
                      ? selectedSachkundeTopic.title
                      : isVokabeln && selectedLernset
                        ? selectedLernset.name
                        : typLabel}{' '}
                    – Anschauen
                  </h2>
                  {isVokabeln && selectedLernset ? (
                    <div className="lernen-vokabeln-tabelle-wrap">
                      <table className="lernen-vokabeln-tabelle">
                        <thead>
                          <tr>
                            <th>Latein</th>
                            <th>Deutsch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLernset.items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.vokabel}</td>
                              <td>{item.uebersetzung}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (isSubstantive || isAdjektive) && beispiele.length > 0 ? (
                    <DeklinationTabellen beispiele={beispiele} />
                  ) : isVerben && isVerbenTyp(selectedTyp) ? (
                    selectedTyp === 'imperativ' ? (
                      <div className="lernen-imperativ-tabelle-wrap">
                        <table className="lernen-vokabeln-tabelle">
                          <thead>
                            <tr>
                              <th>Infinitiv</th>
                              <th>Deutsch</th>
                              <th>Imperativ Singular</th>
                              <th>Imperativ Plural</th>
                            </tr>
                          </thead>
                          <tbody>
                            {VERBEN_BEISPIELE.map((v, i) => (
                              <tr key={i}>
                                <td>{v.infinitive}</td>
                                <td>{v.uebersetzung}</td>
                                <td>{v.imperativSg}</td>
                                <td>{v.imperativPl}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="lernen-imperativ-tabelle-wrap">
                        <table className="lernen-vokabeln-tabelle">
                          <thead>
                            <tr>
                              <th>Infinitiv</th>
                              <th>Deutsch</th>
                              <th>{getVerbenFallLabel(selectedTyp)} (1. Pers. Sg.)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {VERBEN_BEISPIELE.map((v, i) => (
                              <tr key={i}>
                                <td>{v.infinitive}</td>
                                <td>{v.uebersetzung}</td>
                                <td>
                                  {selectedTyp === 'perfekt'
                                    ? v.perfekt
                                    : selectedTyp === 'imperfekt'
                                      ? v.imperfekt
                                      : v.plusquamperfekt}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : view === 'sachkunde' && selectedSachkundeTopic ? (
                    <div className="lernen-sachkunde-bericht">
                      <div className="lernen-sachkunde-bericht-text">{selectedSachkundeTopic.report}</div>
                    </div>
                  ) : (
                    <p className="lernen-placeholder">Weitere Inhalte kommen später.</p>
                  )}
                </div>
              )}

              {showSachkundeQuiz && !showSachkundeQuizAuswertung && sachkundeQuizQuestions[sachkundeQuizIndex] && (
                <div className="lernen-quiz">
                  <p className="lernen-quiz-frage-text">
                    {sachkundeQuizQuestions[sachkundeQuizIndex].question}
                  </p>
                  <div className="lernen-quiz-optionen">
                    {sachkundeQuizQuestions[sachkundeQuizIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`lernen-quiz-option ${
                          sachkundeQuizAnswers[sachkundeQuizIndex] === i
                            ? sachkundeQuizAnswers[sachkundeQuizIndex] === sachkundeQuizQuestions[sachkundeQuizIndex].correctIndex
                              ? 'lernen-quiz-option--richtig'
                              : 'lernen-quiz-option--falsch'
                            : ''
                        }`}
                        onClick={() => handleSachkundeQuizAnswer(i)}
                        disabled={sachkundeQuizAnswers[sachkundeQuizIndex] !== null}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view === 'sachkunde' && step === 'spiel' && sachkundeSpielCards.length > 0 && selectedSachkundeTopic && (
                <div className="lernen-sachkunde-spiel">
                  <p className="lernen-sachkunde-spiel-anleitung">
                    Finde die passenden Paare: Klicke nacheinander auf die zwei zusammengehörigen Karten (Begriff und Erklärung).
                  </p>
                  <div className="lernen-sachkunde-spiel-grid">
                    {sachkundeSpielCards.map((card, idx) => {
                      const isSelected = sachkundeSpielFlipped.includes(idx)
                      const isMatched = sachkundeSpielMatched.includes(card.pairId)
                      return (
                        <button
                          key={card.id}
                          type="button"
                          className={`lernen-sachkunde-spiel-karte ${isSelected ? 'lernen-sachkunde-spiel-karte--ausgewaehlt' : ''} ${isMatched ? 'lernen-sachkunde-spiel-karte--getroffen' : ''}`}
                          onClick={() => handleSachkundeSpielCardClick(idx)}
                          disabled={sachkundeSpielFlipped.length === 2 && !isSelected}
                        >
                          <span className="lernen-sachkunde-spiel-karte-text">{card.text}</span>
                        </button>
                      )
                    })}
                  </div>
                  {sachkundeSpielMatched.length === selectedSachkundeTopic.gamePairs.length && (
                    <div className="lernen-sachkunde-spiel-fertig">
                      <p className="lernen-sachkunde-spiel-fertig-text">Alle Paare gefunden!</p>
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--3" onClick={handleZurStartseite}>
                        <ZurStartIcon />
                        <span>Zurück zum Thema</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === 'rennen' && rennenDifficulty == null && (
                <div className="lernen-rennen-schwierigkeit">
                  <p className="lernen-modus-frage">Wie schwer soll das Rennen sein?</p>
                  <div className="lernen-rennen-difficulty-buttons">
                    {(['leicht', 'mittel', 'schwer'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="lernen-tile lernen-tile--option"
                        onClick={() => handleRennenDifficultyClick(d)}
                      >
                        <span className="lernen-tile-label">
                          {d === 'leicht' ? 'Leicht' : d === 'mittel' ? 'Mittel' : 'Schwer'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showWortpaare && !showWortpaareAuswertung && (
                <div className="lernen-wortpaare">
                  <p className="lernen-wortpaare-anleitung">
                    Finde die passenden Paare: Klicke nacheinander auf die zwei zusammengehörigen Wörter. So schnell wie möglich!
                  </p>
                  <div className="lernen-wortpaare-grid">
                    {wortpaareCards.map((card, idx) => {
                      const isSelected = wortpaareFlipped.includes(idx)
                      const isMatched = wortpaareMatched.includes(card.pairId)
                      return (
                        <button
                          key={card.id}
                          type="button"
                          className={`lernen-wortpaare-karte lernen-wortpaare-karte--offen ${isSelected ? 'lernen-wortpaare-karte--ausgewaehlt' : ''} ${isMatched ? 'lernen-wortpaare-karte--getroffen' : ''}`}
                          onClick={() => handleWortpaareCardClick(idx)}
                          disabled={wortpaareFlipped.length === 2 && !isSelected}
                        >
                          <span className="lernen-wortpaare-karte-text">{card.text}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {showRennen && !showRennenAuswertung && rennenQuestions[rennenIndex] && (
                <div className="lernen-rennen">
                  <div className="lernen-rennen-track-wrap">
                    <div className="lernen-rennen-track">
                      <div className="lernen-rennen-track-lane lernen-rennen-track-lane--user">
                        <div
                          className="lernen-rennen-auto lernen-rennen-auto--user"
                          style={{ left: `${rennenCarProgress}%` }}
                        >
                          <svg viewBox="0 0 48 24" className="lernen-rennen-auto-svg" aria-hidden>
                            <path fill="currentColor" d="M8 14h4v4H8v-4zm20 0h4v4h-4v-4zM10 10h28v6H10v-6zM6 12v2H2v-2h4zm40 0v2h-4v-2h4zM8 8l2-4h20l2 4H8z" />
                          </svg>
                          <span className="lernen-rennen-auto-label">Du</span>
                        </div>
                      </div>
                      <div className="lernen-rennen-track-mitte" />
                      <div className="lernen-rennen-track-lane lernen-rennen-track-lane--gegner">
                        <div
                          className="lernen-rennen-auto lernen-rennen-auto--gegner"
                          style={{ left: `${rennenOpponentProgress}%` }}
                        >
                          <svg viewBox="0 0 48 24" className="lernen-rennen-auto-svg" aria-hidden>
                            <path fill="currentColor" d="M8 14h4v4H8v-4zm20 0h4v4h-4v-4zM10 10h28v6H10v-6zM6 12v2H2v-2h4zm40 0v2h-4v-2h4zM8 8l2-4h20l2 4H8z" />
                          </svg>
                          <span className="lernen-rennen-auto-label">Gegner</span>
                        </div>
                      </div>
                    </div>
                    <div className="lernen-rennen-ziel" aria-hidden>
                      <span className="lernen-rennen-ziel-flag">🏁</span>
                    </div>
                  </div>
                  <div className="lernen-quiz">
                    <p className="lernen-quiz-frage-text">
                      {view === 'vokabeln'
                        ? <>Was bedeutet <strong>{rennenQuestions[rennenIndex].vokabel}</strong>?</>
                        : view === 'sachkunde'
                          ? <strong>{rennenQuestions[rennenIndex].vokabel}</strong>
                          : <>Wie lautet <strong>{rennenQuestions[rennenIndex].vokabel}</strong>?</>}
                    </p>
                    <div className="lernen-quiz-optionen">
                      {rennenQuestions[rennenIndex].options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`lernen-quiz-option ${
                            rennenAnswers[rennenIndex] === i
                              ? rennenAnswers[rennenIndex] === rennenQuestions[rennenIndex].correctIndex
                                ? 'lernen-quiz-option--richtig'
                                : 'lernen-quiz-option--falsch'
                              : ''
                          }`}
                          onClick={() => handleRennenAnswer(i)}
                          disabled={rennenAnswers[rennenIndex] !== null}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showGlücksrad && !showGlücksradAuswertung && (
                <div className="lernen-glücksrad">
                  {!glücksradLanded ? (
                    <>
                      <div className={`lernen-glücksrad-rad ${glücksradSpinning ? 'lernen-glücksrad-rad--spinning' : ''}`}>
                        <div className="lernen-glücksrad-segmente">
                          {glücksradQuestions.slice(0, 8).map((q, i) => {
                            const angle = (i + 0.5) * (360 / Math.min(8, glücksradQuestions.length))
                            return (
                              <span
                                key={i}
                                className="lernen-glücksrad-segment-label"
                                style={{
                                  transform: `rotate(${angle}deg) translateY(-72px) rotate(-${angle}deg)`,
                                }}
                              >
                                {q.vokabel}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="lernen-glücksrad-drehen lernen-auswertung-btn"
                        onClick={handleGlücksradSpin}
                        disabled={glücksradSpinning}
                      >
                        Drehen
                      </button>
                    </>
                  ) : (
                    <div className="lernen-glücksrad-frage">
                      {glücksradRichtigAnimation && (
                        <div className="lernen-glücksrad-richtig" aria-hidden>
                          <span className="lernen-glücksrad-richtig-icon">✓</span>
                          <span className="lernen-glücksrad-richtig-text">Richtig!</span>
                        </div>
                      )}
                      <p className="lernen-quiz-frage-text">
                        {view === 'vokabeln'
                          ? <>Was bedeutet <strong>{glücksradQuestions[glücksradIndex]?.vokabel}</strong>?</>
                          : view === 'sachkunde'
                            ? <strong>{glücksradQuestions[glücksradIndex]?.vokabel}</strong>
                            : <>Wie lautet <strong>{glücksradQuestions[glücksradIndex]?.vokabel}</strong>?</>}
                      </p>
                      <div className="lernen-quiz-optionen">
                        {glücksradQuestions[glücksradIndex]?.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`lernen-quiz-option ${
                              glücksradAnswers[glücksradIndex] === i
                                ? glücksradAnswers[glücksradIndex] === glücksradQuestions[glücksradIndex].correctIndex
                                  ? 'lernen-quiz-option--richtig'
                                  : 'lernen-quiz-option--falsch'
                                : ''
                            }`}
                            onClick={() => handleGlücksradAnswer(i)}
                            disabled={glücksradAnswers[glücksradIndex] !== null}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showKarteikarten && !showKarteikartenAuswertung && karteikartenItems[karteikartenIndex] && (
                <div className="lernen-karteikarten">
                  <div
                    className={`lernen-karte ${karteikartenFlipped ? 'lernen-karte--flipped' : ''}`}
                    onClick={!karteikartenFlipped ? handleKarteikartenFlip : undefined}
                    role={!karteikartenFlipped ? 'button' : undefined}
                    tabIndex={!karteikartenFlipped ? 0 : undefined}
                    onKeyDown={!karteikartenFlipped ? (e) => e.key === 'Enter' && handleKarteikartenFlip() : undefined}
                    aria-label={!karteikartenFlipped ? 'Karte umdrehen' : undefined}
                  >
                    <div className="lernen-karte-inner">
                      <div className="lernen-karte-vorne">
                        <span className="lernen-karte-label">{view === 'verben' ? 'Aufgabe' : 'Latein'}</span>
                        <p className="lernen-karte-text">{karteikartenItems[karteikartenIndex].front}</p>
                        <span className="lernen-karte-hinweis">Tippen zum Umdrehen</span>
                      </div>
                      <div className="lernen-karte-hinten">
                        <span className="lernen-karte-label">{view === 'verben' ? 'Lösung' : 'Deutsch'}</span>
                        <p className="lernen-karte-text">{karteikartenItems[karteikartenIndex].back}</p>
                        <div className="lernen-karte-aktionen">
                          <button
                            type="button"
                            className="lernen-karte-btn lernen-karte-btn--falsch"
                            onClick={(e) => { e.stopPropagation(); handleKarteikartenAnswer(false) }}
                          >
                            Falsch
                          </button>
                          <button
                            type="button"
                            className="lernen-karte-btn lernen-karte-btn--richtig"
                            onClick={(e) => { e.stopPropagation(); handleKarteikartenAnswer(true) }}
                          >
                            Richtig
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showVokabelnQuiz && !showVokabelnQuizAuswertung && vokabelQuizQuestions[vokabelQuizIndex] && vokabelQuizMode === 'lernen' && (
                <div className="lernen-quiz">
                  <p className="lernen-quiz-frage-text">
                    Wie lautet die Übersetzung von <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong>?
                  </p>
                  <div className="lernen-quiz-optionen">
                    {vokabelQuizQuestions[vokabelQuizIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`lernen-quiz-option ${
                          vokabelQuizAnswers[vokabelQuizIndex] === i
                            ? vokabelQuizAnswers[vokabelQuizIndex] === vokabelQuizQuestions[vokabelQuizIndex].correctIndex
                              ? 'lernen-quiz-option--richtig'
                              : 'lernen-quiz-option--falsch'
                            : ''
                        }`}
                        onClick={() => handleVokabelQuizAnswer(i)}
                        disabled={vokabelQuizAnswers[vokabelQuizIndex] !== null}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showVokabelnQuiz && !showVokabelnQuizAuswertung && vokabelQuizQuestions[vokabelQuizIndex] && vokabelQuizMode === 'test' && (
                <div className="lernen-quiz lernen-quiz--test">
                  <p className="lernen-quiz-frage-text">
                    Wie lautet die Übersetzung von <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong>?
                  </p>
                  <div className="lernen-quiz-eingabe">
                    <input
                      type="text"
                      className={`lernen-quiz-input ${
                        vokabelQuizAnswers[vokabelQuizIndex] !== null
                          ? isVokabelAnswerCorrect(vokabelQuizQuestions[vokabelQuizIndex], vokabelQuizAnswers[vokabelQuizIndex])
                            ? 'lernen-quiz-input--richtig'
                            : 'lernen-quiz-input--falsch'
                          : ''
                      }`}
                      value={vokabelQuizAnswers[vokabelQuizIndex] !== null ? String(vokabelQuizAnswers[vokabelQuizIndex]) : vokabelTestInput}
                      onChange={(e) => setVokabelTestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVokabelTestPrüfen()}
                      disabled={vokabelQuizAnswers[vokabelQuizIndex] !== null}
                      placeholder="Übersetzung eingeben …"
                      autoFocus
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="lernen-quiz-prüfen"
                      onClick={handleVokabelTestPrüfen}
                      disabled={vokabelQuizAnswers[vokabelQuizIndex] !== null || !vokabelTestInput.trim()}
                    >
                      Prüfen
                    </button>
                  </div>
                  {vokabelQuizAnswers[vokabelQuizIndex] !== null && (
                    <p className="lernen-quiz-lösung">
                      {isVokabelAnswerCorrect(vokabelQuizQuestions[vokabelQuizIndex], vokabelQuizAnswers[vokabelQuizIndex]) ? (
                        <span className="lernen-quiz-lösung--richtig">Richtig!</span>
                      ) : (
                        <>
                          <span className="lernen-quiz-lösung--falsch">Richtig: </span>
                          <strong>{vokabelQuizQuestions[vokabelQuizIndex].uebersetzung}</strong>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {showQuiz && !showAuswertung && currentFrage && quizMode === 'lernen' && (
                <div className="lernen-quiz">
                  <p className="lernen-quiz-frage-text">
                    Wie lautet <strong>{currentFrage.fall}</strong> {currentFrage.zahlLabel} von <strong>{currentFrage.wortName}</strong>?
                  </p>
                  <div className="lernen-quiz-optionen">
                    {currentFrage.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`lernen-quiz-option ${
                          quizAnswers[quizIndex] === i
                            ? quizAnswers[quizIndex] === currentFrage.correctIndex
                              ? 'lernen-quiz-option--richtig'
                              : 'lernen-quiz-option--falsch'
                            : ''
                        }`}
                        onClick={() => handleQuizAnswer(i)}
                        disabled={quizAnswers[quizIndex] !== null}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showQuiz && !showAuswertung && currentFrage && quizMode === 'test' && (
                <div className="lernen-quiz lernen-quiz--test">
                  <p className="lernen-quiz-frage-text">
                    Wie lautet <strong>{currentFrage.fall}</strong> {currentFrage.zahlLabel} von <strong>{currentFrage.wortName}</strong>?
                  </p>
                  <div className="lernen-quiz-eingabe">
                    <input
                      type="text"
                      className={`lernen-quiz-input ${
                        quizAnswers[quizIndex] !== null
                          ? normalizeLatin(String(quizAnswers[quizIndex])) === normalizeLatin(currentFrage.correctAnswer)
                            ? 'lernen-quiz-input--richtig'
                            : 'lernen-quiz-input--falsch'
                          : ''
                      }`}
                      value={quizAnswers[quizIndex] !== null ? String(quizAnswers[quizIndex]) : testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTestPrüfen()}
                      disabled={quizAnswers[quizIndex] !== null}
                      placeholder="Lateinische Form eingeben …"
                      autoFocus
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="lernen-quiz-prüfen"
                      onClick={handleTestPrüfen}
                      disabled={quizAnswers[quizIndex] !== null || !testInput.trim()}
                    >
                      Prüfen
                    </button>
                  </div>
                  {quizAnswers[quizIndex] !== null && (
                    <p className="lernen-quiz-lösung">
                      {normalizeLatin(String(quizAnswers[quizIndex])) === normalizeLatin(currentFrage.correctAnswer) ? (
                        <span className="lernen-quiz-lösung--richtig">Richtig!</span>
                      ) : (
                        <>
                          <span className="lernen-quiz-lösung--falsch">Richtig: </span>
                          <strong>{currentFrage.correctAnswer}</strong>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {showCrownScreen && crownsEarned != null && (
                <div className="lernen-kronen-seite" role="status" aria-live="polite">
                  <div className="lernen-kronen-seite-crowns">
                    {Array.from({ length: crownsEarned }, (_, i) => (
                      <CrownIcon key={i} className="lernen-kronen-seite-crown" style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                  <p className="lernen-kronen-seite-title">Belohnung</p>
                  <p className="lernen-kronen-seite-text">
                    +{crownsEarned} Lobeskrone{crownsEarned !== 1 ? 'n' : ''} verdient!
                  </p>
                  <p className="lernen-kronen-seite-hint">Im Shop gegen coole Belohnungen eintauschen.</p>
                  <button
                    type="button"
                    className="lernen-kronen-seite-btn"
                    onClick={() => setShowCrownRewardScreen(false)}
                  >
                    Weiter zur Auswertung
                  </button>
                </div>
              )}

              {showAuswertungContent && (
                <div className={auswertungClass}>
                  <div className={`lernen-auswertung-ring-wrap ${hasGoldenRing ? 'lernen-auswertung-ring-wrap--gold' : ''}`}>
                    <svg className="lernen-auswertung-ring" viewBox="0 0 120 120" aria-hidden>
                      {hasGoldenRing && (
                        <defs>
                          <linearGradient id="lernen-ring-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffd54f" />
                            <stop offset="50%" stopColor="#ffc107" />
                            <stop offset="100%" stopColor="#ff8f00" />
                          </linearGradient>
                        </defs>
                      )}
                      <circle
                        className="lernen-auswertung-ring-bg"
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        strokeWidth="8"
                        stroke={hasGoldenRing ? 'url(#lernen-ring-gold)' : undefined}
                      />
                      <circle
                        className="lernen-auswertung-ring-fill"
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        strokeWidth="8"
                        strokeDasharray={`${ringStroke} 339.3`}
                        stroke={hasGoldenRing ? 'url(#lernen-ring-gold)' : undefined}
                      />
                    </svg>
                    <div className="lernen-auswertung-prozent-wrap">
                      <p className="lernen-auswertung-prozent">{displayPercent} %</p>
                    </div>
                  </div>
                  <p className="lernen-auswertung-message">{auswertungMessage}</p>
                  <p className="lernen-auswertung-label">richtig</p>
                  {showWortpaareAuswertung && wortpaareEndTime != null && (
                    <p className="lernen-auswertung-zeit">
                      Zeit: {Math.round((wortpaareEndTime - wortpaareStartTime) / 1000)} Sekunden
                    </p>
                  )}
                  {showRennenAuswertung && (
                    <p className="lernen-auswertung-platz">
                      {rennenCarProgress >= rennenOpponentProgress ? '🏆 Platz 1!' : 'Platz 2'}
                    </p>
                  )}
                  {showAuswertung && fehler.length > 0 && (
                    <div className="lernen-auswertung-fehler">
                      <h3 className="lernen-auswertung-fehler-title">Fehler</h3>
                      <ul className="lernen-auswertung-fehler-liste">
                        {fehler.map(({ frage }, i) => (
                          <li
                            key={`${frage.wortName}-${frage.fall}-${frage.zahlLabel}`}
                            style={{ animationDelay: `${0.5 + i * 0.06}s` }}
                          >
                            {frage.fall} {frage.zahlLabel} von {frage.wortName}: <strong>{frage.correctAnswer}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showKarteikartenAuswertung && karteikartenFehler.length > 0 && (
                    <div className="lernen-auswertung-fehler">
                      <h3 className="lernen-auswertung-fehler-title">Fehler</h3>
                      <ul className="lernen-auswertung-fehler-liste">
                        {karteikartenFehler.map((item, i) => (
                          <li key={`${item.front}-${i}`} style={{ animationDelay: `${0.5 + i * 0.06}s` }}>
                            <strong>{item.front}</strong> → {item.back}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showVokabelnQuizAuswertung && vokabelnFehler.length > 0 && (
                    <div className="lernen-auswertung-fehler">
                      <h3 className="lernen-auswertung-fehler-title">Fehler</h3>
                      <ul className="lernen-auswertung-fehler-liste">
                        {vokabelnFehler.map((q, i) => (
                          <li key={`${q.vokabel}-${i}`} style={{ animationDelay: `${0.5 + i * 0.06}s` }}>
                            <strong>{q.vokabel}</strong> → {q.uebersetzung}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showSachkundeQuizAuswertung && sachkundeFehler.length > 0 && (
                    <div className="lernen-auswertung-fehler">
                      <h3 className="lernen-auswertung-fehler-title">Fehler</h3>
                      <ul className="lernen-auswertung-fehler-liste">
                        {sachkundeFehler.map((q, i) => (
                          <li key={`${q.question}-${i}`} style={{ animationDelay: `${0.5 + i * 0.06}s` }}>
                            {q.question} → <strong>{q.options[q.correctIndex]}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="lernen-auswertung-buttons">
                    {showSachkundeQuizAuswertung ? (
                      <>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleSachkundeNochEinmal}>
                          <RefreshIcon />
                          <span>Noch einmal</span>
                        </button>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--2" onClick={handleSachkundeFalscheWeiter}>
                          <FalscheUebenIcon />
                          <span>Falsche weiter üben</span>
                        </button>
                      </>
                    ) : showAuswertung ? (
                      <>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleNochEinmal}>
                          <RefreshIcon />
                          <span>Noch einmal</span>
                        </button>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--2" onClick={handleFalscheWeiter}>
                          <FalscheUebenIcon />
                          <span>Falsche weiter üben</span>
                        </button>
                      </>
                    ) : showVokabelnQuizAuswertung ? (
                      <>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleVokabelNochEinmal}>
                          <RefreshIcon />
                          <span>Noch einmal</span>
                        </button>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--2" onClick={handleVokabelFalscheWeiter}>
                          <FalscheUebenIcon />
                          <span>Falsche weiter üben</span>
                        </button>
                      </>
                    ) : showWortpaareAuswertung ? (
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleWortpaareNochEinmal}>
                        <RefreshIcon />
                        <span>Noch einmal</span>
                      </button>
                    ) : showGlücksradAuswertung ? (
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleGlücksradNochEinmal}>
                        <RefreshIcon />
                        <span>Noch einmal</span>
                      </button>
                    ) : showRennenAuswertung ? (
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleRennenNochEinmal}>
                        <RefreshIcon />
                        <span>Noch einmal</span>
                      </button>
                    ) : (
                      <>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleKarteikartenNochEinmal}>
                          <RefreshIcon />
                          <span>Noch einmal</span>
                        </button>
                        <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--2" onClick={handleKarteikartenFalscheWeiter}>
                          <FalscheUebenIcon />
                          <span>Falsche weiter üben</span>
                        </button>
                      </>
                    )}
                    <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--3" onClick={handleZurStartseite}>
                      <ZurStartIcon />
                      <span>Zur Startseite</span>
                    </button>
                    <button
                      type="button"
                      className="lernen-auswertung-btn lernen-auswertung-btn--share"
                      onClick={handleShareResult}
                      aria-label="Ergebnis teilen"
                    >
                      <ShareIcon />
                      <span>Ergebnis teilen</span>
                    </button>
                    {shareResultFeedback === 'ok' && <span className="lernen-auswertung-share-feedback">Kopiert!</span>}
                  </div>
                  {newAchievementIds.length > 0 && (
                    <div className="lernen-auswertung-achievement-toast" role="status">
                      {getAchievements()
                        .filter((a) => newAchievementIds.includes(a.id))
                        .map((a) => (
                          <div key={a.id} className="lernen-achievement-toast-item">
                            <span className="lernen-achievement-toast-icon">{a.icon}</span>
                            <span className="lernen-achievement-toast-title">Neuer Erfolg: {a.title}</span>
                          </div>
                        ))}
                    </div>
                  )}
                  {streakPopup !== null && (
                    <div
                      className={`streak-popup ${streakPopup.updated ? 'streak-popup--levelup' : ''}`}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="streak-popup-flame-wrap">
                        <FlameIcon className="streak-popup-flame" />
                      </div>
                      <div className="streak-popup-number">{streakPopup.streak}</div>
                      <p className="streak-popup-label">
                        {streakPopup.streak === 1
                          ? 'Erster Tag!'
                          : `${streakPopup.streak} Tage in Folge`}
                      </p>
                      {streakPopup.updated && (
                        <p className="streak-popup-badge">Tagesziel erreicht</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
