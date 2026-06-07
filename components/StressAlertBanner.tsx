'use client'

interface StressAlertBannerProps {
  open: boolean
  level: 'caution' | 'danger' | null
  title: string | null
  message: string | null
  recommendation: string | null
  onClose: () => void
}

const LEVEL_STYLE: Record<'caution' | 'danger', string> = {
  caution: 'border-risk-caution/40 bg-risk-caution/10',
  danger: 'border-risk-warning/40 bg-risk-warning/10',
}

const CLOSE_LABEL: Record<'caution' | 'danger', string> = {
  caution: '나중에 볼게요',
  danger: '괜찮아요',
}

export default function StressAlertBanner({
  open,
  level,
  title,
  message,
  recommendation,
  onClose,
}: StressAlertBannerProps) {
  if (!open || !level) return null

  return (
    <div
      role="status"
      className={`rounded-2xl border p-4 text-sm text-ink-700 shadow-sm ${LEVEL_STYLE[level]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {title && <p className="font-semibold text-ink-900">{title}</p>}
          {message && <p className="text-ink-600">{message}</p>}
          {recommendation && (
            <p className="text-xs text-ink-500">{recommendation}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-ink-300 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100"
        >
          {CLOSE_LABEL[level]}
        </button>
      </div>
    </div>
  )
}
