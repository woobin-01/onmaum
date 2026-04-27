import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRiskNotification } from '@/hooks/useRiskNotification'

function setupNotificationMock(permission: NotificationPermission) {
  const NotificationMock = vi.fn().mockImplementation(() => ({
    onclick: null,
    close: vi.fn(),
  })) as unknown as typeof Notification & ReturnType<typeof vi.fn>
  ;(NotificationMock as unknown as { permission: NotificationPermission }).permission = permission
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

describe('useRiskNotification', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('permission != granted → 알림 안 뜸', () => {
    const Mock = setupNotificationMock('default')
    renderHook(() =>
      useRiskNotification({
        riskLevel: 'warning',
        date: '2026-04-27',
        permission: 'default',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('riskLevel != warning → 알림 안 뜸', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useRiskNotification({
        riskLevel: 'caution',
        date: '2026-04-27',
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('riskLevel=null → 알림 안 뜸', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useRiskNotification({
        riskLevel: null,
        date: '2026-04-27',
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('warning + granted → Notification 생성 (한 번)', () => {
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useRiskNotification({
        riskLevel: 'warning',
        date: '2026-04-27',
        permission: 'granted',
      }),
    )
    expect(Mock).toHaveBeenCalledTimes(1)
    expect(Mock.mock.calls[0][0]).toContain('잠시 마음을 살펴요')
  })

  it('같은 날 다시 마운트 → 알림 안 뜸 (sessionStorage 체크)', () => {
    sessionStorage.setItem('onmaum-notification-shown-2026-04-27', 'true')
    const Mock = setupNotificationMock('granted')
    renderHook(() =>
      useRiskNotification({
        riskLevel: 'warning',
        date: '2026-04-27',
        permission: 'granted',
      }),
    )
    expect(Mock).not.toHaveBeenCalled()
  })

  it('새 date → 다시 알림 가능 (key 다름)', () => {
    const Mock = setupNotificationMock('granted')
    const { rerender } = renderHook(
      ({ date }: { date: string }) =>
        useRiskNotification({
          riskLevel: 'warning',
          date,
          permission: 'granted',
        }),
      { initialProps: { date: '2026-04-27' } },
    )
    rerender({ date: '2026-04-28' })
    expect(Mock).toHaveBeenCalledTimes(2)
  })
})
