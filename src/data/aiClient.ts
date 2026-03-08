export type AiDeklinationResponse = {
  lemma: string
  typ: 'a' | 'o' | 'u' | 'konsonantisch'
  deutsch?: string
  tabelle: {
    singular: [string, string, string, string, string, string]
    plural: [string, string, string, string, string, string]
  }
}

export type AiVokabelSetResponse = {
  name: string
  topicId?: string
  items: { vokabel: string; uebersetzung: string }[]
}

/** KI-generiertes Karteikarten-Set (Vorderseite/Rückseite + 3 MC-Falschantworten) für beliebige Fächer. */
export type AiKarteikartenSetResponse = {
  items: { front: string; back: string; wrongOptions: [string, string, string] }[]
}

/** State des KI-Lernset-Assistenten: Fach, Anzahl, Thema, Klassenstufe, optional Schwierigkeit. */
export type LernsetAssistantState = {
  /** Fach-ID (z. B. mathe, latein) – aus getFaecher() */
  fachId?: string
  /** Anzahl Karteikarten (z. B. 10–50) */
  count?: number
  /** Genaues Thema des Lernsets */
  topic?: string
  /** Klassenstufe 5–10 für das Niveau */
  klasse?: number
  /** Optional: Schwierigkeit/Niveau (z. B. Expertenniveau, schwierige Gleichungen, aktueller Schulstoff) */
  schwierigkeit?: string
}

export type LernsetAssistantTurn = {
  reply: string
  state: LernsetAssistantState
  ready: boolean
  error?: string
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-5o'
const MODEL: string = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || DEFAULT_MODEL
const REQUEST_TIMEOUT_MS = 60_000

/** Nutzerfreundliche Fehlermeldungen für KI/Netzwerk */
export const NETWORK_ERROR_MESSAGE =
  'Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es später erneut.'
export const TIMEOUT_MESSAGE =
  'Die Anfrage hat zu lange gedauert. Bitte später erneut versuchen.'
export const SERVER_ERROR_MESSAGE =
  'Der Dienst ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.'
export const OFFLINE_MESSAGE =
  'Für KI-Funktionen wird eine Internetverbindung benötigt. Andere Lerninhalte funktionieren offline.'
const PARSE_ERROR_MESSAGE = 'Antwort konnte nicht gelesen werden. Bitte erneut versuchen.'

/** Prüft, ob das Gerät online ist (navigator.onLine). */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

async function openAIFetch(body: object, apiKey: string): Promise<Response> {
  if (!isOnline()) {
    throw new Error(OFFLINE_MESSAGE)
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      const status = res.status
      if (status >= 500) throw new Error(SERVER_ERROR_MESSAGE)
      if (status === 401 || status === 403) {
        throw new Error('Zugriff verweigert. Bitte API-Schlüssel prüfen.')
      }
      throw new Error(SERVER_ERROR_MESSAGE)
    }
    return res
  } catch (e) {
    clearTimeout(timeoutId)
    if (e instanceof Error) {
      if (e.name === 'AbortError') throw new Error(TIMEOUT_MESSAGE)
      const msg = e.message.toLowerCase()
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
        throw new Error(NETWORK_ERROR_MESSAGE)
      }
    }
    throw new Error(NETWORK_ERROR_MESSAGE)
  }
}

function extractJsonObject(content: string): string {
  let text = content.trim()

  if (text.startsWith('```')) {
    const firstNewline = text.indexOf('\n')
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1)
    }
    const lastFence = text.lastIndexOf('```')
    if (lastFence !== -1) {
      text = text.slice(0, lastFence)
    }
    text = text.trim()
  }

  const firstBrace = text.indexOf('{')
  if (firstBrace === -1) return text

  let depth = 0
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        return text.slice(firstBrace, i + 1)
      }
    }
  }

  return text
}

