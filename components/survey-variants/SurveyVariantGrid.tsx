'use client'

import { useState } from 'react'

interface Option {
  emoji: string
  label: string
}

const OPTIONS: Option[] = [
  { emoji: '☕', label: '커피 한 잔' },
  { emoji: '🍵', label: '따뜻한 차' },
  { emoji: '💧', label: '시원한 물' },
  { emoji: '🚶', label: '짧은 산책' },
  { emoji: '🪟', label: '창밖 보기' },
  { emoji: '🙆', label: '어깨 스트레칭' },
  { emoji: '🫁', label: '박스 호흡' },
  { emoji: '🧘', label: '3분 명상' },
  { emoji: '🖼️', label: '좋아하는 사진 보기' },
]

export interface SurveyVariantGridProps {
  onDone?: () => void
}

export default function SurveyVariantGrid({ onDone }: SurveyVariantGridProps) {
  void onDone
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const count = selected.size

  return (
    <div className="p-6 space-y-5">
      {/* 헤더 */}
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-ink-900">마음에 드는 걸 골라요</h2>
        <p className="text-xs text-ink-500">고를수록 더 잘 맞춰드려요</p>
      </header>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-2.5">
        {OPTIONS.map((opt) => {
          const active = selected.has(opt.label)
          return (
            <button
              key={opt.label}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt.label)}
              className={[
                'relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all',
                'aspect-square gap-1.5',
                active
                  ? 'border-risk-good bg-risk-good/10 ring-2 ring-risk-good scale-[1.04]'
                  : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
              ].join(' ')}
            >
              {/* 체크 배지 */}
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-risk-good text-[9px] font-bold text-white leading-none">
                  ✓
                </span>
              )}
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-center text-[10px] leading-tight text-ink-700 font-medium">
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* CTA 버튼 */}
      <button
        type="button"
        onClick={() => {}}
        className="w-full rounded-2xl bg-risk-good py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {count > 0 ? `이걸로 시작 (${count})` : '건너뛰고 시작하기'}
      </button>
    </div>
  )
}
