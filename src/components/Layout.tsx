import { useState, useCallback } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import './Layout.css'

type LayoutProps = {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), [])

  return (
    <div className="layout">
      <TopBar menuOpen={menuOpen} onMenuToggle={toggleMenu} />
      <Sidebar open={menuOpen} onClose={closeMenu} />
      <main className="main">{children}</main>
    </div>
  )
}
