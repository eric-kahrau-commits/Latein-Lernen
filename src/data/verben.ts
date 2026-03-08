/**
 * Verben – keine vorgegebenen Beispiele. Typen und IDs für Lernmodi bleiben.
 */

export type VerbenTyp = 'imperativ' | 'perfekt' | 'imperfekt' | 'plusquamperfekt'

export interface VerbBeispiel {
  infinitive: string
  uebersetzung: string
  imperativSg: string
  imperativPl: string
  perfekt: string
  imperfekt: string
  plusquamperfekt: string
}

export const VERBEN_BEISPIELE: VerbBeispiel[] = []

export const VERBEN_IMPERATIV_LESSON_ID = 'verben-imperativ'
export const VERBEN_PERFEKT_LESSON_ID = 'verben-perfekt'
export const VERBEN_IMPERFEKT_LESSON_ID = 'verben-imperfekt'
export const VERBEN_PLUSQUAMPERFEKT_LESSON_ID = 'verben-plusquamperfekt'

export const VERBEN_IMPERATIV_LESSON_NAME = 'Verben – Imperativ'
export const VERBEN_PERFEKT_LESSON_NAME = 'Verben – Perfekt'
export const VERBEN_IMPERFEKT_LESSON_NAME = 'Verben – Imperfekt'
export const VERBEN_PLUSQUAMPERFEKT_LESSON_NAME = 'Verben – Plusquamperfekt'
