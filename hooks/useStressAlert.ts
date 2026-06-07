'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PermissionState } from '@/hooks/useNotificationPermission'
import { getStressAlertCopy } from '@/lib/stressAlertMessages'
import type { StressLevel } from '@/lib/stressTypes'

const CAUTION_SUSTAIN_MS = 20_000
const DANGER_SUSTAIN_MS = 10_000
const ALERT_COOLDOWN_MS = 120_000
const TICK_MS = 1000

type AlertLevel = 'caution' | 'danger'

interface UseStressAlertOptions {
  active: boolean
  sessionId: string | null
  stressScore: number | null
  stressLevel: StressLevel | null
  permission?: PermissionState
  mode: 'realtime' | 'session-summary' | 'daily'
  date?: string
  now?: () => number
  thresholds?: {
    cautionSustainMs?: number
    dangerSustainMs?: number
    cooldownMs?: number
  }
}

interface StressAlertState {
  alertOpen: boolean
  alertLevel: AlertLevel | null
  alertTitle: string | null
  alertMessage: string | null
  recommendation: string | null
  shouldShowOrbBubble: boolean
  shouldShowBanner: boolean
  shouldShowModal: boolean
  dismissAlert: () => void
}

interface SustainTracker {
  level: AlertLevel | null
  startedAt: number | null
}

interface ShownAt {
  caution: number | null
  danger: number | null
}

function safeReadSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWriteSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch (err) {
    console.error('sessionStorage 쓰기 실패:', err)
  }
}

function shownKey(scopeId: string, level: AlertLevel): string {
  return `onmaum-realtime-alert-shown-${scopeId}-${level}`
}

function dismissedKey(scopeId: string, level: AlertLevel): string {
  return `onmaum-realtime-alert-dismissed-${scopeId}-${level}`
}

