/**
 * Grammatik – keine vorgegebenen Themen. Nur Typen und Getter für später.
 * Lernmodi bleiben erhalten; Inhalte kommen von Nutzer/KI.
 */

export type Klassenstufe = 5 | 6 | 7 | 8 | 9 | 10

export interface GrammatikEintrag {
  vokabel: string
  uebersetzung: string
}

export interface GrammatikThema {
  id: string
  title: string
  shortTitle?: string
  klasse: Klassenstufe
  items: GrammatikEintrag[]
}

export const GRAMMATIK_TOPICS: GrammatikThema[] = []

export function getGrammatikTopic(id: string): GrammatikThema | null {
  return GRAMMATIK_TOPICS.find((t) => t.id === id) ?? null
}

export function getGrammatikTopicsForKlasse(klasse: Klassenstufe): GrammatikThema[] {
  return GRAMMATIK_TOPICS.filter((t) => t.klasse === klasse)
}
