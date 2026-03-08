/**
 * Persistenz wichtiger UI-Zustände in localStorage.
 *
 * Gespeicherte Keys in der App:
 * - latinum-user-name (Profil/Name) → ProfileContext
 * - latinum-lernsets (Vokabel-Lernsets) → lernsets.ts
 * - latinum-statistik (Sessions + Attempts) → statistik.ts
 * - latinum-favoriten (Stern-Lernsets) → favoriten.ts
 * - latinum-lernen-state (Lernseite: View, Breadcrumb, Typ, Lernset, Step) → hier
 * - latinum-statistik-ui (Statistikseite: Monat, Treffer-Auswahl) → hier
 */

const LERNEN_KEY = 'latinum-lernen-state'
const STATISTIK_UI_KEY = 'latinum-statistik-ui'

export type StoredLernenView =
  | 'themen'
  | 'deklinationen'
  | 'verben'
  | 'substantive'
  | 'adjektive'
  | 'vokabeln'
  | 'grammatik'
  | 'sachkunde'

export type StoredLernenStep =
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

export interface StoredLernenState {
  view: StoredLernenView
  breadcrumb: string[]
  selectedTyp: string | null
  selectedLernsetId: string | null
  selectedGrammatikTopicId: string | null
  selectedSachkundeTopicId: string | null
  step: StoredLernenStep
}

const DEFAULT_LERNEN: StoredLernenState = {
  view: 'themen',
  breadcrumb: [],
  selectedTyp: null,
  selectedLernsetId: null,
  selectedGrammatikTopicId: null,
  selectedSachkundeTopicId: null,
  step: null,
}

const VALID_STEPS: StoredLernenStep[] = [
  null,
  'chooseMode',
  'anschauen',
  'lernen',
  'test',
  'karteikarten',
  'spiel',
  'wortpaare',
  'glücksrad',
  'rennen',
]

const VALID_VIEWS: StoredLernenView[] = [
  'themen',
  'deklinationen',
  'verben',
  'substantive',
  'adjektive',
  'vokabeln',
  'grammatik',
  'sachkunde',
]

export function loadLernenState(): StoredLernenState {
  try {
    const raw = localStorage.getItem(LERNEN_KEY)
    if (!raw) return DEFAULT_LERNEN
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return DEFAULT_LERNEN
    const p = parsed as Record<string, unknown>
    const view =
      typeof p.view === 'string' && (VALID_VIEWS as string[]).includes(p.view)
        ? (p.view as StoredLernenView)
        : DEFAULT_LERNEN.view
    const breadcrumb = Array.isArray(p.breadcrumb)
      ? (p.breadcrumb as string[]).filter((x) => typeof x === 'string')
      : DEFAULT_LERNEN.breadcrumb
    const selectedTyp =
      p.selectedTyp === null || (typeof p.selectedTyp === 'string' && p.selectedTyp)
        ? (p.selectedTyp as string | null)
        : null
    const selectedLernsetId =
      p.selectedLernsetId === null ||
      (typeof p.selectedLernsetId === 'string' && p.selectedLernsetId)
        ? (p.selectedLernsetId as string | null)
        : null
    const selectedGrammatikTopicId =
      p.selectedGrammatikTopicId === null ||
      (typeof p.selectedGrammatikTopicId === 'string' && p.selectedGrammatikTopicId)
        ? (p.selectedGrammatikTopicId as string | null)
        : null
    const selectedSachkundeTopicId =
      p.selectedSachkundeTopicId === null ||
      (typeof p.selectedSachkundeTopicId === 'string' && p.selectedSachkundeTopicId)
        ? (p.selectedSachkundeTopicId as string | null)
        : null
    const step =
      typeof p.step === 'string' && (VALID_STEPS as unknown[]).includes(p.step)
        ? (p.step as StoredLernenStep)
        : p.step === null
          ? null
          : DEFAULT_LERNEN.step
    return { view, breadcrumb, selectedTyp, selectedLernsetId, selectedGrammatikTopicId, selectedSachkundeTopicId, step }
  } catch {
    return DEFAULT_LERNEN
  }
}

export function saveLernenState(state: StoredLernenState): void {
  try {
    localStorage.setItem(LERNEN_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

const ACTIVE_STEPS: StoredLernenStep[] = [
  'anschauen',
  'lernen',
  'test',
  'karteikarten',
  'spiel',
  'wortpaare',
  'glücksrad',
  'rennen',
]

/** true wenn der gespeicherte Step ein aktiver Lern-/Spielmodus war (nicht nur Auswahl). */
export function isStoredLernenStepActive(step: StoredLernenStep): boolean {
  return step != null && ACTIVE_STEPS.includes(step)
}

// --- Statistiken UI ---

export type StoredStatistikMode = 'anschauen' | 'karteikarten' | 'lernen' | 'test'

export interface StoredStatistikUI {
  statMonth: string // YYYY-MM
  trefferLessonId: string
  trefferMode: StoredStatistikMode
}

function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function loadStatistikUI(): StoredStatistikUI {
  try {
    const raw = localStorage.getItem(STATISTIK_UI_KEY)
    if (!raw) {
      return { statMonth: formatYearMonth(new Date()), trefferLessonId: '', trefferMode: 'lernen' }
    }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return { statMonth: formatYearMonth(new Date()), trefferLessonId: '', trefferMode: 'lernen' }
    }
    const p = parsed as Record<string, unknown>
    const statMonth =
      typeof p.statMonth === 'string' && /^\d{4}-\d{2}$/.test(p.statMonth)
        ? p.statMonth
        : formatYearMonth(new Date())
    const trefferLessonId = typeof p.trefferLessonId === 'string' ? p.trefferLessonId : ''
    const validModes: StoredStatistikMode[] = ['anschauen', 'karteikarten', 'lernen', 'test']
    const trefferMode =
      typeof p.trefferMode === 'string' && validModes.includes(p.trefferMode as StoredStatistikMode)
        ? (p.trefferMode as StoredStatistikMode)
        : 'lernen'
    return { statMonth, trefferLessonId, trefferMode }
  } catch {
    return { statMonth: formatYearMonth(new Date()), trefferLessonId: '', trefferMode: 'lernen' }
  }
}

export function saveStatistikUI(state: StoredStatistikUI): void {
  try {
    localStorage.setItem(STATISTIK_UI_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}
