'use client'

import { useEffect } from 'react'

type Mode = 'realtime' | 'daily' | 'session-summary'

interface Props {
  open: boolean
  onClose: () => void
  stressScore?: number | null
  title?: string
  message?: string
  recommendation?: string
  mode?: Mode
}

const DEFAULT_TITLE = '🌿 잠시 마음을 살펴요'
const DEFAULT_MESSAGE = '최근 마음 상태가 평소와 다릅니다.'
const DEFAULT_RECOMMENDATION = '잠시 쉬어가거나 도움을 받아보는 것은 어떨까요?'

const MODE_MESSAGE: Record<Mode, string> = {
  realtime: '지금은 1분 휴식을 권장합니다.',
  daily: '오늘은 평소보다 스트레스 신호가 많이 감지되었습니다.',
  'session-summary': '이번 통화/측정에서 스트레스 신호가 높게 유지되었습니다.',
}

export default function RiskWarningModal({
  open,
  onClose,
  stressScore = null,
  title,
  message,
  recommendation,
  mode,
}: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  const resolvedTitle = title ?? DEFAULT_TITLE
  const resolvedMessage = message ?? (mode ? MODE_MESSAGE[mode] : DEFAULT_MESSAGE)
  const resolvedRecommendation = recommendation ?? (mode ? null : DEFAULT_RECOMMENDATION)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="risk-warning-title"
          className="text-center text-xl font-semibold text-ink-900"
        >
          {resolvedTitle}
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-600">
          {resolvedMessage}
          {resolvedRecommendation && (
            <>
              <br />
              {resolvedRecommendation}
            </>
          )}
        </p>

        {stressScore !== null && stressScore !== undefined && (
          <p className="mt-2 text-center text-xs text-ink-500">
            현재 스트레스 지수 <span className="font-medium text-ink-700">{stressScore}점</span>
          </p>
        )}

        <div className="mt-5 space-y-2 rounded-xl bg-ink-50 p-4">
          <p className="text-center text-xs text-ink-500">
            도움이 필요하다면 이용할 수 있어요
          </p>
          <a
            href="tel:1577-0199"
            className="block text-center text-base font-medium text-ink-900 hover:text-risk-good"
          >
            📞 1577-0199 정신건강위기상담
          </a>
          <a
            href="tel:1393"
            className="block text-center text-base font-medium text-ink-900 hover:text-risk-good"
          >
            📞 1393 자살예방상담
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-risk-good px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          알겠어요
        </button>
      </div>
    </div>
  )
}
