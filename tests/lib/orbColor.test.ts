import { describe, it, expect } from 'vitest'
import {
  EMOTION_HUES,
  rgbString,
  topTwoEmotions,
  gradientColors,
  accumulatedColor,
} from '@/lib/orbColor'

describe('orbColor 기본', () => {
  it('감정 기준색 (spec §5)', () => {
    expect(EMOTION_HUES.happy).toEqual([242, 201, 76])
    expect(EMOTION_HUES.calm).toEqual([107, 171, 154])
    expect(EMOTION_HUES.sad).toEqual([123, 163, 196])
    expect(EMOTION_HUES.angry).toEqual([232, 128, 106])
  })
  it('rgbString', () => {
    expect(rgbString([1, 2, 3])).toBe('rgb(1,2,3)')
  })
  it('상위 2개 감정 (지배·차순)', () => {
    expect(topTwoEmotions({ happy: 0.6, calm: 0.1, sad: 0.1, angry: 0.2 })).toEqual(['happy', 'angry'])
    expect(topTwoEmotions({ happy: 0.1, calm: 0.1, sad: 0.5, angry: 0.3 })).toEqual(['sad', 'angry'])
  })
})

describe('orbColor 혼합', () => {
  it('상위2 그라데이션 (from=지배, to=차순)', () => {
    const g = gradientColors({ happy: 0.6, calm: 0.1, sad: 0.1, angry: 0.2 })
    expect(g.from).toBe('rgb(242,201,76)') // happy
    expect(g.to).toBe('rgb(232,128,106)') // angry
  })
  it('누적 "내 색" — 단일 감정', () => {
    expect(accumulatedColor({ happy: 1, calm: 0, sad: 0, angry: 0 })).toBe('rgb(242,201,76)')
  })
  it('누적 "내 색" — 가중 블렌드', () => {
    expect(accumulatedColor({ happy: 0.5, calm: 0.5, sad: 0, angry: 0 })).toBe('rgb(175,186,115)')
  })
  it('누적 "내 색" — 전부 0이면 평온색 폴백', () => {
    expect(accumulatedColor({ happy: 0, calm: 0, sad: 0, angry: 0 })).toBe('rgb(107,171,154)')
  })
})
