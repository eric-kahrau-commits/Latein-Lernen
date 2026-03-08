import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  SUBSTANTIV_DEKLINATIONEN,
  ADJEKTIV_DEKLINATIONEN,
  FAELLE,
} from '../data/deklinationen'
import type { DeklinationBeispiel, AdjektivDeklTyp } from '../data/deklinationen'
import {
  getAiDeklinationenForTyp,
  getAiDeklinationSets,
  getAiDeklinationSetById,
  getAiDeklinationSetsByFach,
} from '../data/aiDeklinationSets'
import { getLernsets, getLernsetById, getLernsetsByFach, type VokabelEintrag } from '../data/lernsets'
import {
  getKarteikartenSets,
  getKarteikartenSetById,
  getKarteikartenSetsByFach,
  type KarteikartenEintrag,
} from '../data/karteikartenSets'
import { getFaecher, getFachById } from '../data/faecher'
import { addSession, addAttempt, DEKLINATION_LESSON_OPTIONS, getSessionCountByLesson, getAveragePercentByLesson } from '../data/statistik'
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
import { GRAMMATIK_TOPICS, getGrammatikTopic, getGrammatikTopicsForKlasse, type Klassenstufe } from '../data/grammatik'
import type { StatistikMode } from '../data/statistik'
import { loadLernenState, saveLernenState, isStoredLernenStepActive, type StoredLernenView } from '../data/pageState'
import { getWortpaareBestzeit, setWortpaareBestzeitIfBetter } from '../data/wortpaareBestzeit'
import { getFavoritenIds, toggleFavorit } from '../data/favoriten'
import { orderByDueFirst, recordReview } from '../data/spacedRepetition'
import { updateStreak } from '../data/streak'
import { awardKronenForLesson, addDailyBonusIfEligible } from '../data/kronen'
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
  MatheIcon,
  ChemieIcon,
  LateinIcon,
  SpanischIcon,
  FranzösischIcon,
  EnglischIcon,
  BioIcon,
  PhysikIcon,
} from '../components/icons'
import { useInLesson } from '../context/InLessonContext'
import { checkAchievementsAfterLesson, getAchievements } from '../data/achievements'
import { share, getShareResultText, getShareLernsetPayload } from '../data/share'
import './LernenPage.css'

type View =
  | 'themen'
  | 'fach'
  | 'deklinationen'
  | 'verben'
  | 'substantive'
  | 'adjektive'
  | 'vokabeln'
  | 'grammatik'
  | 'sachkunde'
  | 'ki-lernsets'

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
  /** Für Spaced Repetition: Lernset-ID (nur bei Vokabeln) */
  lernsetId?: string
  /** Für Spaced Repetition: Index im Lernset (nur bei Vokabeln) */
  itemIndex?: number
}

const KLASSEN: { id: Klassenstufe; label: string }[] = [
  { id: 5, label: 'Klasse 5' },
  { id: 6, label: 'Klasse 6' },
  { id: 7, label: 'Klasse 7' },
  { id: 8, label: 'Klasse 8' },
  { id: 9, label: 'Klasse 9' },
  { id: 10, label: 'Klasse 10' },
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

const FAECHER_ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  mathe: MatheIcon,
  chemie: ChemieIcon,
  latein: LateinIcon,
  spanisch: SpanischIcon,
  franzoesisch: FranzösischIcon,
  englisch: EnglischIcon,
  bio: BioIcon,
  physik: PhysikIcon,
}

const VOKABEL_SPIELE = [
  { id: 'wortpaare' as const, label: 'Wortpaare finden', Icon: CardIcon },
  { id: 'glücksrad' as const, label: 'Glücksrad', Icon: ZapIcon },
  { id: 'rennen' as const, label: 'Autorennspiel', Icon: ZapIcon },
]

const FRAGEN_ANZAHL = 10
const OPTIONEN_ANZAHL = 4
const TRANSITION_MS = 420

