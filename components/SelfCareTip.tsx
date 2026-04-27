'use client'

import { useState } from 'react'
import { selectRandomTip, type SelfCareTip as Tip } from '@/lib/selfCareTips'

export default function SelfCareTip() {
  const [tip, setTip] = useState<Tip>(() => selectRandomTip())

  const handleNext = () => {
    setTip((current) => selectRandomTip(current))
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{tip.icon}</span>
        <span>{tip.text}</span>
      </div>
      <button
        type="button"
        onClick={handleNext}
        aria-label="다른 팁 보기"
        className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      >
        🔄
      </button>
    </div>
  )
}
