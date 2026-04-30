// components/EmotionDisplay.tsx
'use client'

import {
  EMOTION_LABELS,
  EMOTION_ORDER,
  getDominantEmotion,
  type Emotion,
  type EmotionResult,
} from '@/lib/emotionAnalysis'

const EMOTION_COLOR: Record<Emotion, string> = {
  happy: 'var(--accent)',
  calm: 'var(--fg)',
  sad: 'var(--caution)',
  angry: 'var(--warning)',
}

interface Props {
  emotion: EmotionResult | null
}

export default function EmotionDisplay({ emotion }: Props) {
  if (!emotion) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center text-[12px] font-light text-[var(--fg-muted)]">
        얼굴이 감지되지 않습니다
      </div>
    )
  }

  const dominant = getDominantEmotion(emotion)
  const dominantPercent = Math.round(emotion[dominant] * 100)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
      <div className="text-center">
        <p className="text-[11px] font-light uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          현재 감정
        </p>
        <p
          className="mt-2 text-4xl font-thin tracking-[-0.02em]"
          style={{ color: EMOTION_COLOR[dominant] }}
        >
          {EMOTION_LABELS[dominant]}
        </p>
        <p className="mt-1 text-[12px] font-light text-[var(--fg-muted)] tabular-nums">
          {dominantPercent}%
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {EMOTION_ORDER.map((key) => {
          const percent = Math.round(emotion[key] * 100)
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-[11px] font-light text-[var(--fg-muted)]">
                <span>{EMOTION_LABELS[key]}</span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-tint)]">
                <div
                  className="h-full transition-[width] duration-300"
                  style={{
                    width: `${percent}%`,
                    background: EMOTION_COLOR[key],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