/** Normalisiert für Vergleich: Kleinbuchstaben, Leerzeichen, Sonderzeichen (ā→a, ē→e, …) gelten wie normale Buchstaben. */
function normalizeLatin(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Prozent in deutsche Schulnote (1–6) umrechnen. */
function percentToGrade(percent: number): number {
  if (percent >= 90) return 1
  if (percent >= 80) return 2
  if (percent >= 70) return 3
  if (percent >= 60) return 4
  if (percent >= 50) return 5
  return 6
}

function buildVokabelQuiz(items: VokabelEintrag[], count: number): VokabelQuizFrage[] {
  if (items.length < 2) return []
  const pool = shuffle([...items]).slice(0, Math.min(count, items.length))
  return pool.map((item, poolIndex) => buildOneVokabelFrage(item, items, undefined, undefined, poolIndex))
}

/** Eine Vokabel-Frage bauen (mit optionalem lernsetId/itemIndex für Spaced Repetition) */
function buildOneVokabelFrage(
  item: VokabelEintrag,
  allItems: VokabelEintrag[],
  lernsetId?: string,
  itemIndex?: number,
  _poolIndex?: number
): VokabelQuizFrage {
  const correctAnswer = item.uebersetzung
  let wrongs: string[]
  if (item.wrongOptions && item.wrongOptions.length >= OPTIONEN_ANZAHL - 1) {
    wrongs = shuffle([...item.wrongOptions]).slice(0, OPTIONEN_ANZAHL - 1)
  } else {
    const others = allItems.filter((i) => i.uebersetzung !== correctAnswer).map((i) => i.uebersetzung)
    wrongs = shuffle(others).slice(0, OPTIONEN_ANZAHL - 1)
    while (wrongs.length < OPTIONEN_ANZAHL - 1 && others.length > 0) {
      wrongs.push(others[wrongs.length % others.length])
    }
  }
  const options = shuffle([correctAnswer, ...wrongs])
  const correctIndex = options.indexOf(correctAnswer)
  return {
    vokabel: item.vokabel,
    uebersetzung: item.uebersetzung,
    options,
    correctIndex,
    ...(lernsetId != null && { lernsetId }),
    ...(itemIndex != null && { itemIndex }),
  }
}

/** Vokabel-Quiz aus nach Fälligkeit sortierten Items (Spaced Repetition: fällige zuerst) */
function buildVokabelQuizFromOrdered(
  lernsetId: string,
  ordered: { item: VokabelEintrag; index: number; due: boolean }[],
  allItems: VokabelEintrag[],
  count: number
): VokabelQuizFrage[] {
  if (ordered.length < 2) return []
  const pool = ordered.slice(0, Math.min(count, ordered.length))
  return pool.map(({ item, index }) => buildOneVokabelFrage(item, allItems, lernsetId, index))
}

/** Vollständiger Pool aller Vokabel-Fragen (für 5-Stationen-Lernmodus), in 3 Teile (je ~33 %) geteilt. */
function buildVokabelFullPoolAndParts(
  lernsetId: string,
  ordered: { item: VokabelEintrag; index: number; due: boolean }[],
  allItems: VokabelEintrag[]
): { full: VokabelQuizFrage[]; part1: VokabelQuizFrage[]; part2: VokabelQuizFrage[]; part3: VokabelQuizFrage[] } {
  if (ordered.length < 2) return { full: [], part1: [], part2: [], part3: [] }
  const full = shuffle(
    ordered.map(({ item, index }) => buildOneVokabelFrage(item, allItems, lernsetId, index))
  )
  const n = full.length
  const third = Math.max(1, Math.floor(n / 3))
  const part1 = full.slice(0, third)
  const part2 = full.slice(third, 2 * third)
  const part3 = full.slice(2 * third)
  return { full, part1, part2, part3 }
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

/** Vollständiger Pool aller Deklinations-Fragen (für 5-Stationen-Lernmodus), in 3 Teile (je ~33 %) geteilt. */
function buildDeklinationFullPoolAndParts(beispiele: DeklinationBeispiel[]): {
  full: QuizFrage[]
  part1: QuizFrage[]
  part2: QuizFrage[]
  part3: QuizFrage[]
} {
  const pool: { beispielIndex: number; caseIndex: number; isPlural: boolean }[] = []
  beispiele.forEach((_, bi) => {
    for (let c = 0; c < 6; c++) {
      pool.push({ beispielIndex: bi, caseIndex: c, isPlural: false })
      pool.push({ beispielIndex: bi, caseIndex: c, isPlural: true })
    }
  })
  const shuffled = shuffle(pool)
  const full = shuffled.map(({ beispielIndex, caseIndex, isPlural }) => {
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
  const n = full.length
  const third = Math.max(1, Math.floor(n / 3))
  const part1 = full.slice(0, third)
  const part2 = full.slice(third, 2 * third)
  const part3 = full.slice(2 * third)
  return { full, part1, part2, part3 }
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

function buildDeklinationKarteikarten(beispiele: DeklinationBeispiel[]): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  beispiele.forEach((b) => {
    const wortName = b.name.split(' ')[0]
    FAELLE.forEach((fall, i) => {
      cards.push({
        front: `Wie lautet ${fall} Singular von ${wortName}?`,
        back: b.tabelle.singular[i],
      })
      cards.push({
        front: `Wie lautet ${fall} Plural von ${wortName}?`,
        back: b.tabelle.plural[i],
      })
    })
  })
  return cards
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
  const [selectedSachkundeTopicId, setSelectedSachkundeTopicId] = useState<string | null>(
    storedState.selectedSachkundeTopicId ?? null
  )
  const [selectedGrammatikTopicId, setSelectedGrammatikTopicId] = useState<string | null>(
    storedState.selectedGrammatikTopicId ?? null
  )
  const [selectedKlassenstufe, setSelectedKlassenstufe] = useState<Klassenstufe | null>(null)
  const [selectedFachId, setSelectedFachId] = useState<string | null>(null)
  const [fromKiLernsetsVokabeln, setFromKiLernsetsVokabeln] = useState(false)
  const [kiSubCategory, setKiSubCategory] = useState<'vokabeln' | 'deklination' | 'karteikarten' | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const state = location.state as { openKiVokabeln?: boolean } | null
    if (state?.openKiVokabeln) {
      setView('vokabeln')
      setFromKiLernsetsVokabeln(true)
      setBreadcrumb(['KI-Lernsets', 'Vokabeln'])
      setStep(null)
      navigate('/lernen', { replace: true, state: {} })
    }
  }, [location.state, navigate])
  const [selectedAiDeklinationSetId, setSelectedAiDeklinationSetId] = useState<string | null>(null)
  const [selectedKarteikartenSetId, setSelectedKarteikartenSetId] = useState<string | null>(null)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [favoritenIds, setFavoritenIds] = useState<string[]>(() => getFavoritenIds())
  const [streakPopup, setStreakPopup] = useState<{ streak: number; updated: boolean } | null>(null)
  const [crownsEarned, setCrownsEarned] = useState<number | null>(null)
  const [showCrownRewardScreen, setShowCrownRewardScreen] = useState(false)
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([])
  const [shareResultFeedback, setShareResultFeedback] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [shareLernsetFeedback, setShareLernsetFeedback] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [searchQuery, setSearchQuery] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<QuizFrage[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Array<number | string | null>>([])
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null)
  const [testInput, setTestInput] = useState('')

  /* 5-Stationen-Lernmodus nur für Deklinationen (Substantiv/Adjektiv) */
  const [dekStationLernenActive, setDekStationLernenActive] = useState(false)
  const [dekStation, setDekStation] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [dekPhase, setDekPhase] = useState<'newMc' | 'wrongMc' | 'correctTest'>('newMc')
  const [dekParts, setDekParts] = useState<[QuizFrage[], QuizFrage[], QuizFrage[]]>([[], [], []])
  const [dekPrevWrong, setDekPrevWrong] = useState<QuizFrage[]>([])
  const [dekPrevCorrect, setDekPrevCorrect] = useState<QuizFrage[]>([])
  const [dekShowZwischenauswertung, setDekShowZwischenauswertung] = useState(false)
  const [dekZwischenCorrect, setDekZwischenCorrect] = useState(0)
  const [dekZwischenWrong, setDekZwischenWrong] = useState(0)
  const [dekZwischenFromPhase, setDekZwischenFromPhase] = useState<'newMc' | 'wrongMc' | 'correctTest'>('newMc')
  const [dekResultsNewPart, setDekResultsNewPart] = useState<{ wrong: QuizFrage[]; correct: QuizFrage[] }>({ wrong: [], correct: [] })
  const dekCompletedRef = useRef(false)
  const [dekStationTestMode, setDekStationTestMode] = useState(false)
  const [dekTestTotalCorrect, setDekTestTotalCorrect] = useState(0)
  const [dekTestTotalQuestions, setDekTestTotalQuestions] = useState(0)
  const [showDekTestAuswertung, setShowDekTestAuswertung] = useState(false)

  /* 5-Stationen-Lernmodus für Vokabeln */
  const [vokStationLernenActive, setVokStationLernenActive] = useState(false)
  const [vokStation, setVokStation] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [vokPhase, setVokPhase] = useState<'newMc' | 'wrongMc' | 'correctTest'>('newMc')
  const [vokParts, setVokParts] = useState<[VokabelQuizFrage[], VokabelQuizFrage[], VokabelQuizFrage[]]>([[], [], []])
  const [vokPrevWrong, setVokPrevWrong] = useState<VokabelQuizFrage[]>([])
  const [vokPrevCorrect, setVokPrevCorrect] = useState<VokabelQuizFrage[]>([])
  const [vokShowZwischenauswertung, setVokShowZwischenauswertung] = useState(false)
  const [vokZwischenCorrect, setVokZwischenCorrect] = useState(0)
  const [vokZwischenWrong, setVokZwischenWrong] = useState(0)
  const [vokZwischenFromPhase, setVokZwischenFromPhase] = useState<'newMc' | 'wrongMc' | 'correctTest'>('newMc')
  const [vokResultsNewPart, setVokResultsNewPart] = useState<{ wrong: VokabelQuizFrage[]; correct: VokabelQuizFrage[] }>({ wrong: [], correct: [] })
  const vokCompletedRef = useRef(false)
  const [vokStationTestMode, setVokStationTestMode] = useState(false)
  const [vokTestTotalCorrect, setVokTestTotalCorrect] = useState(0)
  const [vokTestTotalQuestions, setVokTestTotalQuestions] = useState(0)
  const [showVokTestAuswertung, setShowVokTestAuswertung] = useState(false)

  const [karteikartenItems, setKarteikartenItems] = useState<
    { front: string; back: string; frontImage?: string; backImage?: string }[]
  >([])
  const [karteikartenIndex, setKarteikartenIndex] = useState(0)
  const [karteikartenResults, setKarteikartenResults] = useState<boolean[]>([])
  const [karteikartenFlipped, setKarteikartenFlipped] = useState(false)
  const [vokabelQuizQuestions, setVokabelQuizQuestions] = useState<VokabelQuizFrage[]>([])
  const [vokabelQuizIndex, setVokabelQuizIndex] = useState(0)
  const [vokabelQuizAnswers, setVokabelQuizAnswers] = useState<Array<number | string | null>>([])
  const [vokabelQuizMode, setVokabelQuizMode] = useState<'lernen' | 'test' | null>(null)
  const [vokabelTestInput, setVokabelTestInput] = useState('')
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
  const [wortpaareElapsedMs, setWortpaareElapsedMs] = useState(0)
  const [wortpaareLessonKey, setWortpaareLessonKey] = useState<string | null>(null)
  const [wortpaareIsNewBest, setWortpaareIsNewBest] = useState(false)
  /** Bei KI-Lernsets: Wortpaare ohne Zeitdruck (kein Timer, keine Zeit in der Auswertung) */
  const [wortpaareOhneZeit, setWortpaareOhneZeit] = useState(false)
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
  const [rennenStartTime, setRennenStartTime] = useState<number>(0)
  const [rennenElapsedMs, setRennenElapsedMs] = useState(0)
  const rennenQuestionStartRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number>(0)
  const statistikRecordedRef = useRef(false)
  const { setInLesson } = useInLesson()

  const selectedAiDeklSet = selectedAiDeklinationSetId ? getAiDeklinationSetById(selectedAiDeklinationSetId) : null
  const selectedKarteikartenSet = selectedKarteikartenSetId ? getKarteikartenSetById(selectedKarteikartenSetId) : null
  const karteikartenSetItems: KarteikartenEintrag[] = selectedKarteikartenSet?.items ?? []
  const beispiele: DeklinationBeispiel[] =
    view === 'ki-lernsets' && selectedAiDeklSet
      ? [selectedAiDeklSet.beispiel]
      : view === 'substantive' && selectedTyp && selectedTyp in SUBSTANTIV_DEKLINATIONEN
        ? [
            ...SUBSTANTIV_DEKLINATIONEN[selectedTyp as DeklTyp],
            ...getAiDeklinationenForTyp(selectedTyp as DeklTyp),
          ]
        : view === 'adjektive' && (selectedTyp === 'a-o' || selectedTyp === 'konsonantisch')
          ? ADJEKTIV_DEKLINATIONEN[selectedTyp]
          : []

  /* Beim Start: Keine vorgegebenen Themen mehr – immer mit leerer Lernseite (themen) starten. */
  useEffect(() => {
    if (view === 'grammatik' || view === 'deklinationen' || view === 'sachkunde') {
      setView('themen')
      setBreadcrumb([])
      setStep(null)
      setSelectedKlassenstufe(null)
      setSelectedGrammatikTopicId(null)
      setSelectedSachkundeTopicId(null)
    }
  }, [])

  useEffect(() => {
    if (transitionFrom === null) return
    const t = setTimeout(() => setTransitionFrom(null), TRANSITION_MS)
    return () => clearTimeout(t)
  }, [transitionFrom])

  useEffect(() => {
    const inLesson = view !== 'themen' || step !== null
    setInLesson(inLesson)
    return () => setInLesson(false)
  }, [view, step, setInLesson])

  /* 5-Stationen Deklination: Bei vollständig beantworteter Queue → Zwischenauswertung oder Übergang wrongMc → correctTest */
  useEffect(() => {
    if (!dekStationLernenActive || dekShowZwischenauswertung) return
    if (quizQuestions.length === 0 || quizAnswers.some((a) => a === null)) return
    if (dekCompletedRef.current) return
    const correctCount = quizQuestions.filter((q, i) => isAnswerCorrect(q, quizAnswers[i])).length
    const wrongCount = quizQuestions.length - correctCount
    if (dekStationTestMode) {
      setDekTestTotalCorrect((c) => c + correctCount)
      setDekTestTotalQuestions((t) => t + quizQuestions.length)
    }
    if (dekPhase === 'wrongMc' && !dekStationTestMode) {
      const wrongList = quizQuestions.filter((q, i) => !isAnswerCorrect(q, quizAnswers[i]))
      setDekPrevWrong(wrongList)
      if (dekPrevCorrect.length === 0) {
        dekCompletedRef.current = true
        setDekZwischenCorrect(correctCount)
        setDekZwischenWrong(wrongCount)
        setDekZwischenFromPhase('correctTest')
        setDekShowZwischenauswertung(true)
        return
      }
      setDekPhase('correctTest')
      setQuizQuestions(dekPrevCorrect)
      setQuizIndex(0)
      setQuizAnswers(Array(dekPrevCorrect.length).fill(null))
      setQuizMode('test')
      setTestInput('')
      return
    }
    dekCompletedRef.current = true
    setDekZwischenCorrect(correctCount)
    setDekZwischenWrong(wrongCount)
    setDekZwischenFromPhase(dekPhase)
    if (dekPhase === 'newMc') {
      const wrongList = quizQuestions.filter((q, i) => !isAnswerCorrect(q, quizAnswers[i]))
      const correctList = quizQuestions.filter((q, i) => isAnswerCorrect(q, quizAnswers[i]))
      setDekResultsNewPart({ wrong: wrongList, correct: correctList })
    }
    setDekShowZwischenauswertung(true)
  }, [
    dekStationLernenActive,
    dekShowZwischenauswertung,
    dekPhase,
    dekPrevCorrect,
    dekStationTestMode,
    quizQuestions,
    quizAnswers,
  ])

  /* 5-Stationen Vokabeln: Bei vollständig beantworteter Queue → Zwischenauswertung oder Übergang wrongMc → correctTest */
  useEffect(() => {
    if (!vokStationLernenActive || vokShowZwischenauswertung) return
    if (vokabelQuizQuestions.length === 0 || vokabelQuizAnswers.some((a) => a === null)) return
    if (vokCompletedRef.current) return
    const correctCount = vokabelQuizQuestions.filter((q, i) => isVokabelAnswerCorrect(q, vokabelQuizAnswers[i])).length
    const wrongCount = vokabelQuizQuestions.length - correctCount
    if (vokStationTestMode) {
      setVokTestTotalCorrect((c) => c + correctCount)
      setVokTestTotalQuestions((t) => t + vokabelQuizQuestions.length)
    }
    if (vokPhase === 'wrongMc' && !vokStationTestMode) {
      const wrongList = vokabelQuizQuestions.filter((q, i) => !isVokabelAnswerCorrect(q, vokabelQuizAnswers[i]))
      setVokPrevWrong(wrongList)
      if (vokPrevCorrect.length === 0) {
        vokCompletedRef.current = true
        setVokZwischenCorrect(correctCount)
        setVokZwischenWrong(wrongCount)
        setVokZwischenFromPhase('correctTest')
        setVokShowZwischenauswertung(true)
        return
      }
      setVokPhase('correctTest')
      setVokabelQuizQuestions(vokPrevCorrect)
      setVokabelQuizIndex(0)
      setVokabelQuizAnswers(Array(vokPrevCorrect.length).fill(null))
      setVokabelQuizMode('test')
      setVokabelTestInput('')
      return
    }
    vokCompletedRef.current = true
    setVokZwischenCorrect(correctCount)
    setVokZwischenWrong(wrongCount)
    setVokZwischenFromPhase(vokPhase)
    if (vokPhase === 'newMc') {
      const wrongList = vokabelQuizQuestions.filter((q, i) => !isVokabelAnswerCorrect(q, vokabelQuizAnswers[i]))
      const correctList = vokabelQuizQuestions.filter((q, i) => isVokabelAnswerCorrect(q, vokabelQuizAnswers[i]))
      setVokResultsNewPart({ wrong: wrongList, correct: correctList })
    }
    setVokShowZwischenauswertung(true)
  }, [
    vokStationLernenActive,
    vokShowZwischenauswertung,
    vokPhase,
    vokPrevCorrect,
    vokStationTestMode,
    vokabelQuizQuestions,
    vokabelQuizAnswers,
  ])

  const pairCountDerived = wortpaareCards.length / 2
  useEffect(() => {
    if (pairCountDerived < 1 || wortpaareMatched.length !== pairCountDerived) return
    const endMs = Date.now()
    setWortpaareEndTime((prev) => (prev == null ? endMs : prev))
    if (!wortpaareOhneZeit && wortpaareLessonKey) {
      const timeMs = endMs - wortpaareStartTime
      const isNew = setWortpaareBestzeitIfBetter(wortpaareLessonKey, timeMs)
      setWortpaareIsNewBest(isNew)
    }
  }, [wortpaareMatched.length, pairCountDerived, wortpaareLessonKey, wortpaareStartTime, wortpaareOhneZeit])

  useEffect(() => {
    if (step !== 'wortpaare' || wortpaareOhneZeit || wortpaareCards.length === 0 || wortpaareMatched.length === pairCountDerived) return
    const tick = () => setWortpaareElapsedMs(Math.max(0, Date.now() - wortpaareStartTime))
    tick()
    const id = setInterval(tick, 50)
    return () => clearInterval(id)
  }, [step, wortpaareOhneZeit, wortpaareCards.length, wortpaareMatched.length, wortpaareStartTime, pairCountDerived])

  useEffect(() => {
    saveLernenState({
      view: (view === 'ki-lernsets' || view === 'fach' ? 'themen' : view) as StoredLernenView,
      breadcrumb,
      selectedTyp,
      selectedLernsetId,
      selectedGrammatikTopicId,
      selectedSachkundeTopicId,
      step: step === 'chooseMode' ? 'chooseMode' : step === null ? null : step,
    })
  }, [view, breadcrumb, selectedTyp, selectedLernsetId, selectedGrammatikTopicId, selectedSachkundeTopicId, step])

  useEffect(() => {
    if (!isStoredLernenStepActive(storedState.step)) return
    setStep('chooseMode')
    setShowContinueDialog(true)
  }, [])

  // Rennen: Zeit messen (für Live-View & Anzeige)
  useEffect(() => {
    if (step !== 'rennen' || rennenDifficulty == null || rennenQuestions.length === 0) return
    const allAnswered = rennenAnswers.every((a) => a !== null)
    if (allAnswered || rennenStartTime === 0) return
    const tick = () => setRennenElapsedMs(Math.max(0, Date.now() - rennenStartTime))
    tick()
    const id = setInterval(tick, 50)
    return () => clearInterval(id)
  }, [step, rennenDifficulty, rennenQuestions.length, rennenAnswers, rennenStartTime])

  // Rennen: Autos fahren permanent, Antworten geben Boost
  useEffect(() => {
    if (step !== 'rennen' || rennenDifficulty == null || rennenQuestions.length === 0) return
    const allAnswered = rennenAnswers.every((a) => a !== null)
    if (allAnswered) return
    const intervalMs = 80
    const userSpeedPerSec = 1.4
    const opponentSpeedPerSec =
      rennenDifficulty === 'leicht' ? 1.2 : rennenDifficulty === 'mittel' ? 1.5 : 1.8
    const userPerTick = (userSpeedPerSec * intervalMs) / 1000
    const oppPerTick = (opponentSpeedPerSec * intervalMs) / 1000
    const id = setInterval(() => {
      setRennenCarProgress((p) => Math.min(100, p + userPerTick))
      setRennenOpponentProgress((p) => Math.min(100, p + oppPerTick))
    }, intervalMs)
    return () => clearInterval(id)
  }, [step, rennenDifficulty, rennenQuestions.length, rennenAnswers])

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
    if (newView !== 'grammatik') setSelectedGrammatikTopicId(null)
    if (newView === 'ki-lernsets') {
      setKiSubCategory(null)
      setSelectedAiDeklinationSetId(null)
    }
    if (newView !== 'vokabeln') setFromKiLernsetsVokabeln(false)
  }

  const handleKlasseClick = (klasse: Klassenstufe) => {
    setSelectedKlassenstufe(klasse)
    setView('grammatik')
    setBreadcrumb([`Klasse ${klasse}`])
    setStep(null)
    setSelectedGrammatikTopicId(null)
  }

  const handleKlassenDashboardClick = (action: 'vokabeln' | 'deklinationen' | 'sachkunde' | 'ki-lernsets') => {
    if (action === 'vokabeln') goTo('vokabeln', [...(selectedKlassenstufe ? [`Klasse ${selectedKlassenstufe}`] : []), 'Vokabeln'], false)
    if (action === 'deklinationen') goTo('deklinationen', [...(selectedKlassenstufe ? [`Klasse ${selectedKlassenstufe}`] : []), 'Deklinationen'], false)
    if (action === 'sachkunde') goTo('sachkunde', [...(selectedKlassenstufe ? [`Klasse ${selectedKlassenstufe}`] : []), 'Sachkunde'], false)
    if (action === 'ki-lernsets') goTo('ki-lernsets', [...(selectedKlassenstufe ? [`Klasse ${selectedKlassenstufe}`] : []), 'KI-Lernsets'], false)
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
  const selectedGrammatikTopic = selectedGrammatikTopicId ? getGrammatikTopic(selectedGrammatikTopicId) : null

  const handleGrammatikTopicClick = (topicId: string) => {
    setSelectedGrammatikTopicId(topicId)
    setStep('chooseMode')
  }

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
    if (id === 'wortpaare' && (view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 4) {
      const items = effectiveVokabelItems
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
      setWortpaareElapsedMs(0)
      setWortpaareLessonKey(effectiveVokabelSetId ?? '')
      setWortpaareIsNewBest(false)
      setWortpaareOhneZeit(view === 'vokabeln' && selectedLernset?.source === 'ai')
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
        setWortpaareElapsedMs(0)
        setWortpaareLessonKey(`verben-${selectedTyp}`)
        setWortpaareIsNewBest(false)
        setWortpaareOhneZeit(false)
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
          setWortpaareElapsedMs(0)
          setWortpaareLessonKey(`${view}-${selectedTyp}`)
          setWortpaareIsNewBest(false)
          setWortpaareOhneZeit(false)
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('wortpaare')
        }
      }
      return
    }
    if (id === 'glücksrad' && (view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 2) {
      const questions = buildVokabelQuiz(effectiveVokabelItems, Math.min(10, effectiveVokabelItems.length))
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
    if (id === 'rennen' && (view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 2) {
      setRennenDifficulty(null)
      setRennenQuestions([])
      setRennenIndex(0)
      setRennenAnswers([])
      setRennenCarProgress(0)
      setRennenOpponentProgress(0)
      setRennenStartTime(0)
      setRennenElapsedMs(0)
      rennenQuestionStartRef.current = null
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
      setRennenStartTime(0)
      setRennenElapsedMs(0)
      rennenQuestionStartRef.current = null
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
        setWortpaareElapsedMs(0)
        setWortpaareLessonKey(selectedSachkundeTopicId ? `sachkunde-${selectedSachkundeTopicId}` : 'sachkunde')
        setWortpaareIsNewBest(false)
        setWortpaareOhneZeit(false)
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
      setRennenStartTime(0)
      setRennenElapsedMs(0)
      rennenQuestionStartRef.current = null
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('rennen')
      return
    }
    if (id === 'karteikarten' && (view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length > 0) {
      const ordered = orderByDueFirst(effectiveVokabelSetId!, effectiveVokabelItems)
      const items = ordered.map(({ item }) => ({
        front: item.vokabel,
        back: item.uebersetzung,
        frontImage: item.vokabelImage,
        backImage: item.uebersetzungImage,
      }))
      setKarteikartenItems(items)
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
      sessionStartRef.current = Date.now()
      statistikRecordedRef.current = false
      setStep('karteikarten')
      return
    }
    if (id === 'karteikarten' && (view === 'substantive' || view === 'adjektive') && selectedTyp && beispiele.length > 0) {
      const items = shuffle(buildDeklinationKarteikarten(beispiele))
      setKarteikartenItems(items)
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
    if (view === 'ki-lernsets' && selectedKarteikartenSet && karteikartenSetItems.length > 0 && (id === 'lernen' || id === 'test' || id === 'karteikarten')) {
      const itemsAsVokabeln: VokabelEintrag[] = karteikartenSetItems.map((i) => ({ vokabel: i.front, uebersetzung: i.back }))
      if (id === 'karteikarten') {
        const items = shuffle(
          karteikartenSetItems.map((i) => ({
            front: i.front,
            back: i.back,
            frontImage: i.frontImage,
            backImage: i.backImage,
          }))
        )
        setKarteikartenItems(items)
        setKarteikartenIndex(0)
        setKarteikartenResults([])
        setKarteikartenFlipped(false)
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('karteikarten')
        return
      }
      if (id === 'lernen' && itemsAsVokabeln.length >= 2) {
        const quiz = buildVokabelQuiz(itemsAsVokabeln, Math.min(FRAGEN_ANZAHL, itemsAsVokabeln.length))
        if (quiz.length > 0) {
          setVokParts([quiz, [], []])
          setVokStation(1)
          setVokPhase('newMc')
          setVokPrevWrong([])
          setVokPrevCorrect([])
          setVokResultsNewPart({ wrong: [], correct: [] })
          setVokShowZwischenauswertung(false)
          setVokStationLernenActive(true)
          setVokStationTestMode(false)
          setVokabelQuizQuestions(quiz)
          setVokabelQuizIndex(0)
          setVokabelQuizAnswers(Array(quiz.length).fill(null))
          setVokabelQuizMode('lernen')
          setVokabelTestInput('')
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('lernen')
        }
        return
      }
      if (id === 'test' && itemsAsVokabeln.length >= 2) {
        const quiz = buildVokabelQuiz(itemsAsVokabeln, Math.min(FRAGEN_ANZAHL, itemsAsVokabeln.length))
        if (quiz.length > 0) {
          setVokParts([quiz, [], []])
          setVokStation(1)
          setVokPhase('newMc')
          setVokPrevWrong([])
          setVokPrevCorrect([])
          setVokResultsNewPart({ wrong: [], correct: [] })
          setVokShowZwischenauswertung(false)
          setVokStationLernenActive(true)
          setVokStationTestMode(true)
          setVokTestTotalCorrect(0)
          setVokTestTotalQuestions(0)
          setVokabelQuizQuestions(quiz)
          setVokabelQuizIndex(0)
          setVokabelQuizAnswers(Array(quiz.length).fill(null))
          setVokabelQuizMode('lernen')
          setVokabelTestInput('')
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('test')
        }
        return
      }
    }
    if (id === 'lernen' || id === 'test') {
      if ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 2 && effectiveVokabelSetId) {
        const ordered = orderByDueFirst(effectiveVokabelSetId, effectiveVokabelItems)
        if (id === 'lernen') {
          const { part1, part2, part3 } = buildVokabelFullPoolAndParts(effectiveVokabelSetId, ordered, effectiveVokabelItems)
          if (part1.length === 0) return
          setVokParts([part1, part2, part3])
          setVokStation(1)
          setVokPhase('newMc')
          setVokPrevWrong([])
          setVokPrevCorrect([])
          setVokResultsNewPart({ wrong: [], correct: [] })
          setVokShowZwischenauswertung(false)
          setVokStationLernenActive(true)
          setVokStationTestMode(false)
          setVokabelQuizQuestions(part1)
          setVokabelQuizIndex(0)
          setVokabelQuizAnswers(Array(part1.length).fill(null))
          setVokabelQuizMode('lernen')
          setVokabelTestInput('')
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('lernen')
        } else if (id === 'test') {
          const { part1, part2, part3 } = buildVokabelFullPoolAndParts(effectiveVokabelSetId, ordered, effectiveVokabelItems)
          if (part1.length === 0) return
          setVokParts([part1, part2, part3])
          setVokStation(1)
          setVokPhase('newMc')
          setVokPrevWrong([])
          setVokPrevCorrect([])
          setVokResultsNewPart({ wrong: [], correct: [] })
          setVokShowZwischenauswertung(false)
          setVokStationLernenActive(true)
          setVokStationTestMode(true)
          setVokTestTotalCorrect(0)
          setVokTestTotalQuestions(0)
          setVokabelQuizQuestions(part1)
          setVokabelQuizIndex(0)
          setVokabelQuizAnswers(Array(part1.length).fill(null))
          setVokabelQuizMode('lernen')
          setVokabelTestInput('')
          sessionStartRef.current = Date.now()
          statistikRecordedRef.current = false
          setStep('test')
        }
        return
      }
      if (view === 'vokabeln') return
      if (view === 'ki-lernsets' && selectedAiDeklSet && (id === 'lernen' || id === 'test' || (id as string) === 'anschauen' || (id as string) === 'karteikarten' || (id as string) === 'wortpaare' || (id as string) === 'glücksrad' || (id as string) === 'rennen')) {
        const examples = beispiele
        if ((id as string) === 'anschauen') {
          setStep('anschauen')
          return
        }
        if (id === 'lernen' && examples.length > 0) {
          const { part1, part2, part3 } = buildDeklinationFullPoolAndParts(examples)
          if (part1.length > 0) {
            setDekParts([part1, part2, part3])
            setDekStation(1)
            setDekPhase('newMc')
            setDekPrevWrong([])
            setDekPrevCorrect([])
            setDekResultsNewPart({ wrong: [], correct: [] })
            setDekShowZwischenauswertung(false)
            setDekStationLernenActive(true)
            setDekStationTestMode(false)
            setQuizQuestions(part1)
            setQuizIndex(0)
            setQuizAnswers(Array(part1.length).fill(null))
            setQuizMode('lernen')
            setTestInput('')
            sessionStartRef.current = Date.now()
            statistikRecordedRef.current = false
            setStep('lernen')
          }
          return
        }
        if (id === 'test' && examples.length > 0) {
          const { part1, part2, part3 } = buildDeklinationFullPoolAndParts(examples)
          if (part1.length > 0) {
            setDekParts([part1, part2, part3])
            setDekStation(1)
            setDekPhase('newMc')
            setDekPrevWrong([])
            setDekPrevCorrect([])
            setDekResultsNewPart({ wrong: [], correct: [] })
            setDekShowZwischenauswertung(false)
            setDekStationLernenActive(true)
            setDekStationTestMode(true)
            setDekTestTotalCorrect(0)
            setDekTestTotalQuestions(0)
            setQuizQuestions(part1)
            setQuizIndex(0)
            setQuizAnswers(Array(part1.length).fill(null))
            setQuizMode('lernen')
            setTestInput('')
            sessionStartRef.current = Date.now()
            statistikRecordedRef.current = false
            setStep('test')
          }
          return
        }
        if (((id as string) === 'karteikarten' || (id as string) === 'wortpaare' || (id as string) === 'glücksrad' || (id as string) === 'rennen') && examples.length > 0) {
          if ((id as string) === 'karteikarten') {
            setKarteikartenItems(shuffle(buildDeklinationKarteikarten(examples)))
            setKarteikartenIndex(0)
            setKarteikartenResults([])
            sessionStartRef.current = Date.now()
            statistikRecordedRef.current = false
            setStep('karteikarten')
          } else if ((id as string) === 'wortpaare') {
            const cards = buildDeklinationWortpaare(examples)
            if (cards.length >= 4) {
              setWortpaareCards(shuffle(cards))
              setWortpaareFlipped([])
              setWortpaareMatched([])
              setWortpaareStartTime(Date.now())
              setWortpaareEndTime(null)
              setWortpaareElapsedMs(0)
              setWortpaareLessonKey(`ki-dekl-${selectedAiDeklinationSetId}`)
              setWortpaareIsNewBest(false)
              setWortpaareOhneZeit(false)
              sessionStartRef.current = Date.now()
              statistikRecordedRef.current = false
              setStep('wortpaare')
            }
          } else if ((id as string) === 'glücksrad') {
            const quiz = buildQuiz(examples)
            const qs = quiz.map(quizFrageToVokabelQuizFrage)
            if (qs.length > 0) {
              setGlücksradQuestions(qs.slice(0, 10))
              setGlücksradIndex(0)
              setGlücksradAnswers(Array(Math.min(10, qs.length)).fill(null))
              setGlücksradSpinning(false)
              setGlücksradLanded(false)
              sessionStartRef.current = Date.now()
              statistikRecordedRef.current = false
              setStep('glücksrad')
            }
          } else if ((id as string) === 'rennen') {
            const quiz = buildQuiz(examples)
            const qs = quiz.map(quizFrageToVokabelQuizFrage)
            if (qs.length >= 2) {
              setRennenDifficulty('mittel')
              setRennenQuestions(qs.slice(0, 10))
              setRennenIndex(0)
              setRennenAnswers(Array(Math.min(10, qs.length)).fill(null))
              setRennenCarProgress(0)
              setRennenOpponentProgress(0)
              setRennenStartTime(Date.now())
              setRennenElapsedMs(0)
              sessionStartRef.current = Date.now()
              statistikRecordedRef.current = false
              setStep('rennen')
            }
          }
        }
        return
      }
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

      if (id === 'lernen') {
        const { part1, part2, part3 } = buildDeklinationFullPoolAndParts(examples)
        if (part1.length === 0) return
        setDekParts([part1, part2, part3])
        setDekStation(1)
        setDekPhase('newMc')
        setDekPrevWrong([])
        setDekPrevCorrect([])
        setDekResultsNewPart({ wrong: [], correct: [] })
        setDekShowZwischenauswertung(false)
        setDekStationLernenActive(true)
        setDekStationTestMode(false)
        setQuizQuestions(part1)
        setQuizIndex(0)
        setQuizAnswers(Array(part1.length).fill(null))
        setQuizMode('lernen')
        setTestInput('')
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('lernen')
        return
      }
      if (id === 'test') {
        const { part1, part2, part3 } = buildDeklinationFullPoolAndParts(examples)
        if (part1.length === 0) return
        setDekParts([part1, part2, part3])
        setDekStation(1)
        setDekPhase('newMc')
        setDekPrevWrong([])
        setDekPrevCorrect([])
        setDekResultsNewPart({ wrong: [], correct: [] })
        setDekShowZwischenauswertung(false)
        setDekStationLernenActive(true)
        setDekStationTestMode(true)
        setDekTestTotalCorrect(0)
        setDekTestTotalQuestions(0)
        setQuizQuestions(part1)
        setQuizIndex(0)
        setQuizAnswers(Array(part1.length).fill(null))
        setQuizMode('lernen')
        setTestInput('')
        sessionStartRef.current = Date.now()
        statistikRecordedRef.current = false
        setStep('test')
        return
      }

      const questions = buildQuiz(examples)
      setQuizQuestions(questions)
      setQuizIndex(0)
      setQuizAnswers(Array(questions.length).fill(null))
      setQuizMode(id)
      setTestInput('')
      setDekStationLernenActive(false)
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
      setDekStationLernenActive(false)
      setDekShowZwischenauswertung(false)
      setVokStationLernenActive(false)
      setVokShowZwischenauswertung(false)
      setShowDekTestAuswertung(false)
      setShowVokTestAuswertung(false)
      return
    }
    if (step === 'spiel' && view === 'sachkunde') {
      setStep('chooseMode')
      setSachkundeSpielCards([])
      setSachkundeSpielFlipped([])
      setSachkundeSpielMatched([])
      return
    }
    if (view === 'fach') {
      setView('themen')
      setSelectedFachId(null)
      setBreadcrumb([])
      return
    }
    if (step === 'chooseMode') {
      if (view === 'vokabeln' && selectedFachId) {
        setView('fach')
        setStep(null)
        setSelectedLernsetId(null)
        const fach = getFachById(selectedFachId)
        setBreadcrumb(fach ? [fach.name] : [])
        return
      }
      if (view === 'ki-lernsets' && selectedFachId) {
        setView('fach')
        setStep(null)
        setSelectedAiDeklinationSetId(null)
        setKiSubCategory(null)
        const fach = getFachById(selectedFachId)
        setBreadcrumb(fach ? [fach.name] : [])
        return
      }
      setStep(null)
      setSelectedTyp(null)
      setSelectedLernsetId(null)
      setSelectedSachkundeTopicId(null)
      setSelectedGrammatikTopicId(null)
      setSelectedAiDeklinationSetId(null)
      return
    }
    if (view === 'ki-lernsets' && !kiSubCategory && !selectedAiDeklinationSetId && selectedFachId) {
      setView('fach')
      const fach = getFachById(selectedFachId)
      setBreadcrumb(fach ? [fach.name] : [])
      return
    }
    if (view === 'grammatik' && step === null) {
      setView('themen')
      setBreadcrumb([])
      setSelectedKlassenstufe(null)
      return
    }
    if (view === 'vokabeln' && fromKiLernsetsVokabeln) {
      goTo('ki-lernsets', ['KI-Lernsets'], true)
      return
    }
    if (view === 'ki-lernsets' && selectedKarteikartenSetId) {
      setSelectedKarteikartenSetId(null)
      setStep(null)
      return
    }
    if (view === 'ki-lernsets' && selectedAiDeklinationSetId) {
      setSelectedAiDeklinationSetId(null)
      setStep(null)
      return
    }
    if (view === 'ki-lernsets' && kiSubCategory) {
      setKiSubCategory(null)
      setBreadcrumb(['KI-Lernsets'])
      return
    }
    if (view === 'ki-lernsets') {
      if (selectedFachId) {
        setView('fach')
        setStep(null)
        const fach = getFachById(selectedFachId)
        setBreadcrumb(fach ? [fach.name] : [])
      } else if (selectedKlassenstufe != null) {
        setView('grammatik')
        setStep(null)
        setBreadcrumb([`Klasse ${selectedKlassenstufe}`])
      } else {
        goTo('themen', [], true)
      }
      return
    }
    if (view === 'vokabeln') {
      if (selectedFachId) {
        setView('fach')
        setStep(null)
        setSelectedLernsetId(null)
        const fach = getFachById(selectedFachId)
        setBreadcrumb(fach ? [fach.name] : [])
      } else if (selectedKlassenstufe != null) {
        setView('grammatik')
        setStep(null)
        setBreadcrumb([`Klasse ${selectedKlassenstufe}`])
      } else {
        goTo('themen', [], true)
      }
      return
    }
    if (view === 'deklinationen') {
      if (selectedKlassenstufe != null) {
        setView('grammatik')
        setStep(null)
        setBreadcrumb([`Klasse ${selectedKlassenstufe}`])
      } else {
        goTo('themen', [], true)
      }
      return
    }
    if (view === 'sachkunde' && step === null) {
      if (selectedKlassenstufe != null) {
        setView('grammatik')
        setBreadcrumb([`Klasse ${selectedKlassenstufe}`])
      } else {
        goTo('themen', [], true)
      }
      return
    }
    if (view === 'verben' || view === 'substantive' || view === 'adjektive')
      goTo('deklinationen', ['Endungen'], true)
  }

  const handleQuizAnswer = (optionIndex: number) => {
    if (quizAnswers[quizIndex] !== null) return
    const currentQ = quizQuestions[quizIndex]
    const correct = optionIndex === currentQ.correctIndex
    const newAnswers = [...quizAnswers]
    newAnswers[quizIndex] = optionIndex
    const reQueueWrong = quizMode === 'lernen' && !correct && !dekStationLernenActive
    if (reQueueWrong) {
      setQuizQuestions((prev) => [...prev, prev[quizIndex]])
      setQuizAnswers([...newAnswers, null])
      setQuizIndex(quizIndex + 1)
    } else {
      setQuizAnswers(newAnswers)
      if (quizIndex < quizQuestions.length - 1) {
        setTimeout(() => setQuizIndex(quizIndex + 1), 400)
      }
    }
  }

  const handleTestPrüfen = () => {
    if (quizAnswers[quizIndex] !== null) return
    const answer = testInput.trim()
    const currentQ = quizQuestions[quizIndex]
    const correct = normalizeLatin(answer) === normalizeLatin(currentQ.correctAnswer)
    const newAnswers = [...quizAnswers]
    newAnswers[quizIndex] = answer
    setTestInput('')
    const reQueueWrong = quizMode === 'lernen' && !correct && !dekStationLernenActive
    if (reQueueWrong) {
      setQuizQuestions((prev) => [...prev, prev[quizIndex]])
      setQuizAnswers((prev) => [...prev, null])
      setQuizIndex(quizIndex + 1)
    } else {
      setQuizAnswers(newAnswers)
      if (quizIndex < quizQuestions.length - 1) {
        setTimeout(() => setQuizIndex(quizIndex + 1), 400)
      }
    }
  }

  const handleDekZwischenWeiter = () => {
    setDekShowZwischenauswertung(false)
    dekCompletedRef.current = false
    if (dekStation === 5 && dekZwischenFromPhase === 'correctTest') {
      setDekStationLernenActive(false)
      return
    }
    if (dekStationTestMode && dekStation === 4 && dekZwischenFromPhase === 'correctTest') {
      setShowDekTestAuswertung(true)
      setDekStationLernenActive(false)
      return
    }
    if (dekZwischenFromPhase === 'newMc') {
      setDekPrevWrong(dekResultsNewPart.wrong)
      setDekPrevCorrect(dekResultsNewPart.correct)
    }
    if (dekZwischenFromPhase === 'newMc' && dekStation <= 2) {
      const nextStation = (dekStation + 1) as 2 | 3
      setDekStation(nextStation)
      setDekPhase('newMc')
      const [, part2, part3] = dekParts
      const nextPart = nextStation === 2 ? part2 : part3
      setQuizQuestions(nextPart)
      setQuizIndex(0)
      setQuizAnswers(Array(nextPart.length).fill(null))
      setQuizMode('lernen')
      setTestInput('')
      return
    }
    if (dekZwischenFromPhase === 'newMc' && dekStation === 3) {
      setDekStation(4)
      if (dekStationTestMode) {
        setDekPhase('correctTest')
        setQuizQuestions(dekPrevCorrect)
        setQuizIndex(0)
        setQuizAnswers(Array(dekPrevCorrect.length).fill(null))
        setQuizMode('test')
        setTestInput('')
        if (dekPrevCorrect.length === 0) {
          setShowDekTestAuswertung(true)
          setDekStationLernenActive(false)
        }
        return
      } else {
        const wrongQueue = dekPrevWrong.length > 0 ? dekPrevWrong : dekResultsNewPart.wrong
        if (wrongQueue.length === 0) {
          setDekPhase('correctTest')
          setQuizQuestions(dekPrevCorrect)
          setQuizIndex(0)
          setQuizAnswers(Array(dekPrevCorrect.length).fill(null))
          setQuizMode('test')
        } else {
          setDekPhase('wrongMc')
          setQuizQuestions(wrongQueue)
          setQuizIndex(0)
          setQuizAnswers(Array(wrongQueue.length).fill(null))
          setQuizMode('lernen')
        }
      }
      setTestInput('')
      return
    }
    if (dekZwischenFromPhase === 'correctTest' && dekStation === 4 && !dekStationTestMode) {
      setDekStation(5)
      if (dekPrevWrong.length === 0) {
        setDekPhase('correctTest')
        setQuizQuestions(dekPrevCorrect)
        setQuizIndex(0)
        setQuizAnswers(Array(dekPrevCorrect.length).fill(null))
        setQuizMode('test')
      } else {
        setDekPhase('wrongMc')
        setQuizQuestions(dekPrevWrong)
        setQuizIndex(0)
        setQuizAnswers(Array(dekPrevWrong.length).fill(null))
        setQuizMode('lernen')
      }
      setTestInput('')
      return
    }
  }

  const handleVokZwischenWeiter = () => {
    setVokShowZwischenauswertung(false)
    vokCompletedRef.current = false
    if (vokStation === 5 && vokZwischenFromPhase === 'correctTest') {
      setVokStationLernenActive(false)
      return
    }
    if (vokStationTestMode && vokStation === 4 && vokZwischenFromPhase === 'correctTest') {
      setShowVokTestAuswertung(true)
      setVokStationLernenActive(false)
      return
    }
    if (vokZwischenFromPhase === 'newMc') {
      setVokPrevWrong(vokResultsNewPart.wrong)
      setVokPrevCorrect(vokResultsNewPart.correct)
    }
    if (vokZwischenFromPhase === 'newMc' && vokStation <= 2) {
      const nextStation = (vokStation + 1) as 2 | 3
      setVokStation(nextStation)
      setVokPhase('newMc')
      const [, part2, part3] = vokParts
      const nextPart = nextStation === 2 ? part2 : part3
      setVokabelQuizQuestions(nextPart)
      setVokabelQuizIndex(0)
      setVokabelQuizAnswers(Array(nextPart.length).fill(null))
      setVokabelQuizMode('lernen')
      setVokabelTestInput('')
      return
    }
    if (vokZwischenFromPhase === 'newMc' && vokStation === 3) {
      setVokStation(4)
      if (vokStationTestMode) {
        setVokPhase('correctTest')
        setVokabelQuizQuestions(vokPrevCorrect)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(vokPrevCorrect.length).fill(null))
        setVokabelQuizMode('test')
        setVokabelTestInput('')
        if (vokPrevCorrect.length === 0) {
          setShowVokTestAuswertung(true)
          setVokStationLernenActive(false)
        }
        return
      }
      const wrongQueue = vokPrevWrong.length > 0 ? vokPrevWrong : vokResultsNewPart.wrong
      if (wrongQueue.length === 0) {
        setVokPhase('correctTest')
        setVokabelQuizQuestions(vokPrevCorrect)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(vokPrevCorrect.length).fill(null))
        setVokabelQuizMode('test')
      } else {
        setVokPhase('wrongMc')
        setVokabelQuizQuestions(wrongQueue)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(wrongQueue.length).fill(null))
        setVokabelQuizMode('lernen')
      }
      setVokabelTestInput('')
      return
    }
    if (vokZwischenFromPhase === 'correctTest' && vokStation === 4 && !vokStationTestMode) {
      setVokStation(5)
      if (vokPrevWrong.length === 0) {
        setVokPhase('correctTest')
        setVokabelQuizQuestions(vokPrevCorrect)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(vokPrevCorrect.length).fill(null))
        setVokabelQuizMode('test')
      } else {
        setVokPhase('wrongMc')
        setVokabelQuizQuestions(vokPrevWrong)
        setVokabelQuizIndex(0)
        setVokabelQuizAnswers(Array(vokPrevWrong.length).fill(null))
        setVokabelQuizMode('lernen')
      }
      setVokabelTestInput('')
      return
    }
  }

  const isAnswerCorrect = (q: QuizFrage, answer: number | string | null): boolean => {
    if (answer === null) return false
    if (quizMode === 'lernen') return answer === q.correctIndex
    return normalizeLatin(String(answer)) === normalizeLatin(q.correctAnswer)
  }

  const handleNochEinmal = () => {
    if (!quizMode) return
    setShowDekTestAuswertung(false)
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
    setShowDekTestAuswertung(false)
    setShowVokTestAuswertung(false)
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
    if ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 2) {
      questions = buildVokabelQuiz(effectiveVokabelItems, effectiveVokabelItems.length)
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
    const now = Date.now()
    setRennenDifficulty(d)
    setRennenQuestions(questions)
    setRennenIndex(0)
    setRennenAnswers(Array(questions.length).fill(null))
    setRennenCarProgress(0)
    setRennenOpponentProgress(0)
    setRennenStartTime(now)
    setRennenElapsedMs(0)
    rennenQuestionStartRef.current = now
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
        setTimeout(() => {
          setWortpaareMatched((m) => [...m, cardA.pairId])
          setWortpaareFlipped([])
        }, 400)
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
    const now = Date.now()
    const questionStart = rennenQuestionStartRef.current ?? now
    const elapsedForQuestion = Math.max(0, now - questionStart)
    const MAX_TIME_FOR_FULL_SPEED = 8000 // ms – bis zu dieser Zeit volle Punkte
    const clamped = Math.min(elapsedForQuestion, MAX_TIME_FOR_FULL_SPEED)
    const speedFactor = 0.4 + 0.6 * (1 - clamped / MAX_TIME_FOR_FULL_SPEED) // 1.0 bei sehr schneller Antwort, 0.4 bei sehr langsamer
    const userGain = correct ? carGain * speedFactor : 0
    setRennenCarProgress((p) => Math.min(100, p + userGain))
    setRennenOpponentProgress((p) => Math.min(100, p + oppGain))
    if (rennenIndex < n - 1) {
      setTimeout(() => {
        setRennenIndex(rennenIndex + 1)
        rennenQuestionStartRef.current = Date.now()
      }, 600)
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
    const q = sachkundeQuizQuestions[sachkundeQuizIndex]
    const correct = optionIndex === q.correctIndex
    const newAnswers = [...sachkundeQuizAnswers]
    newAnswers[sachkundeQuizIndex] = optionIndex
    if (!correct) {
      setSachkundeQuizQuestions((prev) => [...prev, prev[sachkundeQuizIndex]])
      setSachkundeQuizAnswers([...newAnswers, null])
      setSachkundeQuizIndex(sachkundeQuizIndex + 1)
    } else {
      setSachkundeQuizAnswers(newAnswers)
      if (sachkundeQuizIndex < sachkundeQuizQuestions.length - 1) {
        setTimeout(() => setSachkundeQuizIndex(sachkundeQuizIndex + 1), 400)
      }
    }
  }

  const handleVokabelQuizAnswer = (optionIndex: number) => {
    if (vokabelQuizAnswers[vokabelQuizIndex] !== null) return
    const q = vokabelQuizQuestions[vokabelQuizIndex]
    const correct = optionIndex === q.correctIndex
    if (q.lernsetId != null && q.itemIndex != null) {
      recordReview(q.lernsetId, q.itemIndex, q.vokabel, correct)
    }
    const newAnswers = [...vokabelQuizAnswers]
    newAnswers[vokabelQuizIndex] = optionIndex
    if (vokabelQuizMode === 'lernen' && !correct && !vokStationLernenActive) {
      setVokabelQuizQuestions((prev) => [...prev, prev[vokabelQuizIndex]])
      setVokabelQuizAnswers([...newAnswers, null])
      setVokabelQuizIndex(vokabelQuizIndex + 1)
    } else {
      setVokabelQuizAnswers(newAnswers)
      if (vokabelQuizIndex < vokabelQuizQuestions.length - 1) {
        setTimeout(() => setVokabelQuizIndex(vokabelQuizIndex + 1), 400)
      }
    }
  }

  const handleVokabelTestPrüfen = () => {
    if (vokabelQuizAnswers[vokabelQuizIndex] !== null) return
    const answer = vokabelTestInput.trim()
    const q = vokabelQuizQuestions[vokabelQuizIndex]
    const correct = normalizeLatin(answer) === normalizeLatin(q.uebersetzung)
    if (q.lernsetId != null && q.itemIndex != null) {
      recordReview(q.lernsetId, q.itemIndex, q.vokabel, correct)
    }
    const newAnswers = [...vokabelQuizAnswers]
    newAnswers[vokabelQuizIndex] = answer
    setVokabelTestInput('')
    if (vokabelQuizMode === 'lernen' && !correct && !vokStationLernenActive) {
      setVokabelQuizQuestions((prev) => [...prev, prev[vokabelQuizIndex]])
      setVokabelQuizAnswers([...newAnswers, null])
      setVokabelQuizIndex(vokabelQuizIndex + 1)
    } else {
      setVokabelQuizAnswers(newAnswers)
      if (vokabelQuizIndex < vokabelQuizQuestions.length - 1) {
        setTimeout(() => setVokabelQuizIndex(vokabelQuizIndex + 1), 400)
      }
    }
  }

  const handleVokabelNochEinmal = () => {
    setShowVokTestAuswertung(false)
    if (effectiveVokabelSetId && effectiveVokabelItems.length >= 2) {
      const ordered = orderByDueFirst(effectiveVokabelSetId, effectiveVokabelItems)
      const questions = buildVokabelQuizFromOrdered(
        effectiveVokabelSetId,
        ordered,
        effectiveVokabelItems,
        Math.max(FRAGEN_ANZAHL, Math.min(15, ordered.length))
      )
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
    if ((view === 'substantive' || view === 'adjektive') && beispiele.length > 0) {
      setKarteikartenItems(shuffle(buildDeklinationKarteikarten(beispiele)))
      setKarteikartenIndex(0)
      setKarteikartenResults([])
      setKarteikartenFlipped(false)
      return
    }
    if ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length > 0) {
      setKarteikartenItems(shuffle(effectiveVokabelItems.map((i) => ({ front: i.vokabel, back: i.uebersetzung }))))
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
    setWortpaareElapsedMs(0)
    setWortpaareIsNewBest(false)
    if ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 4) {
      const items = effectiveVokabelItems
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
    if ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length >= 2) {
      const questions = buildVokabelQuiz(effectiveVokabelItems, Math.min(10, effectiveVokabelItems.length))
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
    setRennenStartTime(0)
    setRennenElapsedMs(0)
    rennenQuestionStartRef.current = null
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
    (view === 'grammatik' && step === 'chooseMode' && selectedGrammatikTopicId) ||
    (view === 'sachkunde' && step === 'chooseMode' && selectedSachkundeTopic) ||
    (view === 'ki-lernsets' && step === 'chooseMode' && selectedAiDeklinationSetId) ||
    (view === 'ki-lernsets' && step === 'chooseMode' && selectedKarteikartenSetId)

  const currentLessonStats = (() => {
    if (!showChooseMode) return null
    let lessonId: string
    if (view === 'vokabeln' && selectedLernsetId) lessonId = selectedLernsetId
    else if (view === 'grammatik' && selectedGrammatikTopicId) lessonId = `grammatik-${selectedGrammatikTopicId}`
    else if (view === 'sachkunde' && selectedSachkundeTopicId) lessonId = `sachkunde-${selectedSachkundeTopicId}`
    else if (view === 'ki-lernsets' && selectedKarteikartenSetId) lessonId = selectedKarteikartenSetId
    else if (view === 'verben' && isVerbenTyp(selectedTyp)) lessonId = getVerbenLessonMeta(selectedTyp!).id
    else if ((view === 'substantive' || view === 'adjektive') && selectedTyp) lessonId = `${view}-${selectedTyp}`
    else if (view === 'ki-lernsets' && selectedAiDeklinationSetId) lessonId = selectedAiDeklinationSetId
    else return null
    const byLesson = getSessionCountByLesson()
    const byAvg = getAveragePercentByLesson()
    const sessionRow = byLesson.find((x) => x.lessonId === lessonId)
    const avgRow = byAvg.find((x) => x.lessonId === lessonId)
    const count = sessionRow?.count ?? 0
    const avgPercent = avgRow?.avgPercent ?? null
    if (count === 0 && avgPercent == null) return null
    return { count, avgPercent }
  })()

  const showAnschauen =
    ((isVerben || isSubstantive || isAdjektive) && step === 'anschauen' && selectedTyp) ||
    (isVokabeln && step === 'anschauen' && selectedLernsetId) ||
    (view === 'grammatik' && step === 'anschauen' && selectedGrammatikTopicId) ||
    (view === 'sachkunde' && step === 'anschauen' && selectedSachkundeTopic) ||
    (view === 'ki-lernsets' && step === 'anschauen' && selectedAiDeklSet) ||
    (view === 'ki-lernsets' && step === 'anschauen' && selectedKarteikartenSet)
  const storedLernsets = isVokabeln ? getLernsets() : []
  const lernsets = isVokabeln ? storedLernsets : []
  const aiLernsets = isVokabeln ? lernsets.filter((s) => s.source === 'ai') : []
  const manualLernsets = isVokabeln ? lernsets.filter((s) => s.source !== 'ai') : []
  const selectedLernset = selectedLernsetId
    ? getLernsetById(selectedLernsetId) ?? null
    : null
  const effectiveVokabelItems =
    view === 'vokabeln' && selectedLernset
      ? selectedLernset.items
      : view === 'grammatik' && selectedGrammatikTopic
        ? selectedGrammatikTopic.items
        : []
  const effectiveVokabelSetId =
    view === 'vokabeln' && selectedLernset
      ? selectedLernset.id
      : view === 'grammatik' && selectedGrammatikTopic
        ? `grammatik-${selectedGrammatikTopic.id}`
        : null
  const effectiveVokabelSetName =
    view === 'vokabeln' && selectedLernset
      ? selectedLernset.name
      : view === 'grammatik' && selectedGrammatikTopic
        ? selectedGrammatikTopic.title
        : null

  const allSearchItems = [
    ...getLernsets().map((s) => ({ type: 'vokabeln' as const, id: s.id, title: s.name })),
    ...GRAMMATIK_TOPICS.map((t) => ({ type: 'grammatik' as const, id: t.id, title: t.shortTitle ?? t.title })),
  ]
  const searchQueryNorm = searchQuery.trim().toLowerCase()
  const searchResults =
    searchQueryNorm.length >= 2
      ? allSearchItems.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQueryNorm) ||
            searchQueryNorm.split(/\s+/).every((w) => item.title.toLowerCase().includes(w))
        )
      : []

  const handleSearchResultClick = (type: 'vokabeln' | 'grammatik', id: string) => {
    setSearchQuery('')
    if (type === 'vokabeln') {
      goTo('vokabeln', ['Vokabeln'], false)
      setSelectedLernsetId(id)
      setStep('chooseMode')
    } else {
      const topic = getGrammatikTopic(id)
      if (topic) setSelectedKlassenstufe(topic.klasse)
      setView('grammatik')
      setBreadcrumb(topic ? [`Klasse ${topic.klasse}`] : ['Grammatik'])
      setSelectedGrammatikTopicId(id)
      setStep('chooseMode')
    }
  }

  const showQuiz = (step === 'lernen' || step === 'test') && quizQuestions.length > 0 && view !== 'vokabeln' && view !== 'grammatik' && view !== 'sachkunde'
  const allAnswered = showQuiz && quizAnswers.every((a) => a !== null)
  const showAuswertung =
    (showQuiz && allAnswered && !dekShowZwischenauswertung) ||
    (showDekTestAuswertung && step === 'test' && (view === 'substantive' || view === 'adjektive' || view === 'ki-lernsets'))
  const showVokabelnQuiz = (view === 'vokabeln' || view === 'grammatik' || (view === 'ki-lernsets' && !!selectedKarteikartenSetId)) && (step === 'lernen' || step === 'test') && vokabelQuizQuestions.length > 0
  const vokabelnQuizAllAnswered = showVokabelnQuiz && vokabelQuizAnswers.every((a) => a !== null)
  const showVokabelnQuizAuswertung =
    (showVokabelnQuiz && vokabelnQuizAllAnswered && !vokShowZwischenauswertung) ||
    (showVokTestAuswertung && step === 'test' && (view === 'vokabeln' || view === 'grammatik' || (view === 'ki-lernsets' && !!selectedKarteikartenSetId)))
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

  type SegmentState = 'correct' | 'wrong' | null
  function getStreakFromSegments(segments: SegmentState[]): number {
    let streak = 0
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i] === 'correct') streak++
      else break
    }
    return streak
  }

  const MOTIVATION_PHRASES = [
    'Du schaffst das!',
    'Weiter so!',
    'Super konzentriert!',
    'Gut unterwegs!',
    'Fast geschafft!',
    'Bleib dran!',
    'Sehr gut!',
    'Du bist auf Kurs!',
    'Noch ein bisschen!',
    'Gut gemacht!',
  ]

  let progressSegments: SegmentState[] = []
  let progressTotal = 0
  let progressAnswered = 0
  if ((step === 'lernen' || step === 'test') && (showQuiz || showVokabelnQuiz || showSachkundeQuiz) && !showAuswertung && !showVokabelnQuizAuswertung && !showSachkundeQuizAuswertung) {
    if (showQuiz) {
      progressTotal = quizQuestions.length
      progressSegments = quizAnswers.map((a, i) =>
        a === null ? null : isAnswerCorrect(quizQuestions[i], a) ? 'correct' : 'wrong'
      )
    } else if (showVokabelnQuiz) {
      progressTotal = vokabelQuizQuestions.length
      progressSegments = vokabelQuizAnswers.map((a, i) =>
        a === null ? null : isVokabelAnswerCorrect(vokabelQuizQuestions[i], a) ? 'correct' : 'wrong'
      )
    } else if (showSachkundeQuiz) {
      progressTotal = sachkundeQuizQuestions.length
      progressSegments = sachkundeQuizAnswers.map((a, i) =>
        a === null ? null : a === sachkundeQuizQuestions[i].correctIndex ? 'correct' : 'wrong'
      )
    }
    progressAnswered = progressSegments.filter((s) => s !== null).length
  } else if (showKarteikarten && !showKarteikartenAuswertung && karteikartenItems.length > 0) {
    progressTotal = karteikartenItems.length
    progressSegments = karteikartenItems.map((_, i) =>
      i < karteikartenResults.length ? (karteikartenResults[i] ? 'correct' : 'wrong') : null
    )
    progressAnswered = karteikartenResults.length
  } else if (showGlücksrad && !showGlücksradAuswertung && glücksradQuestions.length > 0) {
    progressTotal = glücksradQuestions.length
    progressSegments = glücksradAnswers.map((a, i) =>
      a === null ? null : a === glücksradQuestions[i].correctIndex ? 'correct' : 'wrong'
    )
    progressAnswered = progressSegments.filter((s) => s !== null).length
  } else if (showRennen && !showRennenAuswertung && rennenQuestions.length > 0) {
    progressTotal = rennenQuestions.length
    progressSegments = rennenAnswers.map((a, i) =>
      a === null ? null : a === rennenQuestions[i].correctIndex ? 'correct' : 'wrong'
    )
    progressAnswered = progressSegments.filter((s) => s !== null).length
  } else if (showWortpaare && !showWortpaareAuswertung && pairCount > 0) {
    progressTotal = pairCount
    progressSegments = Array.from({ length: pairCount }, (_, i) =>
      i < wortpaareMatched.length ? 'correct' : null
    )
    progressAnswered = wortpaareMatched.length
  }

  const progressStreak = getStreakFromSegments(progressSegments)
  const progressMotivation =
    progressTotal > 0
      ? MOTIVATION_PHRASES[(progressStreak + progressAnswered) % MOTIVATION_PHRASES.length]
      : ''

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
  const dekTestPercent =
    step === 'test' && (view === 'substantive' || view === 'adjektive' || view === 'ki-lernsets') && dekTestTotalQuestions > 0
      ? Math.round((100 * dekTestTotalCorrect) / dekTestTotalQuestions)
      : 0
  const vokTestPercent =
    step === 'test' && view === 'vokabeln' && vokTestTotalQuestions > 0
      ? Math.round((100 * vokTestTotalCorrect) / vokTestTotalQuestions)
      : 0
  const effectivePercent =
    showAuswertung && dekTestTotalQuestions > 0 && (view === 'substantive' || view === 'adjektive' || view === 'ki-lernsets')
      ? dekTestPercent
      : showVokabelnQuizAuswertung && vokTestTotalQuestions > 0
        ? vokTestPercent
        : showVokabelnQuizAuswertung
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
  const showTestGrade =
    (showAuswertung && dekTestTotalQuestions > 0 && (view === 'substantive' || view === 'adjektive' || view === 'ki-lernsets')) ||
    (showVokabelnQuizAuswertung && vokTestTotalQuestions > 0 && view === 'vokabeln')
  const testGrade = showTestGrade ? percentToGrade(effectivePercent) : null
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
  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.15, start)
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration)
        osc.start(start)
        osc.stop(start + duration)
      }
      playTone(523.25, 0, 0.15)
      playTone(659.25, 0.15, 0.2)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!showAnyAuswertung || effectivePercent !== 100 || hasFiredConfettiRef.current) return
    hasFiredConfettiRef.current = true
    const mega = hasKonfettiExplosion
    if (isOwned('erfolgs-sound')) playSuccessSound()
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
  }, [showAnyAuswertung, effectivePercent, hasKonfettiExplosion, playSuccessSound])

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
    } else if (view === 'grammatik' && selectedGrammatikTopicId && selectedGrammatikTopic) {
      lessonId = `grammatik-${selectedGrammatikTopicId}`
      lessonName = selectedGrammatikTopic.title
    } else if (view === 'sachkunde' && selectedSachkundeTopicId && selectedSachkundeTopic) {
      lessonId = `sachkunde-${selectedSachkundeTopicId}`
      lessonName = selectedSachkundeTopic.title
    } else if (view === 'ki-lernsets' && selectedKarteikartenSetId && selectedKarteikartenSet) {
      lessonId = selectedKarteikartenSetId
      lessonName = selectedKarteikartenSet.name
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
    const bonus = kronenResult.awarded > 0 && isOwned('taeglicher-bonus') ? addDailyBonusIfEligible() : 0
    setCrownsEarned(kronenResult.awarded + bonus)
    if (kronenResult.awarded + bonus > 0) setShowCrownRewardScreen(true)
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
    selectedGrammatikTopicId,
    selectedGrammatikTopic,
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
    (effectiveVokabelSetName ?? null) ??
    (view === 'sachkunde' && selectedSachkundeTopic ? selectedSachkundeTopic.title : null) ??
    (view === 'ki-lernsets' && selectedKarteikartenSet ? selectedKarteikartenSet.name : null) ??
    (view === 'ki-lernsets' && selectedAiDeklSet ? selectedAiDeklSet.title : null) ??
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

  const handleShareLernset = async () => {
    if (!selectedLernset) return
    setShareLernsetFeedback('idle')
    const ok = await share(getShareLernsetPayload(selectedLernset))
    setShareLernsetFeedback(ok ? 'ok' : 'fail')
    if (ok) setTimeout(() => setShareLernsetFeedback('idle'), 2000)
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
    (dekStationLernenActive && !dekShowZwischenauswertung) || (vokStationLernenActive && !vokShowZwischenauswertung)
      ? `Station ${dekStationLernenActive ? dekStation : vokStation} von 5`
      : (step === 'lernen' || step === 'test') && !showAuswertung && !showVokabelnQuizAuswertung && !showSachkundeQuizAuswertung && (showQuiz || showVokabelnQuiz || showSachkundeQuiz)
        ? `Frage ${showSachkundeQuiz ? sachkundeQuizIndex + 1 : showVokabelnQuiz ? vokabelQuizIndex + 1 : quizIndex + 1} / ${showSachkundeQuiz ? sachkundeQuizQuestions.length : showVokabelnQuiz ? vokabelQuizQuestions.length : quizQuestions.length}`
        : showKarteikarten && !showKarteikartenAuswertung
        ? `Karte ${karteikartenIndex + 1} / ${karteikartenItems.length}`
        : showWortpaare && !showWortpaareAuswertung
          ? wortpaareOhneZeit
            ? `Paare: ${wortpaareMatched.length} / ${pairCountDerived}`
            : `Zeit: ${Math.floor(wortpaareElapsedMs / 60000)}:${(Math.floor(wortpaareElapsedMs / 1000) % 60).toString().padStart(2, '0')}.${(Math.floor(wortpaareElapsedMs / 10) % 100).toString().padStart(2, '0')}`
          : showGlücksrad && !showGlücksradAuswertung
            ? `Frage ${glücksradIndex + 1} / ${glücksradQuestions.length}`
            : showRennen && !showRennenAuswertung
              ? `Rennzeit: ${Math.floor(rennenElapsedMs / 60000)}:${(Math.floor(rennenElapsedMs / 1000) % 60)
                  .toString()
                  .padStart(2, '0')}.${(Math.floor(rennenElapsedMs / 10) % 100)
                  .toString()
                  .padStart(2, '0')} – Frage ${rennenIndex + 1} / ${rennenQuestions.length}`
              : ''

  const handleContinueWeiter = () => setShowContinueDialog(false)
  const handleContinueVonVorn = () => {
    setView('themen')
    setBreadcrumb([])
    setSelectedTyp(null)
    setSelectedLernsetId(null)
    setSelectedSachkundeTopicId(null)
    setStep(null)
    setShowContinueDialog(false)
  }

  return (
    <div className={`lernen-page ${view === 'themen' ? 'lernen-page--start' : ''}`}>
      {showContinueDialog && (
        <div className="lernen-continue-overlay" role="dialog" aria-modal="true" aria-labelledby="lernen-continue-title">
          <div className="lernen-continue-backdrop" onClick={handleContinueWeiter} aria-hidden />
          <div className="lernen-continue-dialog">
            <h2 id="lernen-continue-title" className="lernen-continue-title">Weiter lernen?</h2>
            <p className="lernen-continue-text">
              Du warst zuletzt hier. Möchtest du hier weitermachen oder von vorn starten?
            </p>
            <div className="lernen-continue-buttons">
              <button type="button" className="lernen-continue-btn lernen-continue-btn--weiter" onClick={handleContinueWeiter}>
                Weiter hier
              </button>
              <button type="button" className="lernen-continue-btn lernen-continue-btn--vorn" onClick={handleContinueVonVorn}>
                Von vorn
              </button>
            </div>
          </div>
        </div>
      )}
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
          {showProgress && progressTotal === 0 && (
            <span className={`lernen-progress-pill ${showWortpaare && !showWortpaareAuswertung ? 'lernen-progress-pill--timer' : ''}`}>
              {progressText}
            </span>
          )}
        </div>
      </header>

      <div className="lernen-search-wrap">
        <input
          type="search"
          className="lernen-search-input"
          placeholder="Lernsets durchsuchen … (Vokabeln & Grammatik)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Lernsets durchsuchen"
          autoComplete="off"
        />
        {searchQueryNorm.length >= 2 && (
          <div className="lernen-search-results" role="listbox" aria-label="Suchergebnisse">
            {searchResults.length === 0 ? (
              <p className="lernen-search-empty">Keine Lernsets gefunden.</p>
            ) : (
              <ul className="lernen-search-list">
                {searchResults.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      className="lernen-search-result-btn"
                      onClick={() => handleSearchResultClick(item.type, item.id)}
                      role="option"
                    >
                      <span className="lernen-search-result-title">{item.title}</span>
                      <span className={`lernen-search-result-badge lernen-search-result-badge--${item.type}`}>
                        {item.type === 'vokabeln' ? 'Vokabeln' : 'Grammatik'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {(dekStationLernenActive || vokStationLernenActive) && (
        <div className="lernen-progress-bar-wrap lernen-progress-bar-wrap--stations">
          <div className="lernen-progress-bar-meta">
            <span className="lernen-progress-bar-motivation" aria-hidden>
              {progressMotivation}
            </span>
            <span className="lernen-progress-bar-count">Station {dekStationLernenActive ? dekStation : vokStation} von 5</span>
          </div>
          <div className="lernen-progress-bar lernen-progress-bar--stations" role="progressbar" aria-valuenow={dekStationLernenActive ? dekStation : vokStation} aria-valuemin={1} aria-valuemax={5} aria-label={`Station ${dekStationLernenActive ? dekStation : vokStation} von 5`}>
            {([1, 2, 3, 4, 5] as const).map((s) => {
              const currentStation = dekStationLernenActive ? dekStation : vokStation
              return (
                <div key={s} className={`lernen-progress-bar-segment lernen-progress-bar-segment--station ${s <= currentStation ? 'lernen-progress-bar-segment--done' : ''} ${s === currentStation ? 'lernen-progress-bar-segment--current' : ''}`} title={`Station ${s}`} />
              )
            })}
          </div>
        </div>
      )}

      {showProgress && progressTotal > 0 && !dekStationLernenActive && !vokStationLernenActive && (
        <div className="lernen-progress-bar-wrap">
          <div className="lernen-progress-bar-meta">
            <span className="lernen-progress-bar-motivation" aria-hidden>
              {progressMotivation}
            </span>
            {progressStreak > 0 && (
              <span className="lernen-progress-bar-streak" aria-label={`${progressStreak} richtige in Folge`}>
                <span className="lernen-progress-bar-streak-icon" aria-hidden>🔥</span>
                <span>{progressStreak}</span>
                <span className="lernen-progress-bar-streak-label"> in Folge</span>
              </span>
            )}
          </div>
          <div
            className="lernen-progress-bar"
            role="progressbar"
            aria-valuenow={progressAnswered}
            aria-valuemin={0}
            aria-valuemax={progressTotal}
            aria-label={`Fortschritt: ${progressAnswered} von ${progressTotal}`}
          >
            {progressSegments.map((state, i) => (
              <div
                key={i}
                className={`lernen-progress-bar-segment lernen-progress-bar-segment--${state ?? 'pending'}`}
                title={state === 'correct' ? 'Richtig' : state === 'wrong' ? 'Falsch' : 'Noch nicht beantwortet'}
              />
            ))}
          </div>
          <div className="lernen-progress-bar-count">
            {progressAnswered} / {progressTotal}
          </div>
        </div>
      )}

      {view === 'themen' && (
        <p className="lernen-welcome">Noch keine Inhalte – erstelle Lernsets unter Lernsets &amp; KI</p>
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
              <div className="lernen-inhalt lernen-empty-state">
                <p className="lernen-modus-frage">Lernen</p>
                <p className="lernen-placeholder">Noch keine Inhalte.</p>
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
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Fächer</p>
              <p className="lernen-modus-untertitel">Wähle einen Ordner – deine Lernsets sind nach Fächern sortiert.</p>
              <div className="lernen-grid lernen-grid--faecher">
                {getFaecher().map((fach, i) => (
                  <button
                    key={fach.id}
                    type="button"
                    className="lernen-folder"
                    onClick={() => {
                      setView('fach')
                      setSelectedFachId(fach.id)
                      setBreadcrumb([fach.name])
                    }}
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      ['--folder-color' as string]: fach.color,
                      ['--folder-color-dark' as string]: fach.color,
                    }}
                  >
                    <span className="lernen-folder-tab" aria-hidden />
                    <span className="lernen-folder-body">
                      <span className="lernen-folder-icon" aria-hidden>
                        {(() => {
                          const Icon = FAECHER_ICON_MAP[fach.id]
                          return Icon ? <Icon className="lernen-folder-icon-svg" /> : null
                        })()}
                      </span>
                      <span className="lernen-folder-name">{fach.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {view === 'fach' && selectedFachId && (
            <div className="lernen-inhalt lernen-fach-inhalt">
              {(() => {
                const fach = getFachById(selectedFachId)
                const vokabelSets = getLernsetsByFach(selectedFachId)
                const deklSets = getAiDeklinationSetsByFach(selectedFachId)
                const karteikartenSets = getKarteikartenSetsByFach(selectedFachId)
                if (!fach) return <p className="lernen-placeholder">Fach nicht gefunden.</p>
                const hasContent = vokabelSets.length > 0 || deklSets.length > 0 || karteikartenSets.length > 0
                return (
                  <>
                    <p className="lernen-modus-frage">{fach.name}</p>
                    <p className="lernen-modus-untertitel">Wähle ein Lernset zum Üben.</p>
                    {!hasContent ? (
                      <p className="lernen-placeholder">In diesem Fach sind noch keine Lernsets. Erstelle welche unter „Lernsets &amp; KI“ und ordne sie diesem Fach zu.</p>
                    ) : (
                      <div className="lernen-fach-sets">
                        {vokabelSets.length > 0 && (
                          <div className="lernen-fach-group">
                            <span className="lernen-fach-group-title">Vokabel-Lernsets</span>
                            <div className="lernen-fach-set-list">
                              {vokabelSets.map((set) => (
                                <button
                                  key={set.id}
                                  type="button"
                                  className="lernen-fach-set-btn lernen-fach-set-btn--vokabel"
                                  onClick={() => {
                                    setView('vokabeln')
                                    setSelectedLernsetId(set.id)
                                    setStep('chooseMode')
                                    setBreadcrumb([fach.name, set.name])
                                  }}
                                >
                                  <BookMarkIcon className="lernen-fach-set-icon" aria-hidden />
                                  <span className="lernen-fach-set-name">{set.name}</span>
                                  <span className="lernen-fach-set-meta">{set.items.length} Vokabeln</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {karteikartenSets.length > 0 && (
                          <div className="lernen-fach-group">
                            <span className="lernen-fach-group-title">Karteikarten</span>
                            <div className="lernen-fach-set-list">
                              {karteikartenSets.map((set) => (
                                <button
                                  key={set.id}
                                  type="button"
                                  className="lernen-fach-set-btn"
                                  onClick={() => {
                                    setView('ki-lernsets')
                                    setKiSubCategory('karteikarten')
                                    setSelectedKarteikartenSetId(set.id)
                                    setStep('chooseMode')
                                    setBreadcrumb([fach.name, set.name])
                                  }}
                                >
                                  <CardIcon className="lernen-fach-set-icon" />
                                  <span className="lernen-fach-set-name">{set.name}</span>
                                  <span className="lernen-fach-set-meta">{set.items.length} {set.items.length === 1 ? 'Karte' : 'Karten'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {deklSets.length > 0 && (
                          <div className="lernen-fach-group">
                            <span className="lernen-fach-group-title">Deklination (KI)</span>
                            <div className="lernen-fach-set-list">
                              {deklSets.map((set) => (
                                <button
                                  key={set.id}
                                  type="button"
                                  className="lernen-fach-set-btn"
                                  onClick={() => {
                                    setView('ki-lernsets')
                                    setKiSubCategory('deklination')
                                    setSelectedAiDeklinationSetId(set.id)
                                    setStep('chooseMode')
                                    setBreadcrumb([fach.name, set.title])
                                  }}
                                >
                                  <TableIcon className="lernen-fach-set-icon" />
                                  <span className="lernen-fach-set-name">{set.title}</span>
                                  <span className="lernen-fach-set-meta">{set.typ}-Deklination</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
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

          {view === 'grammatik' && step === null && (
            <div className="lernen-inhalt">
              {selectedKlassenstufe == null ? (
                <>
                  <p className="lernen-modus-frage">Welche Klasse bist du?</p>
                  <p className="lernen-modus-untertitel">Wähle deine Klassenstufe.</p>
                  <div className="lernen-grid lernen-grid--options lernen-grid--klassen">
                    {KLASSEN.map((k, i) => (
                      <button
                        key={k.id}
                        type="button"
                        className="lernen-tile lernen-tile--option lernen-tile--klasse"
                        onClick={() => handleKlasseClick(k.id)}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="lernen-tile-label">{k.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="lernen-modus-frage">Klasse {selectedKlassenstufe} – Wähle ein Thema</p>
                  <p className="lernen-modus-untertitel">Grammatik & Deklination · Vokabeln · Sachkunde · KI</p>
                  <div className="lernen-grid lernen-grid--options lernen-grid--grammatik">
                    {getGrammatikTopicsForKlasse(selectedKlassenstufe).map((topic, i) => (
                      <button
                        key={topic.id}
                        type="button"
                        className="lernen-tile lernen-tile--option lernen-tile--grammatik"
                        onClick={() => handleGrammatikTopicClick(topic.id)}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="lernen-tile-label lernen-tile-label--grammatik">{topic.shortTitle ?? topic.title}</span>
                        <span className="lernen-tile-meta">{topic.items.length} Karten</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="lernen-tile lernen-tile--option lernen-tile--dashboard-extra"
                      onClick={() => handleKlassenDashboardClick('vokabeln')}
                      style={{ animationDelay: `${(getGrammatikTopicsForKlasse(selectedKlassenstufe).length) * 0.08}s` }}
                    >
                      <BookMarkIcon className="lernen-tile-icon" />
                      <span className="lernen-tile-label">Vokabeln</span>
                      <span className="lernen-tile-meta">Eigene & KI-Sets</span>
                    </button>
                    <button
                      type="button"
                      className="lernen-tile lernen-tile--option lernen-tile--dashboard-extra"
                      onClick={() => handleKlassenDashboardClick('deklinationen')}
                      style={{ animationDelay: `${(getGrammatikTopicsForKlasse(selectedKlassenstufe).length + 1) * 0.08}s` }}
                    >
                      <TableIcon className="lernen-tile-icon" />
                      <span className="lernen-tile-label">Deklinationen üben</span>
                      <span className="lernen-tile-meta">Substantive · Adjektive · Verben</span>
                    </button>
                    <button
                      type="button"
                      className="lernen-tile lernen-tile--option lernen-tile--dashboard-extra"
                      onClick={() => handleKlassenDashboardClick('sachkunde')}
                      style={{ animationDelay: `${(getGrammatikTopicsForKlasse(selectedKlassenstufe).length + 2) * 0.08}s` }}
                    >
                      <LightbulbIcon className="lernen-tile-icon" />
                      <span className="lernen-tile-label">Sachkunde</span>
                      <span className="lernen-tile-meta">Römisches Leben</span>
                    </button>
                    <button
                      type="button"
                      className="lernen-tile lernen-tile--option lernen-tile--dashboard-extra"
                      onClick={() => handleKlassenDashboardClick('ki-lernsets')}
                      style={{ animationDelay: `${(getGrammatikTopicsForKlasse(selectedKlassenstufe).length + 3) * 0.08}s` }}
                    >
                      <ZapIcon className="lernen-tile-icon" />
                      <span className="lernen-tile-label">KI-Lernsets</span>
                      <span className="lernen-tile-meta">Mit KI erstellen</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {view === 'vokabeln' && !selectedLernsetId && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">
                {fromKiLernsetsVokabeln ? 'Welches KI-Vokabelset möchtest du?' : 'Welches Lernset möchtest du?'}
              </p>
              {(fromKiLernsetsVokabeln ? aiLernsets : lernsets).length === 0 ? (
                <p className="lernen-placeholder">
                  {fromKiLernsetsVokabeln
                    ? 'Noch keine KI-Vokabelsets. Erstelle welche unter „KI“.'
                    : 'Noch keine Lernsets vorhanden. Erstelle zuerst unter „Neu“ ein Set.'}
                </p>
              ) : (
                <>
                  {!fromKiLernsetsVokabeln && manualLernsets.length > 0 && (
                    <>
                      <p className="lernen-modus-untertitel">Eigene Lernsets</p>
                      <div className="lernen-grid lernen-grid--options">
                        {manualLernsets.map((set, i) => {
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
                                aria-label={
                                  isFav ? `${set.name} aus Favoriten entfernen` : `${set.name} zu Favoriten hinzufügen`
                                }
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
                    </>
                  )}

                  {aiLernsets.length > 0 && (
                    <>
                      {!fromKiLernsetsVokabeln && <p className="lernen-modus-untertitel">KI erstellt</p>}
                      <div className="lernen-grid lernen-grid--options">
                        {aiLernsets.map((set, i) => {
                          const isFav = favoritenIds.includes(set.id)
                          const delayBase = fromKiLernsetsVokabeln ? 0 : manualLernsets.length
                          return (
                            <button
                              key={set.id}
                              type="button"
                              className="lernen-tile lernen-tile--option lernen-tile--with-star"
                              onClick={() => {
                                setSelectedLernsetId(set.id)
                                setStep('chooseMode')
                              }}
                              style={{ animationDelay: `${(delayBase + i) * 0.08}s` }}
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
                                aria-label={
                                  isFav ? `${set.name} aus Favoriten entfernen` : `${set.name} zu Favoriten hinzufügen`
                                }
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
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'ki-lernsets' && step === null && !kiSubCategory && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Wähle eine Kategorie</p>
              <div className="lernen-grid lernen-grid--options">
                <button
                  type="button"
                  className="lernen-tile lernen-tile--option"
                  onClick={() => {
                    setFromKiLernsetsVokabeln(true)
                    goTo('vokabeln', ['KI-Lernsets', 'Vokabeln'], false)
                  }}
                  style={{ animationDelay: '0s' }}
                >
                  <BookMarkIcon className="lernen-tile-icon" />
                  <span className="lernen-tile-label">Vokabeln</span>
                  <span className="lernen-tile-meta">KI-Vokabelsets</span>
                </button>
                <button
                  type="button"
                  className="lernen-tile lernen-tile--option"
                  onClick={() => {
                    setKiSubCategory('deklination')
                    setBreadcrumb(['KI-Lernsets', 'Deklination'])
                  }}
                  style={{ animationDelay: '0.1s' }}
                >
                  <TableIcon className="lernen-tile-icon" />
                  <span className="lernen-tile-label">Deklination</span>
                  <span className="lernen-tile-meta">KI-Deklinationssets</span>
                </button>
                <button
                  type="button"
                  className="lernen-tile lernen-tile--option"
                  onClick={() => {
                    setKiSubCategory('karteikarten')
                    setBreadcrumb(['KI-Lernsets', 'Karteikarten'])
                  }}
                  style={{ animationDelay: '0.15s' }}
                >
                  <CardIcon className="lernen-tile-icon" />
                  <span className="lernen-tile-label">Karteikarten</span>
                  <span className="lernen-tile-meta">Eigene Karteikarten-Lernsets</span>
                </button>
              </div>
            </div>
          )}

          {view === 'ki-lernsets' && kiSubCategory === 'karteikarten' && !selectedKarteikartenSetId && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Welches Karteikarten-Lernset möchtest du?</p>
              {getKarteikartenSets().length === 0 ? (
                <p className="lernen-placeholder">
                  Noch keine Karteikarten-Lernsets. Erstelle welche unter „Lernsets &amp; KI“ → „Erstellen“ → „Karteikarten erstellen“.
                </p>
              ) : (
                <div className="lernen-grid lernen-grid--options">
                  {getKarteikartenSets()
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((set, i) => (
                      <button
                        key={set.id}
                        type="button"
                        className="lernen-tile lernen-tile--option"
                        onClick={() => {
                          setSelectedKarteikartenSetId(set.id)
                          setStep('chooseMode')
                        }}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="lernen-tile-label">{set.name}</span>
                        <span className="lernen-tile-meta">
                          {set.items.length} {set.items.length === 1 ? 'Karte' : 'Karten'}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {view === 'ki-lernsets' && kiSubCategory === 'deklination' && !selectedAiDeklinationSetId && (
            <div className="lernen-inhalt">
              <p className="lernen-modus-frage">Welches KI-Deklinationsset möchtest du?</p>
              {getAiDeklinationSets().length === 0 ? (
                <p className="lernen-placeholder">Noch keine KI-Deklinationssets. Erstelle welche unter „KI“.</p>
              ) : (
                <div className="lernen-grid lernen-grid--options">
                  {getAiDeklinationSets()
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((set, i) => (
                      <button
                        key={set.id}
                        type="button"
                        className="lernen-tile lernen-tile--option"
                        onClick={() => {
                          setSelectedAiDeklinationSetId(set.id)
                          setStep('chooseMode')
                        }}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="lernen-tile-label">{set.title}</span>
                        <span className="lernen-tile-meta">
                          {set.typ.toUpperCase()}-Deklination · {set.beispiel.name}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {(view === 'verben' || view === 'substantive' || view === 'adjektive' || (view === 'vokabeln' && selectedLernsetId) || (view === 'grammatik' && selectedGrammatikTopicId) || (view === 'sachkunde' && selectedSachkundeTopicId) || (view === 'ki-lernsets' && selectedAiDeklinationSetId)) && (
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
                  {currentLessonStats && (
                    <p className="lernen-modus-fortschritt" aria-live="polite">
                      {currentLessonStats.count > 0 && (
                        <>Du hast diese Lektion {currentLessonStats.count} Mal absolviert</>
                      )}
                      {currentLessonStats.count > 0 && currentLessonStats.avgPercent != null && ' · '}
                      {currentLessonStats.avgPercent != null && (
                        <>Ø {currentLessonStats.avgPercent} %</>
                      )}
                    </p>
                  )}
                  {view === 'vokabeln' && selectedLernset && (
                    <div className="lernen-modus-share-lernset">
                      <button
                        type="button"
                        className="lernen-modus-share-lernset-btn"
                        onClick={handleShareLernset}
                        aria-label="Lernset teilen"
                      >
                        <ShareIcon className="lernen-modus-share-lernset-icon" />
                        <span>Lernset teilen</span>
                      </button>
                      {shareLernsetFeedback === 'ok' && <span className="lernen-modus-share-lernset-ok">Kopiert!</span>}
                    </div>
                  )}
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
                              : view === 'grammatik'
                                ? !selectedGrammatikTopicId || !selectedGrammatikTopic || effectiveVokabelItems.length < 2
                                : view === 'ki-lernsets' && selectedKarteikartenSetId
                                  ? !selectedKarteikartenSet || karteikartenSetItems.length < 2
                                  : view === 'ki-lernsets'
                                    ? !selectedAiDeklSet || beispiele.length === 0
                                    : (view !== 'substantive' && view !== 'adjektive' && view !== 'verben') ||
                                      (view === 'verben' ? !isVerbenTyp(selectedTyp) : !selectedTyp)) ||
                            (m.id === 'karteikarten' &&
                              !(
                                ((view === 'vokabeln' || view === 'grammatik') && effectiveVokabelItems.length > 0) ||
                                (view === 'verben' && isVerbenTyp(selectedTyp)) ||
                                ((view === 'substantive' || view === 'adjektive') && selectedTyp && beispiele.length > 0) ||
                                (view === 'ki-lernsets' && selectedAiDeklSet && beispiele.length > 0) ||
                                (view === 'ki-lernsets' && selectedKarteikartenSet && karteikartenSetItems.length > 0)
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
                    (view === 'grammatik' && selectedGrammatikTopicId) ||
                    ((view === 'verben' || view === 'substantive' || view === 'adjektive') && selectedTyp) ||
                    (view === 'ki-lernsets' && (selectedAiDeklinationSetId || selectedKarteikartenSetId)) ||
                    (view === 'sachkunde' && selectedSachkundeTopic)) ? (
                    <>
                      <p className="lernen-modus-spiele-label">Spiele</p>
                      <div className="lernen-grid lernen-grid--options lernen-grid--spiele">
                        {VOKABEL_SPIELE.map((s, i) => {
                          const isVokabeln = view === 'vokabeln' || view === 'grammatik'
                          const isSachkunde = view === 'sachkunde'
                          const isKiDekl = view === 'ki-lernsets' && selectedAiDeklSet
                          const isKiKarteikarten = view === 'ki-lernsets' && selectedKarteikartenSet
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
                                : isKiDekl && beispiele.length > 0
                                  ? buildDeklinationWortpaare(beispiele).length >= 4
                                  : false
                          const sachkundeWortpaareOk =
                            isSachkunde && selectedSachkundeTopic && selectedSachkundeTopic.gamePairs.length >= 2
                          const sachkundeQuizOk =
                            isSachkunde && selectedSachkundeTopic && selectedSachkundeTopic.quiz.length >= 2
                          const disabled = isKiKarteikarten
                            ? true
                            : isVokabeln
                              ? (s.id === 'wortpaare' && effectiveVokabelItems.length < 4) ||
                                (s.id !== 'wortpaare' && effectiveVokabelItems.length < 2)
                              : isSachkunde
                                ? (s.id === 'wortpaare' && !sachkundeWortpaareOk) ||
                                  (s.id !== 'wortpaare' && !sachkundeQuizOk)
                                : isKiDekl
                                  ? s.id === 'wortpaare' ? !deklWortpaareOk : beispiele.length < 2
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
                      : (view === 'vokabeln' && selectedLernset)
                        ? selectedLernset.name
                        : (view === 'grammatik' && selectedGrammatikTopic)
                          ? selectedGrammatikTopic.title
                          : view === 'ki-lernsets' && selectedKarteikartenSet
                            ? selectedKarteikartenSet.name
                            : view === 'ki-lernsets' && selectedAiDeklSet
                              ? selectedAiDeklSet.title
                              : typLabel}{' '}
                    – Anschauen
                  </h2>
                  {view === 'ki-lernsets' && selectedKarteikartenSet ? (
                    <div className="lernen-anschauen-karteikarten">
                      {selectedKarteikartenSet.items.map((item, i) => (
                        <div key={i} className="lernen-anschauen-karte">
                          <div className="lernen-anschauen-karte-frage">
                            {item.frontImage && <img src={item.frontImage} alt="" className="lernen-anschauen-karte-img" />}
                            <span className="lernen-anschauen-karte-label">Frage</span>
                            <p className="lernen-anschauen-karte-text">{item.front}</p>
                          </div>
                          <div className="lernen-anschauen-karte-antwort">
                            {item.backImage && <img src={item.backImage} alt="" className="lernen-anschauen-karte-img" />}
                            <span className="lernen-anschauen-karte-label">Antwort</span>
                            <p className="lernen-anschauen-karte-text">{item.back}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : ((view === 'vokabeln' && selectedLernset) || (view === 'grammatik' && selectedGrammatikTopic)) ? (
                    <div className="lernen-vokabeln-tabelle-wrap">
                      <table className="lernen-vokabeln-tabelle">
                        <thead>
                          <tr>
                            <th>{view === 'grammatik' ? 'Begriff / Frage' : 'Latein'}</th>
                            <th>{view === 'grammatik' ? 'Erklärung / Antwort' : 'Deutsch'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(view === 'grammatik' ? selectedGrammatikTopic!.items : selectedLernset!.items).map((item, i) => (
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
                  {!wortpaareOhneZeit && (
                    <div className="lernen-wortpaare-uhr" role="timer" aria-live="polite" aria-atomic="true">
                      {Math.floor(wortpaareElapsedMs / 60000)}:{(Math.floor(wortpaareElapsedMs / 1000) % 60).toString().padStart(2, '0')}.{(Math.floor(wortpaareElapsedMs / 10) % 100).toString().padStart(2, '0')}
                    </div>
                  )}
                  <p className="lernen-wortpaare-anleitung">
                    {wortpaareOhneZeit
                      ? 'Finde die passenden Paare: Klicke nacheinander auf die zwei zusammengehörigen Begriffe.'
                      : 'Finde die passenden Paare: Klicke nacheinander auf die zwei zusammengehörigen Wörter. So schnell wie möglich!'}
                  </p>
                  <div className="lernen-wortpaare-grid">
                    {wortpaareCards
                      .map((card, idx) => ({ card, idx }))
                      .filter(({ card: c }) => !wortpaareMatched.includes(c.pairId))
                      .map(({ card, idx }) => {
                        const isSelected = wortpaareFlipped.includes(idx)
                        return (
                          <button
                            key={card.id}
                            type="button"
                            className={`lernen-wortpaare-karte lernen-wortpaare-karte--offen ${isSelected ? 'lernen-wortpaare-karte--ausgewaehlt' : ''}`}
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
                  <div className="lernen-rennen-uhr" role="timer" aria-live="polite" aria-atomic="true">
                    {Math.floor(rennenElapsedMs / 60000)}:
                    {(Math.floor(rennenElapsedMs / 1000) % 60).toString().padStart(2, '0')}.
                    {(Math.floor(rennenElapsedMs / 10) % 100).toString().padStart(2, '0')}
                  </div>
                  <div className="lernen-rennen-track-wrap">
                    <div className="lernen-rennen-track">
                      <div className="lernen-rennen-track-lane lernen-rennen-track-lane--user">
                        <div
                          className="lernen-rennen-auto lernen-rennen-auto--user"
                          style={{ left: `${rennenCarProgress}%` }}
                        >
                          <svg viewBox="0 0 80 32" className="lernen-rennen-auto-svg" aria-hidden>
                            <defs>
                              <linearGradient id="carUserBody" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                              </linearGradient>
                            </defs>
                            <rect x="6" y="14" width="68" height="10" rx="4" fill="url(#carUserBody)" />
                            <rect x="18" y="8" width="32" height="9" rx="3" fill="currentColor" />
                            <rect x="20" y="10" width="10" height="6" rx="2" fill="#e2e8f0" />
                            <rect x="34" y="10" width="10" height="6" rx="2" fill="#e2e8f0" />
                            <circle cx="22" cy="26" r="4" fill="#1a202c" />
                            <circle cx="58" cy="26" r="4" fill="#1a202c" />
                            <circle cx="22" cy="26" r="2" fill="#cbd5f5" />
                            <circle cx="58" cy="26" r="2" fill="#cbd5f5" />
                            <rect x="10" y="16" width="6" height="3" rx="1.5" fill="#fbbf24" />
                            <rect x="64" y="16" width="6" height="3" rx="1.5" fill="#60a5fa" />
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
                          <svg viewBox="0 0 80 32" className="lernen-rennen-auto-svg" aria-hidden>
                            <defs>
                              <linearGradient id="carOpponentBody" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                              </linearGradient>
                            </defs>
                            <rect x="6" y="14" width="68" height="10" rx="4" fill="url(#carOpponentBody)" />
                            <rect x="18" y="8" width="32" height="9" rx="3" fill="currentColor" />
                            <rect x="20" y="10" width="10" height="6" rx="2" fill="#e2e8f0" />
                            <rect x="34" y="10" width="10" height="6" rx="2" fill="#e2e8f0" />
                            <circle cx="22" cy="26" r="4" fill="#020617" />
                            <circle cx="58" cy="26" r="4" fill="#020617" />
                            <circle cx="22" cy="26" r="2" fill="#64748b" />
                            <circle cx="58" cy="26" r="2" fill="#64748b" />
                            <rect x="10" y="16" width="6" height="3" rx="1.5" fill="#facc15" />
                            <rect x="64" y="16" width="6" height="3" rx="1.5" fill="#38bdf8" />
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
                        <span className="lernen-karte-label">
                          {view === 'verben' || view === 'substantive' || view === 'adjektive'
                            ? 'Aufgabe'
                            : view === 'ki-lernsets' && selectedKarteikartenSetId
                              ? 'Vorderseite'
                              : 'Latein'}
                        </span>
                        <p className="lernen-karte-text">{karteikartenItems[karteikartenIndex].front}</p>
                        <span className="lernen-karte-hinweis">Tippen zum Umdrehen</span>
                        {karteikartenItems[karteikartenIndex].frontImage && (
                          <div className="lernen-karte-img-wrap">
                            <img src={karteikartenItems[karteikartenIndex].frontImage} alt="" className="lernen-karte-img" />
                          </div>
                        )}
                      </div>
                      <div className="lernen-karte-hinten">
                        <span className="lernen-karte-label">
                          {view === 'verben' || view === 'substantive' || view === 'adjektive'
                            ? 'Lösung'
                            : view === 'ki-lernsets' && selectedKarteikartenSetId
                              ? 'Rückseite'
                              : 'Deutsch'}
                        </span>
                        <p className="lernen-karte-text">{karteikartenItems[karteikartenIndex].back}</p>
                        {karteikartenItems[karteikartenIndex].backImage && (
                          <div className="lernen-karte-img-wrap">
                            <img src={karteikartenItems[karteikartenIndex].backImage} alt="" className="lernen-karte-img" />
                          </div>
                        )}
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

              {showVokabelnQuiz && !showVokabelnQuizAuswertung && !vokShowZwischenauswertung && vokabelQuizQuestions[vokabelQuizIndex] && vokabelQuizMode === 'lernen' && (
                <div className="lernen-quiz">
                  <p className="lernen-quiz-frage-text">
                    {view === 'ki-lernsets' && selectedKarteikartenSetId ? (
                      <>Was steht auf der Rückseite? <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong></>
                    ) : (
                      <>Wie lautet die Übersetzung von <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong>?</>
                    )}
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

              {showVokabelnQuiz && !showVokabelnQuizAuswertung && !vokShowZwischenauswertung && vokabelQuizQuestions[vokabelQuizIndex] && vokabelQuizMode === 'test' && (
                <div className="lernen-quiz lernen-quiz--test">
                  <p className="lernen-quiz-frage-text">
                    {view === 'ki-lernsets' && selectedKarteikartenSetId ? (
                      <>Was steht auf der Rückseite? <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong></>
                    ) : (
                      <>Wie lautet die Übersetzung von <strong>{vokabelQuizQuestions[vokabelQuizIndex].vokabel}</strong>?</>
                    )}
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

              {dekShowZwischenauswertung && (
                <div className="lernen-zwischenauswertung" role="status" aria-live="polite">
                  <p className="lernen-zwischenauswertung-title">Station {dekStation} geschafft!</p>
                  <p className="lernen-zwischenauswertung-stats">
                    <span className="lernen-zwischenauswertung-richtig">{dekZwischenCorrect} richtig</span>
                    <span className="lernen-zwischenauswertung-falsch">{dekZwischenWrong} falsch</span>
                  </p>
                  <p className="lernen-zwischenauswertung-hint">
                    {dekStation < 5 ? 'Weiter zur nächsten Station.' : 'Lektion abgeschlossen!'}
                  </p>
                  <button type="button" className="lernen-zwischenauswertung-btn" onClick={handleDekZwischenWeiter}>
                    {dekStation === 5 && dekZwischenFromPhase === 'correctTest' ? 'Zur Auswertung' : 'Weiter'}
                  </button>
                </div>
              )}

              {vokShowZwischenauswertung && (
                <div className="lernen-zwischenauswertung" role="status" aria-live="polite">
                  <p className="lernen-zwischenauswertung-title">Station {vokStation} geschafft!</p>
                  <p className="lernen-zwischenauswertung-stats">
                    <span className="lernen-zwischenauswertung-richtig">{vokZwischenCorrect} richtig</span>
                    <span className="lernen-zwischenauswertung-falsch">{vokZwischenWrong} falsch</span>
                  </p>
                  <p className="lernen-zwischenauswertung-hint">
                    {vokStation < 5 ? 'Weiter zur nächsten Station.' : 'Lektion abgeschlossen!'}
                  </p>
                  <button type="button" className="lernen-zwischenauswertung-btn" onClick={handleVokZwischenWeiter}>
                    {vokStation === 5 && vokZwischenFromPhase === 'correctTest' ? 'Zur Auswertung' : 'Weiter'}
                  </button>
                </div>
              )}

              {showQuiz && !showAuswertung && !dekShowZwischenauswertung && currentFrage && quizMode === 'lernen' && (
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

              {showQuiz && !showAuswertung && !dekShowZwischenauswertung && currentFrage && quizMode === 'test' && (
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
                  {showTestGrade && testGrade != null && (
                    <p className="lernen-auswertung-note" role="status">
                      Du hättest eine <strong>{testGrade}</strong>
                    </p>
                  )}
                  {showWortpaareAuswertung && wortpaareEndTime != null && (
                    <div className="lernen-wortpaare-auswertung" role="status">
                      {!wortpaareOhneZeit && (
                        <>
                          <div className="lernen-wortpaare-auswertung-zeit">
                            <span className="lernen-wortpaare-auswertung-label">Deine Zeit</span>
                            <span className="lernen-wortpaare-auswertung-wert">
                              {((wortpaareEndTime - wortpaareStartTime) / 1000).toFixed(2).replace('.', ',')} s
                            </span>
                          </div>
                          {wortpaareLessonKey && (
                            <div className="lernen-wortpaare-auswertung-bestzeit">
                              {wortpaareIsNewBest ? (
                                <p className="lernen-wortpaare-auswertung-neue-bestzeit">
                                  Neue Bestzeit! {((wortpaareEndTime - wortpaareStartTime) / 1000).toFixed(2).replace('.', ',')} s
                                </p>
                              ) : getWortpaareBestzeit(wortpaareLessonKey) != null ? (
                                <>
                                  <span className="lernen-wortpaare-auswertung-label">Bestzeit</span>
                                  <span className="lernen-wortpaare-auswertung-wert">
                                    {(getWortpaareBestzeit(wortpaareLessonKey)! / 1000).toFixed(2).replace('.', ',')} s
                                  </span>
                                </>
                              ) : null}
                            </div>
                          )}
                        </>
                      )}
                      {wortpaareOhneZeit && (
                        <p className="lernen-wortpaare-auswertung-quiz">Alle Paare gefunden – gut gemacht!</p>
                      )}
                    </div>
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
                    ) : showAuswertung && !showTestGrade ? (
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
                    ) : showAuswertung && showTestGrade ? (
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleNochEinmal}>
                        <RefreshIcon />
                        <span>Noch einmal</span>
                      </button>
                    ) : showVokabelnQuizAuswertung && !showTestGrade ? (
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
                    ) : showVokabelnQuizAuswertung && showTestGrade ? (
                      <button type="button" className="lernen-auswertung-btn lernen-auswertung-btn--1" onClick={handleVokabelNochEinmal}>
                        <RefreshIcon />
                        <span>Noch einmal</span>
                      </button>
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
                    <div className="lernen-auswertung-achievement-block" role="status" aria-live="polite">
                      <p className="lernen-auswertung-achievement-heading">Neue Erfolge</p>
                      <div className="lernen-auswertung-achievement-toast">
                        {getAchievements()
                          .filter((a) => newAchievementIds.includes(a.id))
                          .map((a) => (
                            <div key={a.id} className="lernen-achievement-toast-item">
                              <span className="lernen-achievement-toast-icon">{a.icon}</span>
                              <span className="lernen-achievement-toast-title">{a.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {streakPopup !== null && (
                    <div
                      className={`streak-popup ${streakPopup.updated ? 'streak-popup--levelup' : ''}`}
                      role="status"
                      aria-live="polite"
                    >
                      {streakPopup.updated && (
                        <p className="streak-popup-tagesziel-headline">Tagesziel erreicht!</p>
                      )}
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
                        <p className="streak-popup-badge">Streak gesichert</p>
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