export async function generateDeklinationWithAI(params: {
  lemma: string
  typ: 'a' | 'o' | 'u' | 'konsonantisch'
  deutschHint?: string
}): Promise<AiDeklinationResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Kein OpenAI API Key gefunden. Bitte VITE_OPENAI_API_KEY in der .env Datei setzen.')
  }

  const { lemma, typ, deutschHint } = params

  const systemPrompt =
    'Du bist ein strenger Latein-Lehrer. Antworte NUR mit gültigem JSON, ohne Erklärungen, ohne Markdown.'

  const userPrompt =
    `Erstelle die vollständige Deklination eines lateinischen Substantivs als JSON.\n` +
    `Typ: ${typ}-Deklination.\n` +
    `Lemma (Nominativ Singular): ${lemma}.\n` +
    (deutschHint ? `Deutsche Bedeutung (optional): ${deutschHint}.\n` : '') +
    `\nForm des JSON (Beispiel):\n` +
    `{\n` +
    `  "lemma": "domina",\n` +
    `  "typ": "a",\n` +
    `  "deutsch": "Herrin",\n` +
    `  "tabelle": {\n` +
    `    "singular": ["...", "...", "...", "...", "...", "..."],\n` +
    `    "plural": ["...", "...", "...", "...", "...", "..."]\n` +
    `  }\n` +
    `}\n` +
    `\nDie Arrays enthalten der Reihe nach die Formen in den Fällen: Nominativ, Genitiv, Dativ, Akkusativ, Ablativ, Vokativ.`

  const res = await openAIFetch(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    },
    apiKey,
  )

  const data = await res.json()
  const content: string | null =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content
      : null

  if (!content) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  const r = parsed as AiDeklinationResponse
  if (
    !r ||
    typeof r !== 'object' ||
    typeof r.lemma !== 'string' ||
    !r.tabelle ||
    !Array.isArray(r.tabelle.singular) ||
    !Array.isArray(r.tabelle.plural)
  ) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  return r
}

export async function generateVokabelSetWithAI(params: {
  topicLabel: string
  description?: string
  count: number
}): Promise<AiVokabelSetResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Kein OpenAI API Key gefunden. Bitte VITE_OPENAI_API_KEY in der .env Datei setzen.')
  }

  const { topicLabel, description, count } = params

  const systemPrompt =
    'Du bist ein strenger Latein-Lehrer. Antworte NUR mit gültigem JSON, ohne Erklärungen, ohne Markdown.'

  const userPrompt =
    `Erstelle ein Lernset mit lateinischen Vokabeln als JSON.\n` +
    `Thema: ${topicLabel}.\n` +
    `Anzahl der Vokabeln: ${count}.\n` +
    `Niveau: Anfänger bis leicht fortgeschrittene Schüler.\n` +
    (description ? `Zusätzliche Beschreibung: ${description}.\n` : '') +
    `\nWICHTIG:\n` +
    `- Alle Einträge müssen lateinische Vokabeln im Feld "vokabel" und eine sinnvolle deutsche Übersetzung im Feld "uebersetzung" enthalten.\n` +
    `- Verwende keine Sonderzeichen oder Erklärungen außerhalb des JSON.\n` +
    `- Vermeide Dubletten.\n` +
    `\nForm des JSON (Beispiel):\n` +
    `{\n` +
    `  "name": "Freizeit – Grundwortschatz",\n` +
    `  "items": [\n` +
    `    { "vokabel": "ludere", "uebersetzung": "spielen" },\n` +
    `    { "vokabel": "amare", "uebersetzung": "lieben" }\n` +
    `  ]\n` +
    `}\n`

  const res = await openAIFetch(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    },
    apiKey,
  )

  const data = await res.json()
  const content: string | null =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content
      : null

  if (!content) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  const r = parsed as AiVokabelSetResponse
  if (
    !r ||
    typeof r !== 'object' ||
    typeof r.name !== 'string' ||
    !Array.isArray(r.items) ||
    !r.items.every(
      (it) =>
        it &&
        typeof it === 'object' &&
        typeof (it as { vokabel: string }).vokabel === 'string' &&
        typeof (it as { uebersetzung: string }).uebersetzung === 'string',
    )
  ) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  return r
}

const FAECHER_NAMES = 'Mathe, Chemie, Latein, Spanisch, Französisch, Englisch, Bio, Physik'
const FAECHER_IDS = 'mathe, chemie, latein, spanisch, franzoesisch, englisch, bio, physik'

