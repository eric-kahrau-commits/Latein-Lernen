import { useProfile } from '../context/ProfileContext'
import { UserIcon } from './icons'
import './TopBar.css'

type TopBarProps = {
  menuOpen: boolean
  onMenuToggle: () => void
}

export function TopBar({ menuOpen, onMenuToggle }: TopBarProps) {
  const { userName } = useProfile()

  return (
    <header className="topbar">
      <button
        type="button"
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={onMenuToggle}
        aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={menuOpen}
      >
        <span className="hamburger-box">
          <span className="hamburger-inner" />
        </span>
      </button>
      <div className="topbar-profile">
        <span className="topbar-profile-icon" aria-hidden>
          <UserIcon />
        </span>
        <span className="topbar-profile-name">{userName || 'Profil'}</span>
      </div>
    </header>
  )
}
