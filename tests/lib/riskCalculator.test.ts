import { describe, it, expect } from 'vitest'
import {
  aggregateDailyRisk,
  calculateRiskLevel,
  ANGRY_WEIGHT,
  MIN_RECORD_DURATION_MS,
} from '@/lib/riskCalculator'
import type { EmotionRecord } from '@/lib/db'

function makeRecord(
  overrides: Partial<Omit<EmotionRecord, 'id'>> = {},
  id = 1,
): EmotionRecord {
  return {
    id,
    timestamp: new Date('2026-04-26T12:00:00+09:00'),
    duration: 60000,
    detectionRate: 1,
    happy: 0.5,
    calm: 0.3,
    sad: 0.1,
    angry: 0.1,
    dominantEmotion: 'happy',
    flatAffectScore: 0.5,
    ...overrides,
  }
}

describe('aggregateDailyRisk', () => {
  it('빈 배열 → null', () => {
    expect(aggregateDailyRisk([], '2026-04-26')).toBeNull()
  })

  it('모든 record가 duration < 임계값 → null (노이즈 필터)', () => {
    const records = [
      makeRecord({ duration: MIN_RECORD_DURATION_MS - 1 }, 1),
      makeRecord({ duration: 1000 }, 2),
    ]
    expect(aggregateDailyRisk(records, '2026-04-26')).toBeNull()
  })

  it('duration < 임계값 record는 평균 계산에서 제외', () => {
    const validRecord = makeRecord(
      {
        duration: 60000,
        sad: 0,
        angry: 0,
        happy: 1,
        calm: 0,
        flatAffectScore: 0,
      },
      1,
    )
    const noiseRecord = makeRecord(
      {
        duration: 1000, // 임계값 미만 → 무시
        sad: 1,
        angry: 1,
        happy: 0,
        calm: 0,
        flatAffectScore: 1,
      },
      2,
    )
    const result = aggregateDailyRisk([validRecord, noiseRecord], '2026-04-26')
    expect(result).not.toBeNull()
    expect(result!.negativeRatio).toBeCloseTo(0)
    expect(result!.flatAffectAvg).toBeCloseTo(0)
  })

  it('평온/기쁨만 가득한 하루 → riskLevel=good', () => {
    const records = [
      makeRecord({ happy: 0.7, calm: 0.3, sad: 0, angry: 0, flatAffectScore: 0.5 }, 1),
      makeRecord({ happy: 0.6, calm: 0.4, sad: 0, angry: 0, flatAffectScore: 0.4 }, 2),
    ]
    const result = aggregateDailyRisk(records, '2026-04-26')
    expect(result!.riskLevel).toBe('good')
  })

  it('화남 비율 높은 하루 → riskLevel=warning (1.5x 가중치 적용)', () => {
    // 화남 0.4 × 1.5 = 0.6, slappi sum이 0.6 → negativeRatio > 0.5
    const records = [
      makeRecord({ happy: 0.3, calm: 0.3, sad: 0, angry: 0.4, flatAffectScore: 0.5 }, 1),
      makeRecord({ happy: 0.3, calm: 0.3, sad: 0, angry: 0.4, flatAffectScore: 0.5 }, 2),
    ]
    const result = aggregateDailyRisk(records, '2026-04-26')
    expect(result!.riskLevel).toBe('warning')
    // negativeRatio = sad + angry × 1.5 = 0 + 0.4 × 1.5 = 0.6
    expect(result!.negativeRatio).toBeCloseTo(0.6)
  })

  it('flatAffectAvg 매우 높음 (평탄 정서) → riskLevel=warning', () => {
    const records = [
      makeRecord({ happy: 0.1, calm: 0.9, sad: 0, angry: 0, flatAffectScore: 1.0 }, 1),
      makeRecord({ happy: 0.1, calm: 0.9, sad: 0, angry: 0, flatAffectScore: 1.0 }, 2),
    ]
    const result = aggregateDailyRisk(records, '2026-04-26')
    expect(result!.flatAffectAvg).toBeCloseTo(1.0)
    expect(result!.riskLevel).toBe('warning')
  })

  it('중간 negative + 중간 flat → riskLevel=caution', () => {
    const records = [
      makeRecord({ happy: 0.5, calm: 0.2, sad: 0.15, angry: 0.15, flatAffectScore: 0.9 }, 1),
    ]
    const result = aggregateDailyRisk(records, '2026-04-26')
    // negativeRatio = 0.15 + 0.15 × 1.5 = 0.375 (< 0.5 warning 임계)
    // flatAffectAvg = 0.9 (< 0.95 warning 임계)
    // 둘 중 하나라도 good 임계 초과 (negative 0.375 >= 0.3 또는 flat 0.9 >= 0.85) → caution
    expect(result!.riskLevel).toBe('caution')
    expect(result!.negativeRatio).toBeCloseTo(0.375)
  })

  it('duration 가중 평균 — 긴 record가 더 큰 영향', () => {
    const longSadRecord = makeRecord(
      { duration: 60000, happy: 0, calm: 0, sad: 1, angry: 0, flatAffectScore: 0.5 },
      1,
    )
    const shortHappyRecord = makeRecord(
      { duration: 15000, happy: 1, calm: 0, sad: 0, angry: 0, flatAffectScore: 0.5 },
      2,
    )
    const result = aggregateDailyRisk([longSadRecord, shortHappyRecord], '2026-04-26')
    // sad 가중 평균: (1 × 60000 + 0 × 15000) / 75000 = 0.8
    expect(result!.negativeRatio).toBeCloseTo(0.8)
  })

  it('date 필드가 입력 문자열 그대로 반영', () => {
    const records = [makeRecord({}, 1)]
    const result = aggregateDailyRisk(records, '2026-04-26')
    expect(result!.date).toBe('2026-04-26')
  })

  it('ANGRY_WEIGHT = 1.5 (메모리 약속, 화남 인식률 보정)', () => {
    expect(ANGRY_WEIGHT).toBe(1.5)
  })

  it('MIN_RECORD_DURATION_MS = 10000 (10초 미만 노이즈 필터)', () => {
    expect(MIN_RECORD_DURATION_MS).toBe(10000)
  })
})

describe('calculateRiskLevel', () => {
  it('negativeRatio < 0.3 AND flatAffectAvg < 0.85 → good', () => {
    expect(calculateRiskLevel(0.1, 0.5)).toBe('good')
    expect(calculateRiskLevel(0.29, 0.84)).toBe('good')
  })

  it('negativeRatio >= 0.5 → warning', () => {
    expect(calculateRiskLevel(0.5, 0.5)).toBe('warning')
    expect(calculateRiskLevel(0.7, 0.3)).toBe('warning')
  })

  it('flatAffectAvg >= 0.95 → warning', () => {
    expect(calculateRiskLevel(0.1, 0.95)).toBe('warning')
    expect(calculateRiskLevel(0.1, 1.0)).toBe('warning')
  })

  it('중간 영역 → caution', () => {
    expect(calculateRiskLevel(0.35, 0.7)).toBe('caution')
    expect(calculateRiskLevel(0.1, 0.9)).toBe('caution')
  })
})
