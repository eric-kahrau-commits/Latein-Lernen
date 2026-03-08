/// <reference types="vite/client" />

/* Web Speech API (Browser) */
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  start(): void
  stop(): void
}
declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}
declare var webkitSpeechRecognition: typeof SpeechRecognition
