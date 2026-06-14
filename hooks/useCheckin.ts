'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEmotionsByDate, getEmotionsByDateRange } from '@/lib/emotionRepository'
import { recentStress, dailyStressHistory } from '@/lib/dailyStress'
import { computeBaselineState, classifyStress, BASELINE_WINDOW_DAYS } from '@/lib/baseline'
import { checkinDue, type CheckinSlot } from '@/lib/checkin'
import { checkinLine } from '@/lib/checkinCopy'
import { applyOffset, nextOffset, type SelfReport } from '@/lib/calibration'
import { loadSettings, saveSettings } from '@/lib/settings'
import { loadCheckinDone, saveCheckinEntry } from '@/lib/dayState'

interface Args {
  now?: Date
}

interface CheckinView {
  due: boolean
  slot: CheckinSlot | null
  line: string
  submit: (report: SelfReport) => void
}

export function useCheckin({ now = new Date() }: Args = {}): CheckinView {
  const date = now.toLocaleDateString('en-CA')

  const todayRecords = useLiveQuery(() => getEmotionsByDate(date), [date])
  const rangeRecords = useLiveQuery(() => {
    const start = new Date(now)
    start.setDate(start.getDate() - (BASELINE_WINDOW_DAYS - 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return getEmotionsByDateRange(start, end)
  }, [date])

  const settings = loadSettings()
  const hasTodayData = (todayRecords?.length ?? 0) > 0

  const { due, slot } = checkinDue({
    now,
    morning: settings.morningWindow,
    afternoon: settings.afternoonWindow,
    doneSlots: loadCheckinDone(date),
    hasTodayData,
  })

  let line = ''
  if (due && todayRecords && rangeRecords) {
    const current = recentStress(todayRecords, now)
    const baseline = computeBaselineState(
      dailyStressHistory(rangeRecords, BASELINE_WINDOW_DAYS, now),
    )
    if (current) {
      const adjusted = applyOffset(current.stress, settings.calibrationOffset)
      line = checkinLine(classifyStress(adjusted, baseline), baseline.mode)
    }
  }

  const submit = useCallback(
    (report: SelfReport) => {
      if (!slot) return
      const s = loadSettings()
      saveSettings({ ...s, calibrationOffset: nextOffset(s.calibrationOffset, report) })
      saveCheckinEntry(date, slot, report, now.getTime())
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot, date, now],
  )

  return { due, slot, line, submit }
}