export async function chatLernsetAssistant(
  messages: { role: 'user' | 'assistant'; content: string }[],
  state?: LernsetAssistantState,
): Promise<LernsetAssistantTurn> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Kein OpenAI API Key gefunden. Bitte VITE_OPENAI_API_KEY in der .env Datei setzen.')
  }

  const systemPrompt =
    [
      'Du bist ein Lernset-Assistent. Du hilfst, Karteikarten-Lernsets für verschiedene Schulfächer zu erstellen.',
      '',
      'REIHENFOLGE (der Nutzer kann die Punkte in beliebiger Reihenfolge beantworten):',
      '1. Fach: In welchem Fach soll das Lernset sein? Erlaubte Fächer: ' + FAECHER_NAMES + '.',
      '2. Anzahl: Wie viele Karteikarten/Fragen soll das Set haben? (z. B. 10, 15, 20 – sinnvoll etwa 5–50).',
      '3. Thema: Was ist das genaue Thema? (z. B. "Quadratische Gleichungen", "A-Deklination", "Photosynthese").',
      '4. Klassenstufe: Welche Klassenstufe bist du? (5, 6, 7, 8, 9 oder 10) – damit das Niveau angepasst werden kann.',
      '5. Schwierigkeit (freiwillig): Der Nutzer kann optional sagen, ob z. B. Expertenniveau, schwierige Gleichungen, aktueller Lehrplan-Stand usw. gewünscht ist. Wenn er sich nicht äußert, weglassen – das Lernset kann trotzdem erstellt werden.',
      '',
      'STATE-Felder (alle optional, ergänze aus dem Chat):',
      '- fachId: genau eine der IDs: ' + FAECHER_IDS + '. Wenn der Nutzer ein Fach nennt, wähle die passende id (z. B. "Mathe" -> "mathe", "Latein" -> "latein").',
      '- count: Zahl der Karten (z. B. 15).',
      '- topic: das genaue Thema als kurzer Text.',
      '- klasse: Zahl 5, 6, 7, 8, 9 oder 10.',
      '- schwierigkeit: optional, kurzer Text (z. B. "Expertenniveau", "schwierige Gleichungen", "aktueller Schulstoff"). Nur setzen, wenn der Nutzer etwas dazu sagt.',
      '',
      'REGELN:',
      '- Frage freundlich nach fehlenden Infos. Der Nutzer kann in beliebiger Reihenfolge antworten.',
      '- Wenn alle vier Pflichtangaben (Fach, Anzahl, Thema, Klassenstufe) vorliegen: setze "ready": true und fülle "state" vollständig. Schwierigkeit ist optional.',
      '- In "reply" bei ready: kurze Bestätigung, z. B.: "Alles klar! Klicke jetzt auf „Lernset erstellen“, dann generiere ich dir die Karteikarten."',
      '- Halte deine Nachrichten kurz und klar.',
      '- Antworte IMMER NUR mit gültigem JSON. KEIN Markdown, KEINE Codeblöcke.',
      '',
      'JSON-Format:',
      '{ "reply": "deine Nachricht", "state": { "fachId": "latein", "count": 20, "topic": "...", "klasse": 8, "schwierigkeit": "optional" }, "ready": false, "error": null }',
    ].join('\n')

  const mergedState = state ?? {}

  const res = await openAIFetch(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'system',
          content: `Aktueller State (übernehmen und ergänzen): ${JSON.stringify(mergedState)}`,
        },
        ...messages,
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    },
    apiKey,
  )

  const data = await res.json()
  const content: string | null =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content
      : null

  if (!content) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    const clean = extractJsonObject(content)
    parsed = JSON.parse(clean)
  } catch {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  const raw = parsed as any
  const rawState: LernsetAssistantState =
    raw && typeof raw === 'object' && raw.state && typeof raw.state === 'object' ? (raw.state as LernsetAssistantState) : {}

  const nextState: LernsetAssistantState = {
    ...mergedState,
    ...rawState,
  }

  const isReadyFromModel = typeof raw.ready === 'boolean' ? raw.ready : false
  const hasFach = !!nextState.fachId && /^(mathe|chemie|latein|spanisch|franzoesisch|englisch|bio|physik)$/.test(nextState.fachId)
  const hasCount = typeof nextState.count === 'number' && nextState.count >= 1 && nextState.count <= 100
  const hasTopic = !!nextState.topic && nextState.topic.trim().length > 0
  const hasKlasse = typeof nextState.klasse === 'number' && nextState.klasse >= 5 && nextState.klasse <= 10
  const computedReady = hasFach && hasCount && hasTopic && hasKlasse
  const ready = isReadyFromModel || computedReady

  const reply: string =
    raw && typeof raw === 'object' && typeof raw.reply === 'string'
      ? (raw.reply as string)
      : 'Ich konnte deine Anfrage verarbeiten, aber die Antwort hatte nicht das erwartete Format.'

  const error: string | undefined =
    raw && typeof raw === 'object' && typeof raw.error === 'string' && raw.error.trim() ? (raw.error as string) : undefined

  return {
    reply,
    state: nextState,
    ready,
    error,
  }
}

