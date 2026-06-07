'use client'

import type { StressLevel } from '@/lib/stressTypes'

interface StressAlertOrbProps {
  stressScore: number | null
  stressLevel: StressLevel | null
  bubbleMessage?: string | null
  showBubble?: boolean
}

const LABEL_BY_LEVEL: Record<StressLevel, string> = {
  good: '양호',
  watch: '관심',
  caution: '주의',
  danger: '휴식 권장',
}

const ORB_COLOR_BY_LEVEL: Record<StressLevel, string> = {
  good: 'bg-risk-good',
  watch: 'bg-ink-400',
  caution: 'bg-risk-caution',
  danger: 'bg-risk-warning',
}

const RING_COLOR_BY_LEVEL: Record<StressLevel, string> = {
  good: 'ring-risk-good/30',
  watch: 'ring-ink-300/40',
  caution: 'ring-risk-caution/40',
  danger: 'ring-risk-warning/50',
}

export default function StressAlertOrb({
  stressScore,
  stressLevel,
  bubbleMessage,
  showBubble = false,
}: StressAlertOrbProps) {
  const label = stressScore === null || stressLevel === null
    ? '분석 대기'
    : LABEL_BY_LEVEL[stressLevel]

  const orbColor =
    stressScore === null || stressLevel === null
      ? 'bg-ink-300'
      : ORB_COLOR_BY_LEVEL[stressLevel]

  const ringColor =
    stressScore === null || stressLevel === null
      ? 'ring-ink-200/40'
      : RING_COLOR_BY_LEVEL[stressLevel]

  const isDanger = stressLevel === 'danger'

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-2 sm:right-6">
      {showBubble && bubbleMessage && (
        <div className="max-w-[220px] rounded-2xl border border-ink-200 bg-white px-4 py-2 text-xs leading-relaxed text-ink-700 shadow-md">
          {bubbleMessage}
        </div>
      )}
      <div
        role="status"
        aria-label={`현재 상태: ${label}`}
        className={`flex h-16 w-16 flex-col items-center justify-center rounded-full text-white shadow-lg ring-4 transition-colors duration-300 ${orbColor} ${ringColor} ${
          isDanger ? 'animate-pulse' : ''
        }`}
      >
        <span className="text-[11px] font-medium leading-tight">{label}</span>
      </div>
    </div>
  )
}
