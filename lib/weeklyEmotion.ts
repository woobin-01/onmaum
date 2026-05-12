import type { EmotionRecord } from './db'
import type { EmotionResult } from './emotionAnalysis'
import { ANGRY_WEIGHT } from './riskCalculator'

export interface WeeklyEmotionAggregate {
  emotions: EmotionResult
  recordCount: number
  daysOutOfSeven: number
  negativeRatio: number
  flatAffectAvg: number
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function aggregateWeeklyEmotion(
  records: EmotionRecord[],
  endDate: Date,
): WeeklyEmotionAggregate | null {
  const startTs = endDate.getTime() - SEVEN_DAYS_MS
  const endTs = endDate.getTime()

  const validRecords = records.filter((record) => {
    const timestamp = record.timestamp.getTime()
    return timestamp >= startTs && timestamp <= endTs && record.duration > 0
  })

  if (validRecords.length === 0) return null

  const totalDuration = validRecords.reduce(
    (sum, record) => sum + record.duration,
    0,
  )
  if (totalDuration <= 0) return null

  let happy = 0
  let calm = 0
  let sad = 0
  let angry = 0
  let weightedNegative = 0
  let weightedFlat = 0
  const utcDates = new Set<string>()

  for (const record of validRecords) {
    happy += record.happy * record.duration
    calm += record.calm * record.duration
    sad += record.sad * record.duration
    angry += record.angry * record.duration
    weightedNegative +=
      (record.sad + record.angry * ANGRY_WEIGHT) * record.duration
    weightedFlat += record.flatAffectScore * record.duration
    utcDates.add(record.timestamp.toISOString().slice(0, 10))
  }

  return {
    emotions: {
      happy: happy / totalDuration,
      calm: calm / totalDuration,
      sad: sad / totalDuration,
      angry: angry / totalDuration,
    },
    recordCount: validRecords.length,
    daysOutOfSeven: Math.min(utcDates.size, 7),
    negativeRatio: weightedNegative / totalDuration,
    flatAffectAvg: weightedFlat / totalDuration,
  }
}