/** Generiert ein Karteikarten-Set per KI für ein beliebiges Fach. Kurze Fragen + 3 plausible Falschantworten pro Karte für Multiple-Choice. */
export async function generateKarteikartenSetWithAI(params: {
  fachId: string
  fachName: string
  topic: string
  count: number
  klasse: number
  schwierigkeit?: string
}): Promise<AiKarteikartenSetResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Kein OpenAI API Key gefunden. Bitte VITE_OPENAI_API_KEY in der .env Datei setzen.')
  }

  const { fachName, topic, count, klasse, schwierigkeit } = params
  const clampedCount = Math.max(1, Math.min(100, count))

  const systemPrompt = [
    'Du bist ein Lernassistent für Schülerinnen und Schüler. Du erstellst Karteikarten als JSON.',
    'Nutze immer die neuesten Erkenntnisse und den aktuellen Schul-Lehrplan. Halte alles für Schüler verständlich – nicht für Experten oder Studierende.',
    'Formeln, Gleichungen und Reaktionsgleichungen so einfach wie möglich (Schulniveau).',
    'WICHTIG: Jede Karte hat "front" (Vorderseite, Frage/Begriff), "back" (richtige Antwort) und "wrongOptions": ein Array mit genau 3 plausiblen Falschantworten für Multiple-Choice (ähnlich klingend oder thematisch nah, aber eindeutig falsch).',
    'Front und back besonders KURZ (1–2 Zeilen). wrongOptions ebenfalls kurz.',
    'Antworte NUR mit gültigem JSON, ohne Markdown, ohne Erklärungen.',
  ].join('\n')

  let userPrompt =
    `Erstelle ein Karteikarten-Lernset für das Fach "${fachName}" zum Thema "${topic}".` +
    ` Zielgruppe: Schüler Klassenstufe ${klasse}. Anzahl Karten: ${clampedCount}.` +
    ` Jede Karte: "front" (Vorderseite), "back" (richtige Antwort), "wrongOptions": genau 3 plausible Falschantworten (für Multiple-Choice).` +
    ` Halte alles kurz und für Schüler verständlich (aktueller Schulstoff).`
  if (schwierigkeit && schwierigkeit.trim()) {
    userPrompt += ` Schwierigkeit/Niveau: ${schwierigkeit.trim()}. Berücksichtige das bei der Formulierung.`
  }
  userPrompt +=
    `\nAntworte nur mit diesem JSON-Format:\n` +
    `{"items":[{"front":"...","back":"...","wrongOptions":["Falsch1","Falsch2","Falsch3"]},{"front":"...","back":"...","wrongOptions":["...","...","..."]}]}`

  const res = await openAIFetch(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    },
    apiKey,
  )

  const data = await res.json()
  const content: string | null =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content
      : null

  if (!content) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonObject(content))
  } catch {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  const r = parsed as AiKarteikartenSetResponse
  if (
    !r ||
    typeof r !== 'object' ||
    !Array.isArray(r.items) ||
    !r.items.every(
      (it) =>
        it &&
        typeof it === 'object' &&
        typeof (it as { front: string }).front === 'string' &&
        typeof (it as { back: string }).back === 'string',
    )
  ) {
    throw new Error(PARSE_ERROR_MESSAGE)
  }

  const fallback: [string, string, string] = ['Option A', 'Option B', 'Option C']
  return {
    items: r.items.slice(0, 100).map((it) => {
      const wo = (it as { wrongOptions?: unknown[] }).wrongOptions
      const three =
        Array.isArray(wo) && wo.length >= 3
          ? [wo[0], wo[1], wo[2]].filter((x) => typeof x === 'string' && String(x).trim()).map((x) => String(x).trim().slice(0, 500))
          : []
      return {
        front: String(it.front).trim().slice(0, 2000),
        back: String(it.back).trim().slice(0, 2000),
        wrongOptions: three.length >= 3 ? (three as [string, string, string]) : fallback,
      }
    }),
  }
}

export async function chatLernSupport(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Kein OpenAI API Key gefunden. Bitte VITE_OPENAI_API_KEY in der .env Datei setzen.')
  }

  const systemPrompt =
    [
      'Du bist ein Lernunterstützer für Schülerinnen und Schüler.',
      'Du erklärst Themen (z. B. Mathe, Deutsch, Latein, Sachkunde) klar, Schritt für Schritt und auf Deutsch.',
      '',
      'Regeln:',
      '- Antworte kurz, präzise und in einfachen Worten.',
      '- Nutze Beispiele und kleine Merksätze, wenn es hilft.',
      '- Wenn der Nutzer explizit nach Formeln oder Schritten fragt, liste sie übersichtlich auf.',
      '- Stelle nur dann Rückfragen, wenn wirklich wichtige Infos fehlen.',
    ].join('\n')

  const res = await openAIFetch(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.5,
    },
    apiKey,
  )

  const data = await res.json()
  const content: unknown = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error(PARSE_ERROR_MESSAGE)
  }
  return content
}

