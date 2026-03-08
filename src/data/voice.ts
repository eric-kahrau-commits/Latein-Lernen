/**
 * Sprachausgabe für KI: nutzt die in den Einstellungen gewählte Stimme.
 */

import { getSettings } from './settings'

const VOICE_SAMPLE_TEXT = 'Hallo! Das ist eine Vorschau deiner gewählten Stimme für die KI.'

/** Deutsche Stimmen von getVoices() sortiert (stabil). */
function getGermanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  const voices = window.speechSynthesis.getVoices()
  const german = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('de'))
  return [...german].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Gibt die in den Einstellungen gewählte Stimme zurück.
 * Verwendet selectedVoiceName, falls gesetzt; sonst Fallback nach voiceProfile-Index.
 */
export function getKiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = getGermanVoices()
  if (voices.length === 0) return null
  const s = getSettings()
  if (s.selectedVoiceName && s.selectedVoiceName.trim()) {
    const found = voices.find((v) => v.name === s.selectedVoiceName || v.voiceURI === s.selectedVoiceName)
    if (found) return found
  }
  const indexMap: Record<string, number> = {
    'ki-voice-1': 0,
    'ki-voice-2': 1,
    'ki-voice-3': 2,
    'ki-voice-4': 3,
    'ki-voice-5': 4,
    'ki-voice-6': 5,
    'ki-voice-7': 6,
    'ki-voice-8': 7,
    'ki-voice-9': 8,
    'ki-voice-10': 9,
  }
  const index = indexMap[s.voiceProfile] ?? 0
  return voices[Math.min(index, voices.length - 1)] ?? voices[0]
}

/** Alle verfügbaren deutschen Stimmen (für Einstellungen-Auswahl). */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return getGermanVoices()
}

/** Kurzes Hörbeispiel mit der angegebenen Stimme abspielen. */
export function playVoiceSample(voice: SpeechSynthesisVoice, text: string = VOICE_SAMPLE_TEXT): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'de-DE'
  u.voice = voice
  u.rate = 1.0
  u.pitch = 1.0
  window.speechSynthesis.speak(u)
}

export { VOICE_SAMPLE_TEXT }
