// 데모/발표 시연용 "관리자 권한" 모듈.
//
// 이 프로젝트는 서버가 없는 PWA이므로 실제 보안 수준의 관리자 인증을 구현할 수 없다.
// 아래 코드는 발표 시연을 위해 sessionStorage에 인증 상태를 저장하는 수준의
// 간이 접근 제어이며, 실제 서비스에서는 서버 기반 인증(세션/토큰)과
// 서버 측 권한 검증이 반드시 필요하다.

export interface AdminSession {
  role: 'admin'
  authenticatedAt: string
}

const SESSION_KEY = 'onmaum-admin-session'

// 데모용 관리자 코드. 실제 보안 목적이 아니며, 발표 시연에서만 사용한다.
export const DEMO_ADMIN_CODE = 'onmaum-admin'

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, value)
  } catch (err) {
    console.error('sessionStorage 쓰기 실패:', err)
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(key)
  } catch (err) {
    console.error('sessionStorage 삭제 실패:', err)
  }
}

export function getAdminSession(): AdminSession | null {
  const raw = safeGetItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AdminSession
    if (parsed?.role === 'admin' && typeof parsed.authenticatedAt === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function loginAsAdmin(code: string): boolean {
  if (code !== DEMO_ADMIN_CODE) return false

  const session: AdminSession = {
    role: 'admin',
    authenticatedAt: new Date().toISOString(),
  }
  safeSetItem(SESSION_KEY, JSON.stringify(session))
  return true
}

export function logoutAdmin(): void {
  safeRemoveItem(SESSION_KEY)
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null
}
