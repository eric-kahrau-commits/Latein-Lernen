import { useState, useEffect } from 'react'
import { isOnline } from '../data/aiClient'
import { WifiOffIcon } from './icons'
import './OfflineBanner.css'

export function OfflineBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOnline(isOnline())
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <WifiOffIcon className="offline-banner-icon" aria-hidden />
      <span className="offline-banner-text">
        Offline. Für KI und einige andere Funktionen wird eine Internetverbindung benötigt. Andere Lerninhalte funktionieren offline.
      </span>
    </div>
  )
}
