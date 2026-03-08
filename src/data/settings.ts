/**
 * App-Einstellungen (Theme, Schriftgröße) – localStorage + Anwendung auf document.
 */

const STORAGE_KEY = 'latinum-settings'

export type ThemeValue = 'system' | 'light' | 'dark' | 'sonnenuntergang' | 'wald'
export type FontSizeValue = 'normal' | 'large'
export type VoiceProfileValue =
  | 'ki-voice-1'
  | 'ki-voice-2'
  | 'ki-voice-3'
  | 'ki-voice-4'
  | 'ki-voice-5'
  | 'ki-voice-6'
  | 'ki-voice-7'
  | 'ki-voice-8'
  | 'ki-voice-9'
  | 'ki-voice-10'

export interface AppSettings {
  theme: ThemeValue
  fontSize: FontSizeValue
  voiceProfile: VoiceProfileValue
  /** Gespeicherter Name der gewählten Sprachausgabe-Stimme (von speechSynthesis.getVoices()) */
  selectedVoiceName?: string | null
  /** KI-Antworten per Sprachausgabe vorlesen */
  speakResponses: boolean
}

const DEFAULT: AppSettings = {
  theme: 'system',
  fontSize: 'normal',
  voiceProfile: 'ki-voice-1',
  selectedVoiceName: null,
  speakResponses: true,
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT }
    const p = parsed as Record<string, unknown>
    const theme =
      p.theme === 'light' || p.theme === 'dark' || p.theme === 'system' ||
      p.theme === 'sonnenuntergang' || p.theme === 'wald'
        ? (p.theme as ThemeValue)
        : DEFAULT.theme
    const fontSize =
      p.fontSize === 'large' || p.fontSize === 'normal' ? (p.fontSize as FontSizeValue) : DEFAULT.fontSize
    const vp =
      p.voiceProfile === 'ki-voice-1' ||
      p.voiceProfile === 'ki-voice-2' ||
      p.voiceProfile === 'ki-voice-3' ||
      p.voiceProfile === 'ki-voice-4' ||
      p.voiceProfile === 'ki-voice-5' ||
      p.voiceProfile === 'ki-voice-6' ||
      p.voiceProfile === 'ki-voice-7' ||
      p.voiceProfile === 'ki-voice-8' ||
      p.voiceProfile === 'ki-voice-9' ||
      p.voiceProfile === 'ki-voice-10'
        ? (p.voiceProfile as VoiceProfileValue)
        : DEFAULT.voiceProfile
    const selectedVoiceName =
      p.selectedVoiceName === null || p.selectedVoiceName === undefined
        ? DEFAULT.selectedVoiceName
        : typeof p.selectedVoiceName === 'string'
          ? p.selectedVoiceName
          : null
    const speakResponses = typeof p.speakResponses === 'boolean' ? p.speakResponses : DEFAULT.speakResponses
    return { theme, fontSize, voiceProfile: vp, selectedVoiceName, speakResponses }
  } catch {
    return { ...DEFAULT }
  }
}

function save(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Aktuell angewendetes Theme (für CSS data-theme; Sonnenuntergang/Wald werden 1:1 übernommen) */
export function getResolvedTheme(): string {
  const s = load()
  if (s.theme === 'system') return getSystemTheme()
  return s.theme
}

/** Einstellungen lesen */
export function getSettings(): AppSettings {
  return load()
}

/** Theme setzen und sofort anwenden */
export function setTheme(theme: ThemeValue) {
  const s = load()
  s.theme = theme
  save(s)
  applyToDocument(s)
}

/** Schriftgröße setzen und sofort anwenden */
export function setFontSize(fontSize: FontSizeValue) {
  const s = load()
  s.fontSize = fontSize
  save(s)
  applyToDocument(s)
}

export function setVoiceProfile(voiceProfile: VoiceProfileValue) {
  const s = load()
  s.voiceProfile = voiceProfile
  save(s)
}

export function setSelectedVoiceName(name: string | null) {
  const s = load()
  s.selectedVoiceName = name ?? null
  save(s)
}

export function setSpeakResponses(on: boolean) {
  const s = load()
  s.speakResponses = on
  save(s)
}

/** Einstellungen auf document anwenden (für Theme + Schriftgröße) */
export function applyToDocument(settings?: AppSettings) {
  const s = settings ?? load()
  const resolved = s.theme === 'system' ? getSystemTheme() : s.theme
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.classList.toggle('font-size-large', s.fontSize === 'large')
}

/** Beim Start aufrufen (z. B. in main.tsx), reagiert auf System-Theme-Änderung */
export function initSettings() {
  applyToDocument()
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      const s = load()
      if (s.theme === 'system') applyToDocument(s)
    })
  }
}
