/**
 * Teilen: Web Share API mit Fallback (Kopieren in die Zwischenablage).
 */

/** Minimal shape für Lernset-Teilen (name + items reichen). */
export interface LernsetShareInput {
  name: string
  items: Array<{ vokabel: string; uebersetzung: string }>
}

export interface SharePayload {
  title: string
  text: string
  url?: string
}

export async function share(payload: SharePayload): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  const url = payload.url ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const shareData: ShareData = {
    title: payload.title,
    text: payload.text,
    url: url || undefined,
  }
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false
      // Fallback zu Kopieren
    }
  }
  // Fallback: Text in Zwischenablage
  const toCopy = [payload.title, payload.text].filter(Boolean).join('\n\n') + (url ? `\n${url}` : '')
  try {
    await navigator.clipboard.writeText(toCopy)
    return true
  } catch {
    return false
  }
}

export function getShareStreakText(streak: number): SharePayload {
  return {
    title: 'Latinum – Latein lernen',
    text:
      streak === 1
        ? 'Ich habe heute mit Latein Lernen angefangen! 🎯'
        : `Ich lerne seit ${streak} Tagen in Folge Latein mit Latein Lernen! 🔥`,
  }
}

export function getShareResultText(percent: number, lessonName: string): SharePayload {
  return {
    title: 'Latinum – Latein lernen',
    text:
      percent >= 100
        ? `Perfekt in "${lessonName}"! 💯 Latein Lernen`
        : `${percent} % in "${lessonName}" – Latein Lernen`,
  }
}

const MAX_LERNSET_SHARE_ITEMS = 25

/** Payload zum Teilen eines Lernsets (z. B. für Mitschüler oder Lehrer). */
export function getShareLernsetPayload(lernset: LernsetShareInput): SharePayload {
  const lines = lernset.items
    .slice(0, MAX_LERNSET_SHARE_ITEMS)
    .map((i) => `${i.vokabel} – ${i.uebersetzung}`)
  const more = lernset.items.length > MAX_LERNSET_SHARE_ITEMS
    ? `\n… und ${lernset.items.length - MAX_LERNSET_SHARE_ITEMS} weitere`
    : ''
  const listText = lines.length > 0 ? `\n\n${lines.join('\n')}${more}` : ''
  return {
    title: 'Latinum – Latein lernen',
    text: `Lernset: ${lernset.name}\nZum Üben mit Latinum – lade die App und lege los!${listText}`,
  }
}
