/**
 * Sachkunde – Berichte, Quiz und Spiele zu römischen Themen.
 */

export interface SachkundeQuizFrage {
  question: string
  options: string[]
  correctIndex: number
}

export interface SachkundePaar {
  begriff: string
  erklaerung: string
}

export interface SachkundeThema {
  id: string
  title: string
  report: string
  quiz: SachkundeQuizFrage[]
  gamePairs: SachkundePaar[]
}

/** Keine vorgegebenen Sachkunde-Themen – nur nutzererstellte Inhalte. */
export const SACHKUNDE_TOPICS: SachkundeThema[] = []

export function getSachkundeTopic(id: string): SachkundeThema | undefined {
  return SACHKUNDE_TOPICS.find((t) => t.id === id)
}

export function getSachkundeTopicIds(): string[] {
  return SACHKUNDE_TOPICS.map((t) => t.id)
}
