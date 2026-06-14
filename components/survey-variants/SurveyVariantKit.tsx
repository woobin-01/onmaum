'use client'

import { useState } from 'react'

interface Option {
  emoji: string
  label: string
}

const SECTIONS: { title: string; emoji: string; options: Option[] }[] = [
  {
    title: '마실 거',
    emoji: '☕',
    options: [
      { emoji: '☕', label: '커피 한 잔' },
      { emoji: '🍵', label: '따뜻한 차' },
      { emoji: '💧', label: '시원한 물' },
    ],
  },
  {
    title: '1분 활동',
    emoji: '🚶',
    options: [
      { emoji: '🚶', label: '짧은 산책' },
      { emoji: '🪟', label: '창밖 보기' },
      { emoji: '🙆', label: '어깨 스트레칭' },
    ],
  },
  {
    title: '마음 돌보기',
    emoji: '🌿',
    options: [
      { emoji: '🫁', label: '박스 호흡' },
      { emoji: '🧘', label: '3분 명상' },
      { emoji: '🖼️', label: '좋아하는 사진 보기' },
    ],
  },
]

export interface SurveyVariantKitProps {
  onDone?: () => void
}

export default function SurveyVariantKit({ onDone }: SurveyVariantKitProps) {
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
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-ink-900 leading-snug">
          힘들 때, 뭐가 위로가 되나요?
        </h2>
        <p className="text-xs text-ink-500 leading-relaxed">
          내 회복 키트를 채워볼게요 🧺
          <br />
          내 기기에만 저장돼요
        </p>
      </header>

      {/* 섹션 */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="text-sm font-medium text-ink-700">
              {section.emoji} {section.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {section.options.map((opt) => {
                const active = selected.has(opt.label)
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(opt.label)}
                    className={[
                      'flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm transition-all',
                      active
                        ? 'border-risk-good bg-risk-good/10 text-ink-900 font-medium'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
                    ].join(' ')}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CTA 버튼 */}
      <button
        type="button"
        onClick={() => {}}
        className="w-full rounded-2xl bg-risk-good py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {count > 0 ? `${count}개로 시작하기` : '건너뛰고 시작하기'}
      </button>
    </div>
  )
}
