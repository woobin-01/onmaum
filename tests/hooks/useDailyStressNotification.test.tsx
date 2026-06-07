import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDailyStressNotification } from '@/hooks/useDailyStressNotification'

function setupNotificationMock(permission: NotificationPermission) {
  const NotificationMock = vi.fn().mockImplementation(() => ({
    onclick: null,
    close: vi.fn(),
  })) as unknown as typeof Notification & ReturnType<typeof vi.fn>
  ;(NotificationMock as unknown as { permission: NotificationPermission }).permission = permission
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

describe('useDailyStressNotification', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('danger가 아니면 Notification 생성 안 함', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useDailyStressNotification({
        date: '2026-04-27',
        stressScore: 70,
        stressLevel: 'caution',
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('stressLevel=null → Notification 생성 안 함', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useDailyStressNotification({
        date: '2026-04-27',
        stressScore: null,
        stressLevel: null,
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('permission != granted → Notification 생성 안 함', () => {
    const Mock = setupNotificationMock('default')
    renderHook(() =>
      useDailyStressNotification({
        date: '2026-04-27',
        stressScore: 90,
        stressLevel: 'danger',
        permission: 'default',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('danger + granted → Notification 생성', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useDailyStressNotification({
        date: '2026-04-27',
        stressScore: 88,
        stressLevel: 'danger',
        permission: 'granted',
      }),
    )
    expect(Mock).toHaveBeenCalledTimes(1)
    expect(Mock.mock.calls[0][0]).toContain('잠시 쉬어갈 시간이에요')
  })

  it('같은 날짜에는 한 번만 생성 (sessionStorage 체크)', () => {
    sessionStorage.setItem('onmaum-daily-alert-shown-2026-04-27', 'true')
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useDailyStressNotification({
        date: '2026-04-27',
        stressScore: 88,
        stressLevel: 'danger',
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('날짜가 바뀌면 다시 생성 가능', () => {
    const Mock = setupNotificationMock('granted')
    const { rerender } = renderHook(
      ({ date }: { date: string }) =>
        useDailyStressNotification({
          date,
          stressScore: 88,
          stressLevel: 'danger',
          permission: 'granted',
        }),
      { initialProps: { date: '2026-04-27' } },
    )
    rerender({ date: '2026-04-28' })
    expect(Mock).toHaveBeenCalledTimes(2)
  })

  it('sessionStorage 접근 실패해도 앱이 죽지 않는다', () => {
    const Mock = setupNotificationMock('granted')
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('storage 접근 불가')
      },
    })

    expect(() =>
      renderHook(() =>
        useDailyStressNotification({
          date: '2026-04-27',
          stressScore: 88,
          stressLevel: 'danger',
          permission: 'granted',
        }),
      ),
    ).not.toThrow()

    expect(Mock).toHaveBeenCalledTimes(1)

    if (original) Object.defineProperty(window, 'sessionStorage', original)
  })

  it('Notification이 없는 환경에서도 앱이 죽지 않는다', () => {
    vi.stubGlobal('Notification', undefined)
    expect(() =>
      renderHook(() =>
        useDailyStressNotification({
          date: '2026-04-27',
          stressScore: 88,
          stressLevel: 'danger',
          permission: 'granted',
        }),
      ),
    ).not.toThrow()
  })
})
