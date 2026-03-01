import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { Layout } from './components/Layout'
import { LoginModal } from './components/LoginModal'
import { HomePage } from './pages/HomePage'
import { LernenPage } from './pages/LernenPage'
import { NeuPage } from './pages/NeuPage'
import { StatistikenPage } from './pages/StatistikenPage'
import { EinstellungenPage } from './pages/EinstellungenPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { ShopPage } from './pages/ShopPage'

export default function App() {
  return (
    <ProfileProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lernen" element={<LernenPage />} />
          <Route path="/neu" element={<NeuPage />} />
          <Route path="/statistiken" element={<StatistikenPage />} />
          <Route path="/einstellungen" element={<EinstellungenPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/shop" element={<ShopPage />} />
        </Routes>
      </Layout>
      <LoginModal />
    </ProfileProvider>
  )
}
