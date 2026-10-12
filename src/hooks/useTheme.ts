import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'devlog.theme.v1'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readStoredTheme(): ThemeMode | null {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    // ignore
  }
  return null
}

export function resolveInitialTheme(): ThemeMode {
  return readStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light')
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

function persistTheme(theme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    // If the user never saved a preference, follow OS changes.
    if (readStoredTheme() !== null) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() !== null) return
      setThemeState(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = (next: ThemeMode) => {
    persistTheme(next)
    setThemeState(next)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
