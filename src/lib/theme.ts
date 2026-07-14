export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'bookinghub-theme'

/** Kolory tła dopasowane do CSS --background w index.css */
const THEME_COLORS: Record<Theme, string> = {
  dark:  '#262626',
  light: '#f9f9f9',
}

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')

  // Aktualizuj kolor paska systemowego (status bar + nav bar w PWA)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLORS[theme]

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage niedostępny (np. tryb prywatny z blokadą) — ignoruj
  }
}
