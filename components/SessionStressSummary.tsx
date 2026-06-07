'use client'

import type { StressSessionSummary } from '@/lib/stressTypes'

interface SessionStressSummaryProps {
  summary: StressSessionSummary | null
  onClose?: () => void
}

const LEVEL_LABEL: Record<string, string> = {
  good: '양호',
  watch: '관심',
  caution: '주의',
  danger: '휴식 권장',
}

export default function SessionStressSummary({
  summary,
  onClose,
}: SessionStressSummaryProps) {
  if (!summary) return null

  const sustained =
    summary.finalStressLevel === 'caution' || summary.finalStressLevel === 'danger'

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 text-sm text-ink-700">
      <h2 className="text-center text-lg font-semibold text-ink-900">
        이번 측정 요약
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-xs text-ink-500">평균 스트레스 지수</p>
          <p className="mt-1 text-xl font-semibold text-ink-900 tabular-nums">
            {summary.averageStressScore !== null
              ? `${summary.averageStressScore}점`
              : '측정 부족'}
          </p>
        </div>
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-xs text-ink-500">최고 스트레스 지수</p>
          <p className="mt-1 text-xl font-semibold text-ink-900 tabular-nums">
            {summary.maxStressScore !== null
              ? `${summary.maxStressScore}점`
              : '측정 부족'}
          </p>
        </div>
      </div>

      {summary.finalStressLevel && (
        <p className="mt-4 text-center text-xs text-ink-500">
          마무리 상태: {LEVEL_LABEL[summary.finalStressLevel] ?? summary.finalStressLevel}
        </p>
      )}

      <p className="mt-4 text-center leading-relaxed text-ink-600">
        {sustained
          ? '이번 측정에서는 스트레스 신호가 일정 시간 이상 유지되었습니다.'
          : '이번 측정에서는 특별한 스트레스 신호가 크지 않았습니다.'}
        <br />
        다음 작업 전 1분 휴식을 권장합니다.
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-risk-good px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          확인했어요
        </button>
      )}
    </div>
  )
}
