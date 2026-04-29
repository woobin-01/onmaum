import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStageLabel } from '@/hooks/useStageLabel'

describe('useStageLabel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('초기 empty → visible=false, message=null', () => {
    const { result } = renderHook(() => useStageLabel('empty'))
    expect(result.current.visible).toBe(false)
    expect(result.current.message).toBeNull()
  })

  it('처음 awakening 도달 → visible=true, message 설정, localStorage 갱신', () => {
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('awakening')
  })

  it('이미 awakening 도달했으면 다시 마운트해도 visible=false', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'awakening')
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(false)
    expect(result.current.message).toBeNull()
  })

  it('awakening → forming 상승 → visible=true, forming 메시지', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'awakening')
    const { result } = renderHook(() => useStageLabel('forming'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('결이 보이기 시작했어요')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('하강(forming → empty)은 visible=false, localStorage 그대로', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'forming')
    const { result } = renderHook(() => useStageLabel('empty'))
    expect(result.current.visible).toBe(false)
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('잘못된 localStorage 값은 empty 로 간주 (awakening 라벨 정상 등장)', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'banana')
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
  })

  it('3000ms 후 visible=false 자동 전환 (페이드아웃 시작)', () => {
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(result.current.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2)
    })
    expect(result.current.visible).toBe(false)
  })

  it('빠른 연속 변경 — 새 단계 즉시 적용 + 이전 타이머 clear', () => {
    const { result, rerender } = renderHook(
      ({ stage }: { stage: 'awakening' | 'forming' }) => useStageLabel(stage),
      { initialProps: { stage: 'awakening' } },
    )
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    rerender({ stage: 'forming' })
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('결이 보이기 시작했어요')
    // 이전 타이머가 살아있었다면 awakening 시작 + 3000ms = 2500ms 더 가면 false 가 돼버린다.
    // 새 타이머 기준이면 3000ms 더 가야 false. 검증:
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.visible).toBe(false)
  })
})
