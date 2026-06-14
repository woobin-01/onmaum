'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEmotionsByDate, getEmotionsByDateRange } from '@/lib/emotionRepository'
import { recentStress, dailyStressHistory } from '@/lib/dailyStress'
import { computeBaselineState, classifyStress, BASELINE_WINDOW_DAYS } from '@/lib/baseline'
import { applyOffset } from '@/lib/calibration'
import { updateSustain, shouldNudge, type SustainState } from '@/lib/nudge'
import { loadSettings } from '@/lib/settings'
import { loadNudgeDayState, saveNudgeDayState } from '@/lib/dayState'

const NUDGE_MESSAGE = '마음에 힘이 들어간 지 좀 됐어요. 잠깐 숨 돌릴까요?'

export function useNudge() {
  const [bannerOpen, setBannerOpen] = useState(false)
  const sustainRef = useRef<SustainState | null>(null)

  const today = new Date().toLocaleDateString('en-CA')
  const todayRecords = useLiveQuery(() => getEmotionsByDate(today), [today])
  const rangeRecords = useLiveQuery(() => {
    const start = new Date()
    start.setDate(start.getDate() - (BASELINE_WINDOW_DAYS - 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return getEmotionsByDateRange(start, end)
  }, [today])

  useEffect(() => {
    if (!todayRecords || !rangeRecords) return
    const now = new Date()
    const settings = loadSettings()

    const current = recentStress(todayRecords, now)
    if (!current) {
      sustainRef.current = updateSustain(sustainRef.current, 'low', now.getTime())
      return
    }
    const adjusted = applyOffset(current.stress, settings.calibrationOffset)
    const baseline = computeBaselineState(
      dailyStressHistory(rangeRecords, BASELINE_WINDOW_DAYS, now),
    )
    const level = classifyStress(adjusted, baseline)
    sustainRef.current = updateSustain(sustainRef.current, level, now.getTime())

    const dayState = loadNudgeDayState(today)
    if (shouldNudge({ settings: settings.nudge, sustain: sustainRef.current, dayState, now })) {
      saveNudgeDayState(today, { count: dayState.count + 1, lastAtMs: now.getTime() })
      setBannerOpen(true)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const n = new Notification('🌿 잠깐 숨 돌릴까요?', {
            body: NUDGE_MESSAGE,
            icon: '/favicon.ico',
            tag: `onmaum-nudge-${today}`,
          })
          n.onclick = () => {
            window.focus()
            n.close()
          }
        } catch (err) {
          console.error('Notification 생성 실패:', err)
        }
      }
    }
  }, [todayRecords, rangeRecords, today])

  const close = useCallback(() => setBannerOpen(false), [])
  const muteToday = useCallback(() => {
    const s = loadNudgeDayState(today)
    saveNudgeDayState(today, { ...s, count: Number.MAX_SAFE_INTEGER })
    setBannerOpen(false)
  }, [today])

  return { bannerOpen, message: NUDGE_MESSAGE, close, muteToday }
}
