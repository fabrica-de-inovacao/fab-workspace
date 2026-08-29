import { useEffect, useState } from 'react'
import { getEffectiveTheme, setTheme, type ThemeMode } from '../lib/theme.js'

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>(getEffectiveTheme)

  useEffect(() => {
    function handleThemeChange() {
      setThemeState(getEffectiveTheme())
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === 'fab-theme') {
        handleThemeChange()
      }
    }

    window.addEventListener('fab-theme-change', handleThemeChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('fab-theme-change', handleThemeChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  function setExplicitTheme(newTheme: ThemeMode) {
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: setExplicitTheme,
  }
}
