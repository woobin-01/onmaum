'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type AdminSession,
  getAdminSession,
  loginAsAdmin,
  logoutAdmin,
} from '@/lib/adminAuth'

interface Result {
  session: AdminSession | null
  isAuthenticated: boolean
  login: (code: string) => boolean
  logout: () => void
}

export function useAdminAuth(): Result {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession())

  // 첫 마운트 시 클라이언트 환경에서 세션 다시 확인 (SSR hydration 호환). 한 번만 호출.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getAdminSession())
  }, [])

  const login = useCallback((code: string): boolean => {
    const ok = loginAsAdmin(code)
    if (ok) setSession(getAdminSession())
    return ok
  }, [])

  const logout = useCallback(() => {
    logoutAdmin()
    setSession(null)
  }, [])

  return {
    session,
    isAuthenticated: session !== null,
    login,
    logout,
  }
}
