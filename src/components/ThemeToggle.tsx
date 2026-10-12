import type { ThemeMode } from '../hooks/useTheme'

interface ThemeToggleProps {
  theme: ThemeMode
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9 1.5v1.75M9 14.75V16.5M1.5 9h1.75M14.75 9H16.5M3.4 3.4l1.24 1.24M13.36 13.36l1.24 1.24M3.4 14.6l1.24-1.24M13.36 4.64l1.24-1.24"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M14.5 10.2A5.75 5.75 0 0 1 7.8 3.5 5.75 5.75 0 1 0 14.5 10.2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="theme-toggle-text">{next === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
