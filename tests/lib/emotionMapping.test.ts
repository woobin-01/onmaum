import { describe, it, expect } from 'vitest'
import { softmax, map8ToEmotionResult } from '@/lib/emotionMapping'

// AffectNet 8 순서: [Anger, Contempt, Disgust, Fear, Happiness, Neutral, Sadness, Surprise]
describe('softmax', () => {
  it('합이 1, 단조 보존', () => {
    const s = softmax([0, 1, 2])
    const sum = s.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1)
    expect(s[2]).toBeGreaterThan(s[1])
    expect(s[1]).toBeGreaterThan(s[0])
  })
})

describe('map8ToEmotionResult', () => {
  const P = (overrides: Partial<Record<number, number>>) => {
    const a = [0, 0, 0, 0, 0, 0, 0, 0]
    for (const k of Object.keys(overrides)) a[Number(k)] = overrides[Number(k)]!
    return a
  }

  it('Happiness→happy', () => {
    expect(map8ToEmotionResult(P({ 4: 1 }))).toEqual({ happy: 1, calm: 0, sad: 0, angry: 0 })
  })
  it('Neutral→calm', () => {
    expect(map8ToEmotionResult(P({ 5: 1 }))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
  })
  it('Sadness+Fear→sad', () => {
    const r = map8ToEmotionResult(P({ 6: 0.6, 3: 0.4 }))
    expect(r.sad).toBeCloseTo(1)
  })
  it('Anger+Contempt+Disgust→angry', () => {
    const r = map8ToEmotionResult(P({ 0: 0.5, 1: 0.3, 2: 0.2 }))
    expect(r.angry).toBeCloseTo(1)
  })
  it('Surprise는 제외 후 재정규화', () => {
    const r = map8ToEmotionResult(P({ 4: 0.4, 7: 0.4, 6: 0.2 }))
    expect(r.happy).toBeCloseTo(0.4 / 0.6)
    expect(r.sad).toBeCloseTo(0.2 / 0.6)
    expect(r.calm).toBeCloseTo(0)
    expect(r.angry).toBeCloseTo(0)
  })
  it('전부 0(또는 Surprise만) → calm 폴백', () => {
    expect(map8ToEmotionResult(P({ 7: 1 }))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
    expect(map8ToEmotionResult(P({}))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
  })
})
