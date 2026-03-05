'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type LandingTheme = 'dark' | 'light'

interface LandingThemeContextValue {
  theme: LandingTheme
  isDark: boolean
  toggle: () => void
}

const LandingThemeContext = createContext<LandingThemeContextValue>({
  theme: 'dark',
  isDark: true,
  toggle: () => {},
})

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<LandingTheme>('dark')
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return (
    <LandingThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggle }}>
      {children}
    </LandingThemeContext.Provider>
  )
}

export const useLandingTheme = () => useContext(LandingThemeContext)
