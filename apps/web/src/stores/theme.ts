import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

function applyTheme(theme: Theme): 'light' | 'dark' {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  return isDark ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: (theme) => {
        const resolvedTheme = applyTheme(theme)
        set({ theme, resolvedTheme })
      },
    }),
    { name: 'vc-theme' }
  )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('vc-theme')
  const theme = (stored ? (JSON.parse(stored) as { state?: { theme?: Theme } }).state?.theme : 'system') ?? 'system'
  applyTheme(theme)

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useThemeStore.getState().theme
    if (current === 'system') applyTheme('system')
  })
}
