export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'bookinghub-theme'

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage niedostępny (np. tryb prywatny z blokadą) — ignoruj
  }
}
