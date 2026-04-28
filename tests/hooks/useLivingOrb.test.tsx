import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLivingOrb } from '@/hooks/useLivingOrb'
import { db } from '@/lib/db'
import type { EmotionRecord } from '@/lib/db'
import { opacityFromCount } from '@/lib/orbAxes'

function rec(partial: Partial<EmotionRecord> & { timestamp: Date; duration: number }): Omit<EmotionRecord, 'id'> {
  return {
    timestamp: partial.timestamp,
    duration: partial.duration,
    detectionRate: partial.detectionRate ?? 1,
    happy: partial.happy ?? 0,
    calm: partial.calm ?? 1,
    sad: partial.sad ?? 0,
    angry: partial.angry ?? 0,
    dominantEmotion: partial.dominantEmotion ?? 'calm',
    flatAffectScore: partial.flatAffectScore ?? 0.5,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('useLivingOrb', () => {
  it('records 비어있으면 idle fallback + Empty', async () => {
    const { result } = renderHook(() => useLivingOrb())
    await waitFor(() => {
      expect(result.current.fallback).toBe('idle')
      expect(result.current.stage).toBe('empty')
    })
  })

  it('record 5개 → forming 단계 + opacity > 0.5', async () => {
    const now = Date.now()
    for (let i = 0; i < 5; i++) {
      await db.emotions.add(
        rec({
          timestamp: new Date(now - i * 24 * 60 * 60 * 1000),
          duration: 60000,
        }) as EmotionRecord,
      )
    }
    const { result } = renderHook(() => useLivingOrb())
    await waitFor(() => {
      expect(result.current.stage).toBe('forming')
      expect(result.current.axes.opacity).toBeGreaterThan(0.5)
      expect(result.current.fallback).toBeNull()
    })
  })

  it('마지막 record 가 2주 이상 지났으면 inactive2w + opacity 가 정확히 baseline × 0.5', async () => {
    // opacityFromCount 재보정에 흔들리지 않도록 baseline 비율로 검증.
    // 고정 과거 시각 사용해 Date.now() 의존 제거.
    const longAgo = new Date('2020-01-01T00:00:00Z')
    await db.emotions.add(
      rec({ timestamp: longAgo, duration: 60000 }) as EmotionRecord,
    )
    const { result } = renderHook(() => useLivingOrb())
    await waitFor(() => {
      expect(result.current.fallback).toBe('inactive2w')
      expect(result.current.axes.opacity).toBeCloseTo(opacityFromCount(1) * 0.5, 5)
    })
  })

  it('active=true + liveEmotion 있으면 hue 가 live emotion 반영', async () => {
    const now = Date.now()
    await db.emotions.add(
      rec({
        timestamp: new Date(now - 24 * 60 * 60 * 1000),
        duration: 60000,
        calm: 1,
      }) as EmotionRecord,
    )
    const { result } = renderHook(() =>
      useLivingOrb({
        active: true,
        liveEmotion: { happy: 1, calm: 0, sad: 0, angry: 0 },
      }),
    )
    await waitFor(() => {
      expect(result.current.axes.hue).toBe('rgb(242,201,76)')
    })
  })

  it('active=false 면 liveEmotion 무시하고 weekly 기반 hue 사용', async () => {
    const now = Date.now()
    await db.emotions.add(
      rec({
        timestamp: new Date(now - 24 * 60 * 60 * 1000),
        duration: 60000,
        calm: 1,
      }) as EmotionRecord,
    )
    const { result } = renderHook(() =>
      useLivingOrb({
        active: false,
        liveEmotion: { happy: 1, calm: 0, sad: 0, angry: 0 },
      }),
    )
    await waitFor(() => {
      // happy live emotion 이 무시돼야 하므로 happy hue 가 나오면 안 됨.
      expect(result.current.axes.hue).not.toBe('rgb(242,201,76)')
    })
  })
})
