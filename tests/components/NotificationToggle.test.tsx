import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationToggle from '@/components/NotificationToggle'

vi.mock('@/hooks/useNotificationPermission', () => ({
  useNotificationPermission: vi.fn(),
}))

import { useNotificationPermission } from '@/hooks/useNotificationPermission'

const mockHook = vi.mocked(useNotificationPermission)

describe('NotificationToggle', () => {
  beforeEach(() => {
    mockHook.mockReset()
  })

  it('supported=false → 컴포넌트 자체 렌더 안 됨 (null)', () => {
    mockHook.mockReturnValue({
      supported: false,
      permission: 'unsupported',
      request: vi.fn(),
    })
    const { container } = render(<NotificationToggle />)
    expect(container.firstChild).toBeNull()
  })

  it('permission=default → "알림 받기" 버튼 표시', () => {
    mockHook.mockReturnValue({
      supported: true,
      permission: 'default',
      request: vi.fn(),
    })
    render(<NotificationToggle />)
    expect(
      screen.getByRole('button', { name: '알림 받기' }),
    ).toBeInTheDocument()
  })

  it('permission=default + 버튼 클릭 → request 호출', () => {
    const request = vi.fn()
    mockHook.mockReturnValue({
      supported: true,
      permission: 'default',
      request,
    })
    render(<NotificationToggle />)
    fireEvent.click(screen.getByRole('button', { name: '알림 받기' }))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('permission=granted → "켜짐" 표시 + 버튼 없음', () => {
    mockHook.mockReturnValue({
      supported: true,
      permission: 'granted',
      request: vi.fn(),
    })
    render(<NotificationToggle />)
    expect(screen.getByText(/켜짐/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '알림 받기' })).toBeNull()
  })

  it('permission=denied → "차단됨" 표시 + 안내 메시지', () => {
    mockHook.mockReturnValue({
      supported: true,
      permission: 'denied',
      request: vi.fn(),
    })
    render(<NotificationToggle />)
    expect(screen.getByText(/차단됨/)).toBeInTheDocument()
    expect(screen.getByText(/브라우저 설정/)).toBeInTheDocument()
  })

  it('헤드 카피 "위험 신호 알림" 노출 (supported일 때)', () => {
    mockHook.mockReturnValue({
      supported: true,
      permission: 'default',
      request: vi.fn(),
    })
    render(<NotificationToggle />)
    expect(screen.getByText(/위험 신호 알림/)).toBeInTheDocument()
  })
})
