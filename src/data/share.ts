/**
 * Teilen: Web Share API mit Fallback (Kopieren in die Zwischenablage).
 */

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
