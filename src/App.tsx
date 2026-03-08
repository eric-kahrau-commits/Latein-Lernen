import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { InLessonProvider } from './context/InLessonContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoginModal } from './components/LoginModal'
import { trySendDailyReminder } from './data/notifications'
import { HomePage } from './pages/HomePage'
import { LernenPage } from './pages/LernenPage'
import { NeuPage } from './pages/NeuPage'
import { StatistikenPage } from './pages/StatistikenPage'
import { EinstellungenPage } from './pages/EinstellungenPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { ShopPage } from './pages/ShopPage'
import { KIAssistantPage } from './pages/KIPage'
import { KILernsetVorschauPage } from './pages/KILernsetVorschauPage'
import { KICenterPage } from './pages/KICenterPage'
import { KarteikartenCreatePage } from './pages/KarteikartenCreatePage'

export default function App() {
  useEffect(() => {
    trySendDailyReminder()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') trySendDailyReminder()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return (
    <ProfileProvider>
      <InLessonProvider>
        <ErrorBoundary>
          <Layout>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lernen" element={<LernenPage />} />
            <Route path="/neu" element={<NeuPage />} />
            <Route path="/ki" element={<KICenterPage />} />
            <Route path="/ki/assistent" element={<KIAssistantPage />} />
            <Route path="/ki/assistent/vorschau" element={<KILernsetVorschauPage />} />
            <Route path="/ki/karteikarten" element={<KarteikartenCreatePage />} />
            <Route path="/statistiken" element={<StatistikenPage />} />
            <Route path="/einstellungen" element={<EinstellungenPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/shop" element={<ShopPage />} />
            </Routes>
          </Layout>
        </ErrorBoundary>
        <LoginModal />
      </InLessonProvider>
    </ProfileProvider>
  )
}
