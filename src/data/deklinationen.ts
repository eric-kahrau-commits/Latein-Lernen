/** Fälle: Nominativ, Genitiv, Dativ, Akkusativ, Ablativ, Vokativ */
export const FAELLE = [
  'Nominativ',
  'Genitiv',
  'Dativ',
  'Akkusativ',
  'Ablativ',
  'Vokativ',
] as const

export type Fall = (typeof FAELLE)[number]

export interface DeklinationTable {
  singular: readonly [string, string, string, string, string, string]
  plural: readonly [string, string, string, string, string, string]
}

export interface DeklinationBeispiel {
  name: string
  tabelle: DeklinationTable
  endungen: DeklinationTable
}

/** Keine vorgegebenen Deklinationen – nur nutzererstellte Inhalte. Typen für Lernmodi bleiben. */
export const SUBSTANTIV_DEKLINATIONEN: Record<
  'a' | 'o' | 'u' | 'konsonantisch',
  DeklinationBeispiel[]
> = {
  a: [],
  o: [],
  u: [],
  konsonantisch: [],
}

export type AdjektivDeklTyp = 'a-o' | 'konsonantisch'

export const ADJEKTIV_DEKLINATIONEN: Record<AdjektivDeklTyp, DeklinationBeispiel[]> = {
  'a-o': [],
  konsonantisch: [],
}
