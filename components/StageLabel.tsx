'use client'

import './StageLabel.css'

interface Props {
  visible: boolean
  message: string | null
  className?: string
}

export default function StageLabel({ visible, message, className }: Props) {
  if (!message) return null
  const cls = ['stage-label', className].filter(Boolean).join(' ')
  return (
    <span
      role="status"
      aria-live="polite"
      data-visible={visible ? 'true' : 'false'}
      className={cls}
    >
      {message}
    </span>
  )
}