export function useStressAlert(options: UseStressAlertOptions): StressAlertState {
  const {
    active,
    sessionId,
    stressScore,
    stressLevel,
    permission = 'unsupported',
    mode,
    date,
    now = Date.now,
    thresholds,
  } = options

  const cautionSustainMs = thresholds?.cautionSustainMs ?? CAUTION_SUSTAIN_MS
  const dangerSustainMs = thresholds?.dangerSustainMs ?? DANGER_SUSTAIN_MS
  const cooldownMs = thresholds?.cooldownMs ?? ALERT_COOLDOWN_MS

  // 실시간 측정은 sessionId, 일별 통계는 date 기준으로 알림 상태를 구분한다.
  const scopeId = sessionId ?? date ?? null

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertLevel, setAlertLevel] = useState<AlertLevel | null>(null)

  const sustainRef = useRef<SustainTracker>({ level: null, startedAt: null })
  const shownAtRef = useRef<ShownAt>({ caution: null, danger: null })
  const dismissedDangerRef = useRef(false)
  const notifiedDangerRef = useRef(false)
  const alertLevelRef = useRef<AlertLevel | null>(null)

  const latestRef = useRef<{
    stressScore: number | null
    stressLevel: StressLevel | null
  }>({ stressScore, stressLevel })

  useEffect(() => {
    latestRef.current = { stressScore, stressLevel }
  }, [stressScore, stressLevel])

  // sessionId/date(scope)가 바뀌면 새 세션으로 보고 상태를 초기화하고
  // sessionStorage에 남아있던 이전 상태를 복원한다.
  useEffect(() => {
    sustainRef.current = { level: null, startedAt: null }
    shownAtRef.current = { caution: null, danger: null }
    dismissedDangerRef.current = false
    notifiedDangerRef.current = false
    alertLevelRef.current = null
    // scope(세션/날짜) 전환 시 UI 즉시 정리. cascading render 아님 (scopeId 변할 때만).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlertOpen(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlertLevel(null)

    if (!scopeId) return

    const cautionShown = safeReadSession(shownKey(scopeId, 'caution'))
    if (cautionShown) shownAtRef.current.caution = Number(cautionShown)

    const dangerShown = safeReadSession(shownKey(scopeId, 'danger'))
    if (dangerShown) {
      shownAtRef.current.danger = Number(dangerShown)
      notifiedDangerRef.current = true
    }

    const dangerDismissed = safeReadSession(dismissedKey(scopeId, 'danger'))
    if (dangerDismissed === 'true') dismissedDangerRef.current = true
  }, [scopeId])

  const sendDangerNotification = useCallback(() => {
    if (permission !== 'granted') return
    if (typeof window === 'undefined') return
    if (typeof Notification === 'undefined') return

    const tag =
      mode === 'daily'
        ? `onmaum-stress-danger-${date ?? 'unknown'}`
        : `onmaum-stress-danger-${sessionId ?? 'unknown'}`

    try {
      const notification = new Notification('잠시 쉬어갈 시간이에요', {
        body: '스트레스 지수가 높게 유지되고 있어요. 1분 휴식을 권장합니다.',
        icon: '/favicon.ico',
        tag,
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (err) {
      console.error('Notification 생성 실패:', err)
    }
  }, [permission, mode, date, sessionId])

  const canShowAlert = useCallback(
    (level: AlertLevel, currentTime: number): boolean => {
      if (level === 'danger') {
        if (dismissedDangerRef.current) return false
        const last = shownAtRef.current.danger
        if (last !== null && currentTime - last < cooldownMs) return false
        return true
      }

      // danger 알림 직후 쿨다운 동안에는 caution 알림을 띄우지 않는다 (danger 우선).
      const lastDanger = shownAtRef.current.danger
      if (lastDanger !== null && currentTime - lastDanger < cooldownMs) return false

      const lastCaution = shownAtRef.current.caution
      if (lastCaution !== null && currentTime - lastCaution < cooldownMs) return false

      return true
    },
    [cooldownMs],
  )

  const triggerAlert = useCallback(
    (level: AlertLevel, currentTime: number) => {
      shownAtRef.current[level] = currentTime
      alertLevelRef.current = level
      setAlertLevel(level)
      setAlertOpen(true)

      if (scopeId) {
        safeWriteSession(shownKey(scopeId, level), String(currentTime))
      }

      if (level === 'danger' && !notifiedDangerRef.current) {
        notifiedDangerRef.current = true
        sendDangerNotification()
      }
    },
    [scopeId, sendDangerNotification],
  )

  const evaluate = useCallback(() => {
    const currentTime = now()
    const { stressScore: score, stressLevel: level } = latestRef.current

    // 데이터 부족, 얼굴 미감지, 측정 일시중단(stressScore=null) → 타이머 증가시키지 않음
    if (score === null || level === null) {
      sustainRef.current = { level: null, startedAt: null }
      return
    }

    if (level === 'good' || level === 'watch') {
      sustainRef.current = { level: null, startedAt: null }
      return
    }

    // level === 'caution' | 'danger'
    const tracker = sustainRef.current
    if (tracker.level !== level) {
      sustainRef.current = { level, startedAt: currentTime }
      return
    }

    // 이미 같은 레벨의 알림이 열려 있으면 중복 트리거하지 않음
    if (alertLevelRef.current === level) return

    const startedAt = tracker.startedAt ?? currentTime
    const elapsed = currentTime - startedAt

    if (level === 'danger') {
      if (elapsed >= dangerSustainMs && canShowAlert('danger', currentTime)) {
        triggerAlert('danger', currentTime)
      }
      return
    }

    if (elapsed >= cautionSustainMs && canShowAlert('caution', currentTime)) {
      triggerAlert('caution', currentTime)
    }
  }, [now, cautionSustainMs, dangerSustainMs, canShowAlert, triggerAlert])

  // 측정 중일 때만 단일 interval로 지속 시간을 추적한다.
  useEffect(() => {
    if (!active) return
    evaluate()
    const id = setInterval(evaluate, TICK_MS)
    return () => clearInterval(id)
  }, [active, evaluate])

  // active=false → 내부 타이머와 alert 상태 정리 (쿨다운/세션 기억은 유지)
  useEffect(() => {
    if (active) return
    sustainRef.current = { level: null, startedAt: null }
    alertLevelRef.current = null
    // active=false 전환 시 UI 즉시 정리. cascading render 아님 (active 변할 때만).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlertOpen(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlertLevel(null)
  }, [active])

  const dismissAlert = useCallback(() => {
    const level = alertLevelRef.current
    setAlertOpen(false)

    if (level) {
      if (scopeId) {
        safeWriteSession(dismissedKey(scopeId, level), 'true')
      }
      if (level === 'danger') {
        dismissedDangerRef.current = true
      }
    }

    alertLevelRef.current = null
    setAlertLevel(null)
  }, [scopeId])

  const activeCopy = alertOpen ? getStressAlertCopy(alertLevel, stressScore) : null
  const watchCopy =
    !alertOpen && stressLevel === 'watch' ? getStressAlertCopy('watch') : null

  return {
    alertOpen,
    alertLevel: alertOpen ? alertLevel : null,
    alertTitle: activeCopy?.title ?? null,
    alertMessage: activeCopy?.message ?? watchCopy?.message ?? null,
    recommendation: activeCopy?.recommendation ?? watchCopy?.recommendation ?? null,
    shouldShowOrbBubble: alertOpen || stressLevel === 'watch',
    shouldShowBanner: alertOpen,
    shouldShowModal: alertOpen && alertLevel === 'danger',
    dismissAlert,
  }
}
