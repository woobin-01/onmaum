'use client'

import { useThemeContext } from './ThemeProvider'
import type { Theme } from '@/hooks/useTheme'

const ICON: Record<Theme, string> = {
  light: '☀',
  dark: '☾',
  auto: '◐',
}

const LABEL: Record<Theme, string> = {
  light: '라이트',
  dark: '다크',
  auto: '자동',
}

const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'auto',
  auto: 'light',
}

interface Props {
  className?: string
}

export default function ThemeToggle({ className }: Props) {
  const { theme, cycleTheme } = useThemeContext()
  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`테마 전환: 현재 ${LABEL[theme]}, 클릭하면 ${LABEL[NEXT[theme]]}`}
      className={
        className ??
        'inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]'
      }
    >
      <span aria-hidden="true">{ICON[theme]}</span>
    </button>
  )
}
