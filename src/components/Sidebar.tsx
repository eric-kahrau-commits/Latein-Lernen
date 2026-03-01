import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  LernenIcon,
  NeuIcon,
  StatistikenIcon,
  EinstellungenIcon,
  FlameIcon,
  CrownIcon,
} from './icons'
import { getStreak } from '../data/streak'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/lernen', label: 'Lernen', icon: LernenIcon },
  { to: '/neu', label: 'Neu', icon: NeuIcon },
  { to: '/statistiken', label: 'Statistiken', icon: StatistikenIcon },
  { to: '/shop', label: 'Shop', icon: CrownIcon },
  { to: '/einstellungen', label: 'Einstellungen', icon: EinstellungenIcon },
] as const

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">L</div>
            <span>Latein Lernen</span>
          </div>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to} className="nav-item">
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="nav-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="sidebar-streak" aria-label={`Aktueller Streak: ${getStreak()} Tage`}>
            <FlameIcon className="sidebar-streak-icon" />
            <span className="sidebar-streak-count">{getStreak()}</span>
            <span className="sidebar-streak-label">Tage</span>
          </div>
        </nav>
      </aside>
    </>
  )
}
