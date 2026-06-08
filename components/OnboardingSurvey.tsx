'use client'

import { useState } from 'react'
import { saveProfile } from '@/lib/profile'

const OPTIONS = [
  '커피 한 잔',
  '따뜻한 차',
  '짧은 산책',
  '창밖 보기',
  '박스 호흡',
  '3분 명상',
  '좋아하는 사진 보기',
  '어깨 스트레칭',
]

interface Props {
  onDone?: () => void
}

/** "나만의 스트레스 해소법" 설문 — 선호를 골라 로컬 프로필에 저장. (spec §7) */
export default function OnboardingSurvey({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (option: string) =>
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    )

  const save = () => {
    saveProfile({ reliefs: selected })
    onDone?.()
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">나만의 스트레스 해소법</h1>
          <p className="mt-2 text-sm text-ink-500">
            힘들 때 도움이 되는 걸 골라주세요. 나중에 살며시 제안해드릴게요. (내 기기에만 저장돼요)
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((option) => {
            const on = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                aria-pressed={on}
                className={
                  on
                    ? 'rounded-full bg-risk-good px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-full border border-ink-300 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100'
                }
              >
                {option}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-full bg-risk-good px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          {selected.length > 0 ? `${selected.length}개 선택하고 시작하기` : '건너뛰고 시작하기'}
        </button>
      </section>
    </main>
  )
}
