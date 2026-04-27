'use client'

import { useEffect } from 'react'
import type { PermissionState } from '@/hooks/useNotificationPermission'
import type { RiskLevel } from '@/lib/riskCalculator'

interface Options {
  riskLevel: RiskLevel | null | undefined
  date: string // YYYY-MM-DD
  permission: PermissionState
}

const STORAGE_KEY_PREFIX = 'onmaum-notification-shown-'

function storageKey(date: string): string {
  return `${STORAGE_KEY_PREFIX}${date}`
}

function readShown(date: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(date)) === 'true'
  } catch {
    return false
  }
}

function markShown(date: string): void {
  try {
    sessionStorage.setItem(storageKey(date), 'true')
  } catch (err) {
    console.error('sessionStorage 쓰기 실패:', err)
  }
}

export function useRiskNotification(opts: Options): void {
  const { riskLevel, date, permission } = opts

  useEffect(() => {
    if (permission !== 'granted') return
    if (riskLevel !== 'warning') return
    if (typeof Notification === 'undefined') return
    if (readShown(date)) return

    try {
      const notification = new Notification('🌿 잠시 마음을 살펴요', {
        body: '최근 마음 상태가 평소와 다릅니다. 잠시 쉬어가거나 도움을 받아보세요.',
        icon: '/favicon.ico',
        tag: `onmaum-risk-${date}`,
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      markShown(date)
    } catch (err) {
      console.error('Notification 생성 실패:', err)
    }
  }, [riskLevel, date, permission])
}
