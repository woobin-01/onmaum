'use client'

import type { OrbStage } from '@/lib/orbStages'

interface Props {
  stage: OrbStage
  opacity: number
  hue: string
  saturation: number
  motion: number
  size?: number
  className?: string
}

const STAGE_BLUR_PX: Record<OrbStage, number> = {
  empty: 0,
  awakening: 1.6,
  forming: 1.0,
  settled: 0.4,
  living: 0,
}

let idCounter = 0

export default function LivingOrb({
  stage,
  opacity,
  hue,
  saturation,
  motion,
  size = 56,
  className,
}: Props) {
  const uid = `lo-${++idCounter}`
  const filterId = `${uid}-blur`
  const gradientId = `${uid}-grad`

  // motion 0.3~1 → breathe duration 5.2s ~ 2.5s
  const breathDuration = (5.2 - 2.7 * Math.max(0, Math.min(1, motion))).toFixed(2)
  const innerOpacity = 0.6 + 0.4 * Math.max(0, Math.min(1, saturation))
  const ringOpacity = 0.15 + 0.45 * Math.max(0, Math.min(1, saturation))
  const blurPx = STAGE_BLUR_PX[stage]

  const animation =
    stage === 'empty'
      ? 'none'
      : `orbBreathe ${breathDuration}s ease-in-out infinite`

  return (
    <svg
      role="img"
      data-orb={stage}
      aria-label={`Living Orb ${stage}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity, animation }}
    >
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity={innerOpacity} />
          <stop offset="45%" stopColor={hue} stopOpacity={innerOpacity * 0.7} />
          <stop offset="90%" stopColor={hue} stopOpacity={ringOpacity} />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </radialGradient>
        {blurPx > 0 && (
          <filter id={filterId}>
            <feGaussianBlur stdDeviation={blurPx} />
          </filter>
        )}
      </defs>
      {stage === 'empty' ? (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={hue}
          strokeWidth="0.6"
          strokeOpacity="0.5"
        />
      ) : (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill={`url(#${gradientId})`}
          filter={blurPx > 0 ? `url(#${filterId})` : undefined}
        />
      )}
    </svg>
  )
}
