import { useState, useCallback } from 'react'
import { type Theme, getTheme, applyTheme } from '@/lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    setTheme,
  }
}
