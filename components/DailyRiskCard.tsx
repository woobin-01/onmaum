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
  good: 'text-risk-good',
  caution: 'text-risk-caution',
  warning: 'text-risk-warning',
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
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
        ⏳ 오늘 데이터 로딩 중...
      </div>
    )
  }

  const risk = aggregateDailyRisk(records, today)

  if (!risk) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <p className="text-sm text-ink-500">오늘 마음 상태</p>
        <p className="mt-2 text-xl font-medium text-ink-400">집계 데이터 없음</p>
        <p className="mt-1 text-xs text-ink-400">
          10초 이상 측정해야 집계됩니다
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border p-6 text-center ${RISK_BG[risk.riskLevel]} ${RISK_BORDER[risk.riskLevel]}`}
    >
      <p className="text-sm text-ink-500">오늘 마음 상태</p>
      <p
        className={`mt-2 text-3xl font-bold ${RISK_TEXT[risk.riskLevel]}`}
      >
        {RISK_LABEL[risk.riskLevel]}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-ink-500">기록</p>
          <p className="mt-1 font-medium text-ink-800 tabular-nums">
            {risk.recordCount}개
          </p>
        </div>
        <div>
          <p className="text-ink-500">부정 비율</p>
          <p className="mt-1 font-medium text-ink-800 tabular-nums">
            {Math.round(risk.negativeRatio * 100)}%
          </p>
        </div>
        <div>
          <p className="text-ink-500">평탄도</p>
          <p className="mt-1 font-medium text-ink-800 tabular-nums">
            {risk.flatAffectAvg.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
