'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'onmaum_theme'
const VALID_THEMES: Theme[] = ['light', 'dark', 'auto']
const CYCLE: Theme[] = ['light', 'dark', 'auto']

function isTheme(value: string | null): value is Theme {
  return value !== null && VALID_THEMES.includes(value as Theme)
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : 'auto'
  } catch {
    return 'auto'
  }
}

function writeStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures so theme state still updates.
  }
}

export function resolveAuto(date: Date = new Date()): ResolvedTheme {
  const hour = date.getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return theme === 'auto' ? resolveAuto() : theme
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    writeStoredTheme(next)
    setThemeState(next)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme =
        CYCLE[(CYCLE.indexOf(currentTheme) + 1) % CYCLE.length] ?? 'light'
      writeStoredTheme(nextTheme)
      return nextTheme
    })
  }, [])

  return { theme, resolvedTheme, setTheme, cycleTheme }
}
