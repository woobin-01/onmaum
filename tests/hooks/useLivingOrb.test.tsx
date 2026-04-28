import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLivingOrb } from '@/hooks/useLivingOrb'
import { db } from '@/lib/db'
import type { EmotionRecord } from '@/lib/db'

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

  it('마지막 record 가 2주 이상 지났으면 inactive2w + opacity × 0.5', async () => {
    const longAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await db.emotions.add(
      rec({ timestamp: longAgo, duration: 60000 }) as EmotionRecord,
    )
    const { result } = renderHook(() => useLivingOrb())
    await waitFor(() => {
      expect(result.current.fallback).toBe('inactive2w')
      // 1 record → opacity ≈ 0.32, × 0.5 ≈ 0.16
      expect(result.current.axes.opacity).toBeLessThan(0.2)
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
})
