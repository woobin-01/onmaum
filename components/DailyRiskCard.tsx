'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getEmotionsByDate } from '@/lib/emotionRepository'
import { aggregateDailyRisk, type RiskLevel } from '@/lib/riskCalculator'

const RISK_LABEL: Record<RiskLevel, string> = {
  good: '양호',
  caution: '주의',
  warning: '위험',
}

const RISK_TEXT: Record<RiskLevel, string> = {
  good: 'text-[var(--accent)]',
  caution: 'text-[var(--caution)]',
  warning: 'text-[var(--warning)]',
}

const RISK_BG: Record<RiskLevel, string> = {
  good: 'bg-risk-good/10',
  caution: 'bg-risk-caution/10',
  warning: 'bg-risk-warning/10',
}

const RISK_BORDER: Record<RiskLevel, string> = {
  good: 'border-risk-good/30',
  caution: 'border-risk-caution/30',
  warning: 'border-risk-warning/30',
}

function todayLocalDate(): string {
  return new Date().toLocaleDateString('en-CA')
}

export default function DailyRiskCard() {
  const today = todayLocalDate()
  const records = useLiveQuery(() => getEmotionsByDate(today), [today])

  if (records === undefined) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center text-sm text-[var(--fg-muted)]">
        ⏳ 오늘 데이터 로딩 중...
      </div>
    )
  }

  const risk = aggregateDailyRisk(records, today)

  if (!risk) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center">
        <p className="text-sm text-[var(--fg-muted)]">오늘 마음 상태</p>
        <p className="mt-2 text-xl font-light text-[var(--fg-faint)]">집계 데이터 없음</p>
        <p className="mt-1 text-xs text-[var(--fg-faint)]">
          10초 이상 측정해야 집계됩니다
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border p-6 text-center ${RISK_BG[risk.riskLevel]} ${RISK_BORDER[risk.riskLevel]}`}
    >
      <p className="text-sm text-[var(--fg-muted)]">오늘 마음 상태</p>
      <p
        className={`mt-2 text-3xl font-thin ${RISK_TEXT[risk.riskLevel]}`}
      >
        {RISK_LABEL[risk.riskLevel]}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-[var(--fg-muted)]">기록</p>
          <p className="mt-1 font-light text-[var(--fg)] tabular-nums">
            {risk.recordCount}개
          </p>
        </div>
        <div>
          <p className="text-[var(--fg-muted)]">부정 비율</p>
          <p className="mt-1 font-light text-[var(--fg)] tabular-nums">
            {Math.round(risk.negativeRatio * 100)}%
          </p>
        </div>
        <div>
          <p className="text-[var(--fg-muted)]">평탄도</p>
          <p className="mt-1 font-light text-[var(--fg)] tabular-nums">
            {risk.flatAffectAvg.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
