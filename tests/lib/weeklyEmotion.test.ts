import { describe, expect, it } from 'vitest'
import { aggregateWeeklyEmotion } from '@/lib/weeklyEmotion'
import type { EmotionRecord } from '@/lib/db'

const END_DATE = new Date('2026-04-28T12:00:00.000Z')

function rec(overrides: Partial<EmotionRecord> = {}): EmotionRecord {
  return {
    id: 1,
    timestamp: new Date('2026-04-28T12:00:00.000Z'),
    duration: 60,
    detectionRate: 1,
    happy: 0,
    calm: 0,
    sad: 0,
    angry: 0,
    dominantEmotion: 'calm',
    flatAffectScore: 0,
    ...overrides,
  }
}

describe('aggregateWeeklyEmotion', () => {
  it('empty records -> null', () => {
    expect(aggregateWeeklyEmotion([], END_DATE)).toBeNull()
  })

  it('only records older than 7 days -> null', () => {
    const records = [
      rec({ timestamp: new Date('2026-04-21T11:59:59.999Z'), duration: 60 }),
    ]

    expect(aggregateWeeklyEmotion(records, END_DATE)).toBeNull()
  })

  it('single record duration weighted average', () => {
    const result = aggregateWeeklyEmotion(
      [rec({ happy: 0.7, calm: 0.2, sad: 0.1, angry: 0, duration: 30 })],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.emotions.happy).toBeCloseTo(0.7)
    expect(result!.emotions.calm).toBeCloseTo(0.2)
    expect(result!.recordCount).toBe(1)
    expect(result!.daysOutOfSeven).toBe(1)
  })

  it('duration weighting: 10s happy-only + 90s calm-only -> happy 0.1, calm 0.9', () => {
    const result = aggregateWeeklyEmotion(
      [
        rec({ happy: 1, calm: 0, duration: 10 }),
        rec({ happy: 0, calm: 1, duration: 90 }),
      ],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.emotions.happy).toBeCloseTo(0.1)
    expect(result!.emotions.calm).toBeCloseTo(0.9)
  })

  it('daysOutOfSeven: two records same UTC date plus one previous date -> 2', () => {
    const result = aggregateWeeklyEmotion(
      [
        rec({ timestamp: new Date('2026-04-28T00:10:00.000Z') }),
        rec({ timestamp: new Date('2026-04-28T23:10:00.000Z') }),
        rec({ timestamp: new Date('2026-04-27T23:10:00.000Z') }),
      ],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.daysOutOfSeven).toBe(2)
  })

  it('daysOutOfSeven max 7 using 7 records on 7 dates -> 7', () => {
    const result = aggregateWeeklyEmotion(
      [
        rec({ timestamp: new Date('2026-04-22T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-23T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-24T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-25T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-26T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-27T12:00:00.000Z') }),
        rec({ timestamp: new Date('2026-04-28T12:00:00.000Z') }),
      ],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.daysOutOfSeven).toBe(7)
  })

  it('negativeRatio = sad + angry * 1.5 and flatAffectAvg as weighted avg', () => {
    const result = aggregateWeeklyEmotion(
      [
        rec({ duration: 25, sad: 0.4, angry: 0.2, flatAffectScore: 0.2 }),
        rec({ duration: 75, sad: 0.2, angry: 0.4, flatAffectScore: 0.6 }),
      ],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.negativeRatio).toBeCloseTo(0.775)
    expect(result!.flatAffectAvg).toBeCloseTo(0.5)
  })

  it('duration 0 record ignored and if only such records -> null', () => {
    expect(
      aggregateWeeklyEmotion([rec({ duration: 0, happy: 1 })], END_DATE),
    ).toBeNull()

    const result = aggregateWeeklyEmotion(
      [
        rec({ duration: 0, happy: 1 }),
        rec({ duration: 50, calm: 1 }),
      ],
      END_DATE,
    )

    expect(result).not.toBeNull()
    expect(result!.recordCount).toBe(1)
    expect(result!.emotions.happy).toBeCloseTo(0)
    expect(result!.emotions.calm).toBeCloseTo(1)
  })
})
