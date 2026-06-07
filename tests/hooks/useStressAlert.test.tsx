import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStressAlert } from '@/hooks/useStressAlert'

function setupNotificationMock(
  permission: NotificationPermission,
  impl?: () => unknown,
) {
  const NotificationMock = vi.fn().mockImplementation(
    impl ??
      (() => ({
        onclick: null,
        close: vi.fn(),
      })),
  ) as unknown as typeof Notification & ReturnType<typeof vi.fn>
  ;(NotificationMock as unknown as { permission: NotificationPermission }).permission =
    permission
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

const baseOptions = {
  sessionId: 'session-1',
  mode: 'realtime' as const,
  thresholds: {
    cautionSustainMs: 20_000,
    dangerSustainMs: 10_000,
    cooldownMs: 120_000,
  },
}

describe('useStressAlert', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.unstubAllGlobals()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('active=false → 알림이 열리지 않음', () => {
    setupNotificationMock('granted')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: false,
        stressScore: 80,
        stressLevel: 'danger',
        permission: 'granted',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.alertOpen).toBe(false)
  })

  it('stressScore=null이면 알림이 열리지 않음', () => {
    setupNotificationMock('granted')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: true,
        stressScore: null,
        stressLevel: 'danger',
        permission: 'granted',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.alertOpen).toBe(false)
  })

  it('caution이 20초 미만 지속되면 알림 없음', () => {
    setupNotificationMock('granted')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: true,
        stressScore: 60,
        stressLevel: 'caution',
        permission: 'granted',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(19_000)
    })
    expect(result.current.alertOpen).toBe(false)
  })

  it('caution이 20초 이상 지속되면 alertOpen=true', () => {
    setupNotificationMock('granted')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: true,
        stressScore: 60,
        stressLevel: 'caution',
        permission: 'granted',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(21_000)
    })
    expect(result.current.alertOpen).toBe(true)
    expect(result.current.alertLevel).toBe('caution')
    expect(result.current.shouldShowBanner).toBe(true)
    expect(result.current.shouldShowModal).toBe(false)
  })

  it('danger가 10초 이상 지속되면 alertLevel=danger 및 브라우저 알림 발송', () => {
    const Mock = setupNotificationMock('granted')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: true,
        stressScore: 90,
        stressLevel: 'danger',
        permission: 'granted',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(11_000)
    })
    expect(result.current.alertOpen).toBe(true)
    expect(result.current.alertLevel).toBe('danger')
    expect(result.current.shouldShowModal).toBe(true)
    expect(Mock).toHaveBeenCalledTimes(1)
  })

  it('danger가 caution보다 우선함 (caution 알림을 건너뛰고 danger만 표시)', () => {
    setupNotificationMock('granted')
    const { result, rerender } = renderHook(
      ({ stressLevel }: { stressLevel: 'caution' | 'danger' }) =>
        useStressAlert({
          ...baseOptions,
          active: true,
          stressScore: 90,
          stressLevel,
          permission: 'granted',
        }),
      { initialProps: { stressLevel: 'caution' as const } },
    )

    // caution 5초 지속 (20초 미만) → danger로 전환 → 10초 이상 지속
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    rerender({ stressLevel: 'danger' })
    act(() => {
      vi.advanceTimersByTime(12_000)
    })

    expect(result.current.alertOpen).toBe(true)
    expect(result.current.alertLevel).toBe('danger')
  })

  it('dismissAlert 호출 후 같은 레벨 알림이 쿨다운 동안 다시 뜨지 않음', () => {
    setupNotificationMock('granted')
    const { result, rerender } = renderHook(
      ({ stressLevel }: { stressLevel: 'caution' | 'good' }) =>
        useStressAlert({
          ...baseOptions,
          active: true,
          stressScore: 60,
          stressLevel,
          permission: 'granted',
        }),
      { initialProps: { stressLevel: 'caution' as const } },
    )

    act(() => {
      vi.advanceTimersByTime(21_000)
    })
    expect(result.current.alertOpen).toBe(true)

    act(() => {
      result.current.dismissAlert()
    })
    expect(result.current.alertOpen).toBe(false)

    // good으로 내려갔다가 다시 caution으로 돌아와도 쿨다운(2분) 동안은 다시 뜨지 않음
    rerender({ stressLevel: 'good' })
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    rerender({ stressLevel: 'caution' })
    act(() => {
      vi.advanceTimersByTime(21_000)
    })

    expect(result.current.alertOpen).toBe(false)
  })

  it('active=false로 바뀌면 내부 상태 초기화', () => {
    setupNotificationMock('granted')
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useStressAlert({
          ...baseOptions,
          active,
          stressScore: 60,
          stressLevel: 'caution',
          permission: 'granted',
        }),
      { initialProps: { active: true } },
    )

    act(() => {
      vi.advanceTimersByTime(21_000)
    })
    expect(result.current.alertOpen).toBe(true)

    rerender({ active: false })
    expect(result.current.alertOpen).toBe(false)
    expect(result.current.alertLevel).toBeNull()
  })

  it('Notification 권한이 없으면 브라우저 알림을 시도하지 않음 (UI 알림은 정상 표시)', () => {
    const Mock = setupNotificationMock('default')
    const { result } = renderHook(() =>
      useStressAlert({
        ...baseOptions,
        active: true,
        stressScore: 90,
        stressLevel: 'danger',
        permission: 'default',
      }),
    )
    act(() => {
      vi.advanceTimersByTime(11_000)
    })
    expect(result.current.alertOpen).toBe(true)
    expect(Mock).not.toHaveBeenCalled()
  })

  it('Notification 생성 실패가 앱 에러로 전파되지 않음', () => {
    setupNotificationMock('granted', () => {
      throw new Error('Notification 생성 실패')
    })

    expect(() => {
      const { result } = renderHook(() =>
        useStressAlert({
          ...baseOptions,
          active: true,
          stressScore: 90,
          stressLevel: 'danger',
          permission: 'granted',
        }),
      )
      act(() => {
        vi.advanceTimersByTime(11_000)
      })
      expect(result.current.alertOpen).toBe(true)
    }).not.toThrow()
  })
})
