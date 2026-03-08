import { useEffect, useRef, useState } from 'react'
import '../pages/KIPage.css'

interface VoiceBubbleProps {
  isListening: boolean
  transcript?: string
  onListening?: (state: boolean) => void
}

export function VoiceBubble({ isListening, transcript = 'Ich höre dir zu…' }: VoiceBubbleProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [frequencyData, setFrequencyData] = useState<number[]>([5, 5, 5, 5, 5])
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isListening) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const startAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        analyserRef.current = analyser
        source.connect(analyser)

        const frequencyBinCount = analyser.frequencyBinCount
        const dataArray = new Uint8Array(frequencyBinCount)

        const updateBars = () => {
          analyser.getByteFrequencyData(dataArray)
          
          // Nur 5 Balken für die Visualisierung nehmen
          const newBars = [
            Math.floor(dataArray[5] / 255 * 100),
            Math.floor(dataArray[15] / 255 * 100),
            Math.floor(dataArray[30] / 255 * 100),
            Math.floor(dataArray[50] / 255 * 100),
            Math.floor(dataArray[80] / 255 * 100),
          ]

          setFrequencyData(
            newBars.map(v => Math.min(100, Math.max(20, v)))
          )

          if (isListening) {
            animationFrameRef.current = requestAnimationFrame(updateBars)
          }
        }

        updateBars()
      } catch (error) {
        console.error('Fehler beim Zugriff auf Mikrofon:', error)
      }
    }

    startAudioAnalysis()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isListening])

  return (
    <div className="voice-bubble">
      <div className="voice-bubble-content">
        <div className="voice-mic-icon">🎤</div>
        <p className="voice-bubble-text">{transcript}</p>
        <div className="voice-visualizer">
          {frequencyData.map((height, index) => (
            <div
              key={index}
              className="voice-bar"
              style={{
                height: `${height}%`,
                minHeight: '12px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
