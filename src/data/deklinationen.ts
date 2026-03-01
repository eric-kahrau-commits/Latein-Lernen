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

/** Substantive: Beispiele pro Deklinationstyp (Verben später) */
export const SUBSTANTIV_DEKLINATIONEN: Record<
  'a' | 'o' | 'u' | 'konsonantisch',
  DeklinationBeispiel[]
> = {
  a: [
    {
      name: 'domina (Herrin)',
      tabelle: {
        singular: ['domina', 'dominae', 'dominae', 'dominam', 'domina', 'domina'],
        plural: ['dominae', 'dominarum', 'dominis', 'dominas', 'dominis', 'dominae'],
      },
      endungen: {
        singular: ['-a', '-ae', '-ae', '-am', '-a', '-a'],
        plural: ['-ae', '-arum', '-is', '-as', '-is', '-ae'],
      },
    },
  ],
  o: [
    {
      name: 'dominus (Herr)',
      tabelle: {
        singular: ['dominus', 'domini', 'domino', 'dominum', 'domino', 'domine'],
        plural: ['domini', 'dominorum', 'dominis', 'dominos', 'dominis', 'domini'],
      },
      endungen: {
        singular: ['-us', '-i', '-o', '-um', '-o', '-e'],
        plural: ['-i', '-orum', '-is', '-os', '-is', '-i'],
      },
    },
    {
      name: 'templum (Tempel)',
      tabelle: {
        singular: ['templum', 'templi', 'templo', 'templum', 'templo', 'templum'],
        plural: ['templa', 'templorum', 'templis', 'templa', 'templis', 'templa'],
      },
      endungen: {
        singular: ['-um', '-i', '-o', '-um', '-o', '-um'],
        plural: ['-a', '-orum', '-is', '-a', '-is', '-a'],
      },
    },
  ],
  u: [
    {
      name: 'manus (Hand)',
      tabelle: {
        singular: ['manus', 'manus', 'manui', 'manum', 'manu', 'manus'],
        plural: ['manus', 'manuum', 'manibus', 'manus', 'manibus', 'manus'],
      },
      endungen: {
        singular: ['-us', '-us', '-ui', '-um', '-u', '-us'],
        plural: ['-us', '-uum', '-ibus', '-us', '-ibus', '-us'],
      },
    },
  ],
  konsonantisch: [
    {
      name: 'rex (König)',
      tabelle: {
        singular: ['rex', 'regis', 'regi', 'regem', 'rege', 'rex'],
        plural: ['reges', 'regum', 'regibus', 'reges', 'regibus', 'reges'],
      },
      endungen: {
        singular: ['-s', '-is', '-i', '-em', '-e', '-s'],
        plural: ['-es', '-um', '-ibus', '-es', '-ibus', '-es'],
      },
    },
  ],
}

/** Adjektive: bonus (A-/O-Dekl.), acer (3./konsonantisch) */
export type AdjektivDeklTyp = 'a-o' | 'konsonantisch'

export const ADJEKTIV_DEKLINATIONEN: Record<AdjektivDeklTyp, DeklinationBeispiel[]> = {
  'a-o': [
    {
      name: 'bonus (gut, m.)',
      tabelle: {
        singular: ['bonus', 'boni', 'bono', 'bonum', 'bono', 'bone'],
        plural: ['boni', 'bonorum', 'bonis', 'bonos', 'bonis', 'boni'],
      },
      endungen: {
        singular: ['-us', '-i', '-o', '-um', '-o', '-e'],
        plural: ['-i', '-orum', '-is', '-os', '-is', '-i'],
      },
    },
    {
      name: 'bona (gut, f.)',
      tabelle: {
        singular: ['bona', 'bonae', 'bonae', 'bonam', 'bona', 'bona'],
        plural: ['bonae', 'bonarum', 'bonis', 'bonas', 'bonis', 'bonae'],
      },
      endungen: {
        singular: ['-a', '-ae', '-ae', '-am', '-a', '-a'],
        plural: ['-ae', '-arum', '-is', '-as', '-is', '-ae'],
      },
    },
    {
      name: 'bonum (gut, n.)',
      tabelle: {
        singular: ['bonum', 'boni', 'bono', 'bonum', 'bono', 'bonum'],
        plural: ['bona', 'bonorum', 'bonis', 'bona', 'bonis', 'bona'],
      },
      endungen: {
        singular: ['-um', '-i', '-o', '-um', '-o', '-um'],
        plural: ['-a', '-orum', '-is', '-a', '-is', '-a'],
      },
    },
  ],
  konsonantisch: [
    {
      name: 'acer (scharf, m./f.)',
      tabelle: {
        singular: ['acer', 'acris', 'acri', 'acrem', 'acri', 'acer'],
        plural: ['acres', 'acrium', 'acribus', 'acris', 'acribus', 'acres'],
      },
      endungen: {
        singular: ['-er', '-is', '-i', '-em', '-i', '-er'],
        plural: ['-es', '-ium', '-ibus', '-is', '-ibus', '-es'],
      },
    },
    {
      name: 'acre (scharf, n.)',
      tabelle: {
        singular: ['acre', 'acris', 'acri', 'acre', 'acri', 'acre'],
        plural: ['acria', 'acrium', 'acribus', 'acria', 'acribus', 'acria'],
      },
      endungen: {
        singular: ['-e', '-is', '-i', '-e', '-i', '-e'],
        plural: ['-ia', '-ium', '-ibus', '-ia', '-ibus', '-ia'],
      },
    },
  ],
}
