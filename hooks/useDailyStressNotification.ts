'use client'

import { useEffect } from 'react'
import type { PermissionState } from '@/hooks/useNotificationPermission'
import type { StressLevel } from '@/lib/stressTypes'

interface UseDailyStressNotificationOptions {
  date: string // YYYY-MM-DD
  stressScore: number | null
  stressLevel: StressLevel | null
  permission: PermissionState
}

const STORAGE_KEY_PREFIX = 'onmaum-daily-alert-shown-'

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

/**
 * 통계 페이지의 일별 "휴식 권장 단계(danger)" 브라우저 알림.
 * 점수 계산은 하지 않고, 외부에서 들어온 stressLevel만으로 하루 한 번만 알림을 보낸다.
 */
export function useDailyStressNotification(
  options: UseDailyStressNotificationOptions,
): void {
  const { date, stressScore, stressLevel, permission } = options

  useEffect(() => {
    if (permission !== 'granted') return
    if (stressLevel !== 'danger') return
    if (typeof Notification === 'undefined') return
    if (readShown(date)) return

    try {
      const notification = new Notification('잠시 쉬어갈 시간이에요', {
        body:
          stressScore !== null
            ? `오늘 스트레스 지수가 ${stressScore}점으로 높게 유지되었어요. 1분 휴식을 권장합니다.`
            : '오늘 스트레스 신호가 높게 유지되었어요. 1분 휴식을 권장합니다.',
        icon: '/favicon.ico',
        tag: `onmaum-stress-danger-${date}`,
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      markShown(date)
    } catch (err) {
      console.error('Notification 생성 실패:', err)
    }
  }, [date, stressScore, stressLevel, permission])
}
