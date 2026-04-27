'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function RiskWarningModal({ open, onClose }: Props) {
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
          🌿 잠시 마음을 살펴요
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-600">
          최근 마음 상태가 평소와 다릅니다.
          <br />
          잠시 쉬어가거나 도움을 받아보는 것은 어떨까요?
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-ink-50 p-4">
          <p className="text-center text-xs text-ink-500">상담 전화 (24시간)</p>
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
