import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWarningDismissal } from '@/hooks/useWarningDismissal'

describe('useWarningDismissal', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('sessionStorage 비어있음 → dismissed=false 초기값', () => {
    const { result } = renderHook(() => useWarningDismissal('2026-04-27'))
    expect(result.current.dismissed).toBe(false)
  })

  it('dismiss() 호출 → dismissed=true 변경', () => {
    const { result } = renderHook(() => useWarningDismissal('2026-04-27'))
    act(() => {
      result.current.dismiss()
    })
    expect(result.current.dismissed).toBe(true)
  })

  it('dismiss() 호출 → sessionStorage에 저장', () => {
    const { result } = renderHook(() => useWarningDismissal('2026-04-27'))
    act(() => {
      result.current.dismiss()
    })
    expect(sessionStorage.getItem('onmaum-warning-dismissed-2026-04-27')).toBe(
      'true',
    )
  })

  it('같은 date로 재마운트 → dismissed=true 유지 (sessionStorage 읽음)', () => {
    sessionStorage.setItem('onmaum-warning-dismissed-2026-04-27', 'true')
    const { result } = renderHook(() => useWarningDismissal('2026-04-27'))
    expect(result.current.dismissed).toBe(true)
  })

  it('다른 date → dismissed=false (별도 key)', () => {
    sessionStorage.setItem('onmaum-warning-dismissed-2026-04-27', 'true')
    const { result } = renderHook(() => useWarningDismissal('2026-04-28'))
    expect(result.current.dismissed).toBe(false)
  })

  it('date prop 변경 → dismissed 자동 reset', () => {
    sessionStorage.setItem('onmaum-warning-dismissed-2026-04-27', 'true')
    const { result, rerender } = renderHook(
      ({ date }) => useWarningDismissal(date),
      { initialProps: { date: '2026-04-27' } },
    )
    expect(result.current.dismissed).toBe(true)

    rerender({ date: '2026-04-28' })
    expect(result.current.dismissed).toBe(false)
  })
})
