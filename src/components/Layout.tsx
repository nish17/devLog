import type { ReactNode } from 'react'
import type { AppView } from '../types/achievement'

interface LayoutProps {
  view: AppView
  onNavigate: (view: AppView) => void
  children: ReactNode
  storageWarning?: string | null
}

const NAV_ITEMS: { view: AppView; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'journal', label: 'Journal' },
  { view: 'review', label: 'Review Mode' },
  { view: 'backups', label: 'Backups' },
]

export function Layout({
  view,
  onNavigate,
  children,
  storageWarning,
}: LayoutProps) {
  const activeNav =
    view === 'create' || view === 'edit' ? 'journal' : view

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-brand">
          <button
            type="button"
            className="brand-button"
            onClick={() => onNavigate('dashboard')}
          >
            <span className="brand-name">DevLog</span>
            <span className="brand-tagline">Your wins, remembered.</span>
          </button>
        </div>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={
                activeNav === item.view ? 'nav-link is-active' : 'nav-link'
              }
              aria-current={activeNav === item.view ? 'page' : undefined}
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {storageWarning ? (
        <div className="storage-banner" role="status">
          {storageWarning}
        </div>
      ) : null}

      <main id="main-content" className="site-main">
        {children}
      </main>

      <footer className="site-footer">
        <p>DevLog stores everything in this browser. Export backups regularly.</p>
      </footer>
    </div>
  )
}
