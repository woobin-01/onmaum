import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEMO_ADMIN_CODE,
  getAdminSession,
  isAdminAuthenticated,
  loginAsAdmin,
  logoutAdmin,
} from '@/lib/adminAuth'

describe('adminAuth', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('잘못된 코드 입력 시 로그인 실패', () => {
    expect(loginAsAdmin('wrong-code')).toBe(false)
    expect(getAdminSession()).toBeNull()
    expect(isAdminAuthenticated()).toBe(false)
  })

  it('올바른 코드 입력 시 로그인 성공', () => {
    expect(loginAsAdmin(DEMO_ADMIN_CODE)).toBe(true)
    expect(isAdminAuthenticated()).toBe(true)
  })

  it('로그인 성공 시 sessionStorage에 저장', () => {
    loginAsAdmin(DEMO_ADMIN_CODE)
    const raw = sessionStorage.getItem('onmaum-admin-session')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.role).toBe('admin')
    expect(typeof parsed.authenticatedAt).toBe('string')
  })

  it('logoutAdmin 호출 시 sessionStorage 삭제', () => {
    loginAsAdmin(DEMO_ADMIN_CODE)
    expect(isAdminAuthenticated()).toBe(true)

    logoutAdmin()
    expect(sessionStorage.getItem('onmaum-admin-session')).toBeNull()
    expect(isAdminAuthenticated()).toBe(false)
  })

  it('window가 없는 환경(SSR)에서도 에러가 나지 않음', () => {
    vi.stubGlobal('window', undefined)

    expect(() => {
      expect(getAdminSession()).toBeNull()
      // 코드 검증 자체는 가능하지만, window가 없으면 세션을 저장할 수 없다.
      expect(loginAsAdmin(DEMO_ADMIN_CODE)).toBe(true)
      expect(isAdminAuthenticated()).toBe(false)
      logoutAdmin()
    }).not.toThrow()

    vi.unstubAllGlobals()
  })

  it('sessionStorage 접근이 실패해도 에러가 나지 않음', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('storage 접근 불가')
      },
    })

    expect(() => {
      expect(getAdminSession()).toBeNull()
      loginAsAdmin(DEMO_ADMIN_CODE)
      logoutAdmin()
    }).not.toThrow()

    if (original) Object.defineProperty(window, 'sessionStorage', original)
    vi.unstubAllGlobals()
  })
})
