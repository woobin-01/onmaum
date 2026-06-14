'use client'

import { useState } from 'react'

interface Option {
  emoji: string
  label: string
}

const STEPS: { question: string; options: Option[] }[] = [
  {
    question: '지친 날, 뭘 마시면\n좀 나아져요?',
    options: [
      { emoji: '☕', label: '커피 한 잔' },
      { emoji: '🍵', label: '따뜻한 차' },
      { emoji: '💧', label: '시원한 물' },
    ],
  },
  {
    question: '1분이 생긴다면\n뭘 하고 싶어요?',
    options: [
      { emoji: '🚶', label: '짧은 산책' },
      { emoji: '🪟', label: '창밖 보기' },
      { emoji: '🙆', label: '어깨 스트레칭' },
    ],
  },
  {
    question: '마음이 시끄러울 땐\n어떻게 하면 좀 가라앉아요?',
    options: [
      { emoji: '🫁', label: '박스 호흡' },
      { emoji: '🧘', label: '3분 명상' },
      { emoji: '🖼️', label: '좋아하는 사진 보기' },
    ],
  },
]

export interface SurveyVariantWizardProps {
  onDone?: () => void
}

export default function SurveyVariantWizard({ onDone }: SurveyVariantWizardProps) {
  void onDone
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Set<string>[]>([
    new Set(),
    new Set(),
    new Set(),
  ])

  const currentStep = STEPS[step]
  const currentSelected = selections[step]
  const isLast = step === STEPS.length - 1

  const toggle = (label: string) => {
    setSelections((prev) => {
      const next = prev.map((s, i) => {
        if (i !== step) return s
        const copy = new Set(s)
        if (copy.has(label)) {
          copy.delete(label)
        } else {
          copy.add(label)
        }
        return copy
      })
      return next
    })
  }

  const handleNext = () => {
    if (isLast) {
      // 완료
    } else {
      setStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    setStep((s) => s - 1)
  }

  return (
    <div className="flex flex-col p-6 space-y-6 min-h-[420px]">
      {/* 진행 점 */}
      <div className="flex justify-center gap-2 pt-1">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={[
              'block h-2 rounded-full transition-all',
              i === step
                ? 'w-6 bg-risk-good'
                : i < step
                  ? 'w-2 bg-risk-good/40'
                  : 'w-2 bg-ink-200',
            ].join(' ')}
          />
        ))}
      </div>

      {/* 질문 */}
      <div className="flex-1 space-y-5">
        <h2 className="text-base font-semibold text-ink-900 leading-snug whitespace-pre-line">
          {currentStep.question}
        </h2>

        {/* 옵션 버튼 */}
        <div className="space-y-2.5">
          {currentStep.options.map((opt) => {
            const active = currentSelected.has(opt.label)
            return (
              <button
                key={opt.label}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(opt.label)}
                className={[
                  'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-all',
                  active
                    ? 'border-risk-good bg-risk-good/10 text-ink-900 font-medium'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
                ].join(' ')}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span>{opt.label}</span>
                {active && (
                  <span className="ml-auto text-risk-good text-base">✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="flex-none rounded-2xl border border-ink-200 px-4 py-3 text-sm text-ink-600 hover:bg-ink-50 transition-colors"
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 rounded-2xl bg-risk-good py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
