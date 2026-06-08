'use client'

import { useEffect, useState } from 'react'
import type { EmotionRecord } from '@/lib/db'
import type { EmotionResult } from '@/lib/emotionAnalysis'
import { aggregateStress } from '@/lib/stressIndex'
import { topTwoEmotions } from '@/lib/orbColor'
import { loadProfile, type Profile } from '@/lib/profile'
import { suggestionFor } from '@/lib/selfCareSuggestion'

/** duration 가중 평균 감정 (지배 감정 산출용). */
function averageEmotion(records: EmotionRecord[]): EmotionResult {
  const total = records.reduce((sum, r) => sum + r.duration, 0)
  if (total <= 0) return { happy: 0, calm: 1, sad: 0, angry: 0 }
  const acc = { happy: 0, calm: 0, sad: 0, angry: 0 }
  for (const r of records) {
    acc.happy += r.happy * r.duration
    acc.calm += r.calm * r.duration
    acc.sad += r.sad * r.duration
    acc.angry += r.angry * r.duration
  }
  return {
    happy: acc.happy / total,
    calm: acc.calm / total,
    sad: acc.sad / total,
    angry: acc.angry / total,
  }
}

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-600">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
    </div>
  )
}

/** 퇴근 통합 리포트 — 오늘 P/N + 지배 감정 기반 회복 제안. (spec §6) */
export default function DailyReport({ records }: { records: EmotionRecord[] }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => {
    // localStorage는 클라이언트에서만 — hydration mismatch 방지를 위한 의도적 setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile())
  }, [])

  const scores = aggregateStress(records)
  if (!scores) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-5 text-center text-sm text-ink-500">
        아직 오늘 기록이 충분하지 않아요
      </div>
    )
  }

  const [dominant] = topTwoEmotions(averageEmotion(records))
  const suggestion = suggestionFor(dominant, profile)

  return (
    <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5">
      <h3 className="text-base font-semibold text-ink-900">오늘도 고생했어요</h3>
      <div className="space-y-3">
        <Gauge label="긍정" value={scores.positive} color="linear-gradient(90deg,#9bd6a0,#f2c94c)" />
        <Gauge label="스트레스" value={scores.stress} color="linear-gradient(90deg,#f0b39f,#e8806a)" />
      </div>
      <div className="rounded-xl bg-risk-good/10 p-3 text-sm text-ink-800">{suggestion}</div>
    </div>
  )
}
