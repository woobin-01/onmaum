import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveAuto, useTheme } from '@/hooks/useTheme'

describe('resolveAuto', () => {
  it('returns light at 06:00', () => {
    expect(resolveAuto(new Date('2026-04-28T06:00:00'))).toBe('light')
  })

  it('returns light at 17:59', () => {
    expect(resolveAuto(new Date('2026-04-28T17:59:00'))).toBe('light')
  })

  it('returns dark at 18:00', () => {
    expect(resolveAuto(new Date('2026-04-28T18:00:00'))).toBe('dark')
  })

  it('returns dark at 05:59', () => {
    expect(resolveAuto(new Date('2026-04-28T05:59:00'))).toBe('dark')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults theme to auto', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('auto')
  })

  it('restores dark from localStorage', () => {
    localStorage.setItem('onmaum_theme', 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('ignores invalid localStorage values', () => {
    localStorage.setItem('onmaum_theme', 'system')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('auto')
  })

  it('setTheme updates theme and localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('onmaum_theme')).toBe('light')
  })

  it('cycleTheme cycles light to dark to auto to light', () => {
    localStorage.setItem('onmaum_theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('onmaum_theme')).toBe('dark')

    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('auto')
    expect(localStorage.getItem('onmaum_theme')).toBe('auto')

    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('onmaum_theme')).toBe('light')
  })

  it('reflects resolvedTheme to html data-theme after setTheme dark', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('resolves auto mode using current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-28T12:00:00'))
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('auto')
    })

    expect(result.current.resolvedTheme).toBe('light')
  })
})
