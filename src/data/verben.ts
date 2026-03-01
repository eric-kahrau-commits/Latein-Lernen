/**
 * Verben – einfache Beispiele für Imperativ & Zeitformen.
 * Fokus: Imperativ (2. Pers. Sg./Pl.) sowie Indikativ Aktiv 1. Pers. Sg.
 * (Perfekt / Imperfekt / Plusquamperfekt).
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

export const VERBEN_BEISPIELE: VerbBeispiel[] = [
  {
    infinitive: 'laudāre',
    uebersetzung: 'loben',
    imperativSg: 'laudā',
    imperativPl: 'laudāte',
    perfekt: 'laudāvī',
    imperfekt: 'laudābam',
    plusquamperfekt: 'laudāveram',
  },
  {
    infinitive: 'amāre',
    uebersetzung: 'lieben',
    imperativSg: 'amā',
    imperativPl: 'amāte',
    perfekt: 'amāvī',
    imperfekt: 'amābam',
    plusquamperfekt: 'amāveram',
  },
  {
    infinitive: 'monēre',
    uebersetzung: 'ermahnen',
    imperativSg: 'monē',
    imperativPl: 'monēte',
    perfekt: 'monuī',
    imperfekt: 'monēbam',
    plusquamperfekt: 'monueram',
  },
  {
    infinitive: 'vidēre',
    uebersetzung: 'sehen',
    imperativSg: 'vidē',
    imperativPl: 'vidēte',
    perfekt: 'vīdī',
    imperfekt: 'vidēbam',
    plusquamperfekt: 'vīderam',
  },
  {
    infinitive: 'habēre',
    uebersetzung: 'haben',
    imperativSg: 'habē',
    imperativPl: 'habēte',
    perfekt: 'habuī',
    imperfekt: 'habēbam',
    plusquamperfekt: 'habueram',
  },
  {
    infinitive: 'regere',
    uebersetzung: 'führen, herrschen',
    imperativSg: 'rege',
    imperativPl: 'regite',
    perfekt: 'rēxī',
    imperfekt: 'regēbam',
    plusquamperfekt: 'rēxeram',
  },
  {
    infinitive: 'dīcere',
    uebersetzung: 'sagen',
    imperativSg: 'dīc',
    imperativPl: 'dīcite',
    perfekt: 'dīxī',
    imperfekt: 'dīcēbam',
    plusquamperfekt: 'dīxeram',
  },
  {
    infinitive: 'dūcere',
    uebersetzung: 'führen',
    imperativSg: 'dūc',
    imperativPl: 'dūcite',
    perfekt: 'dūxī',
    imperfekt: 'dūcēbam',
    plusquamperfekt: 'dūxeram',
  },
  {
    infinitive: 'facere',
    uebersetzung: 'machen, tun',
    imperativSg: 'fac',
    imperativPl: 'facite',
    perfekt: 'fēcī',
    imperfekt: 'faciēbam',
    plusquamperfekt: 'fēceram',
  },
  {
    infinitive: 'audīre',
    uebersetzung: 'hören',
    imperativSg: 'audī',
    imperativPl: 'audīte',
    perfekt: 'audīvī',
    imperfekt: 'audiēbam',
    plusquamperfekt: 'audīveram',
  },
  {
    infinitive: 'venīre',
    uebersetzung: 'kommen',
    imperativSg: 'venī',
    imperativPl: 'venīte',
    perfekt: 'vēnī',
    imperfekt: 'veniēbam',
    plusquamperfekt: 'vēneram',
  },
  {
    infinitive: 'īre',
    uebersetzung: 'gehen',
    imperativSg: 'ī',
    imperativPl: 'īte',
    perfekt: 'iī',
    imperfekt: 'ībam',
    plusquamperfekt: 'ieram',
  },
  {
    infinitive: 'esse',
    uebersetzung: 'sein',
    imperativSg: 'es',
    imperativPl: 'este',
    perfekt: 'fuī',
    imperfekt: 'eram',
    plusquamperfekt: 'fueram',
  },
  {
    infinitive: 'dare',
    uebersetzung: 'geben',
    imperativSg: 'dā',
    imperativPl: 'date',
    perfekt: 'dedī',
    imperfekt: 'dabam',
    plusquamperfekt: 'dederam',
  },
  {
    infinitive: 'stāre',
    uebersetzung: 'stehen',
    imperativSg: 'stā',
    imperativPl: 'stāte',
    perfekt: 'stetī',
    imperfekt: 'stabam',
    plusquamperfekt: 'steteram',
  },
]

export const VERBEN_IMPERATIV_LESSON_ID = 'verben-imperativ'
export const VERBEN_PERFEKT_LESSON_ID = 'verben-perfekt'
export const VERBEN_IMPERFEKT_LESSON_ID = 'verben-imperfekt'
export const VERBEN_PLUSQUAMPERFEKT_LESSON_ID = 'verben-plusquamperfekt'

export const VERBEN_IMPERATIV_LESSON_NAME = 'Verben – Imperativ'
export const VERBEN_PERFEKT_LESSON_NAME = 'Verben – Perfekt'
export const VERBEN_IMPERFEKT_LESSON_NAME = 'Verben – Imperfekt'
export const VERBEN_PLUSQUAMPERFEKT_LESSON_NAME = 'Verben – Plusquamperfekt'
