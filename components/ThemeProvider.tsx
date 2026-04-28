// components/ThemeProvider.tsx
'use client'

import { createContext, useContext } from 'react'
import { useTheme, type Theme, type ResolvedTheme } from '@/hooks/useTheme'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme(next: Theme): void
  cycleTheme(): void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useTheme()
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used within <ThemeProvider>')
  }
  return ctx
}
