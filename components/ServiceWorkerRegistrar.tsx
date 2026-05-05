'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      // dev 모드: 옛 chunk가 캐시된 SW가 새 빌드의 hydration을 망가뜨릴 수 있어
      // 이미 등록된 SW를 모두 해제. 다음 새로고침부터 깨끗한 상태로.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {})
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker 등록 완료:', registration.scope)
      })
      .catch((err) => {
        console.error('❌ Service Worker 등록 실패:', err)
      })
  }, [])

  return null
}
