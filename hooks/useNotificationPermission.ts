'use client'

import { useCallback, useEffect, useState } from 'react'

export type PermissionState = NotificationPermission | 'unsupported'

interface Result {
  supported: boolean
  permission: PermissionState
  request: () => Promise<void>
}

function readPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function useNotificationPermission(): Result {
  const [permission, setPermission] = useState<PermissionState>(() =>
    readPermission(),
  )

  // 첫 마운트 시 클라이언트 환경 권한 다시 체크 (SSR hydration 호환). 한 번만 호출, cascading 아님.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(readPermission())
  }, [])

  const request = useCallback(async (): Promise<void> => {
    if (typeof Notification === 'undefined') return
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
    } catch (err) {
      console.error('Notification.requestPermission 실패:', err)
    }
  }, [])

  const supported = permission !== 'unsupported'

  return { supported, permission, request }
}
