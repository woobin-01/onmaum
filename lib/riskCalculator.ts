import type { EmotionRecord } from './db'

export type RiskLevel = 'good' | 'caution' | 'warning'

export interface DailyRisk {
  date: string // YYYY-MM-DD (사용자 로컬 자정 기준)
  riskLevel: RiskLevel
  negativeRatio: number // 0~1+ (angry 1.5x 가중치 때문에 1 초과 가능)
  flatAffectAvg: number // 0~1
  recordCount: number // 집계에 포함된 record 개수 (노이즈 필터 후)
}

/**
 * 화남 인식률 보정 가중치.
 * face-api의 angry는 인식률이 약해서 1.5x로 증폭. (memory: project_step4_anger_compensation)
 */
export const ANGRY_WEIGHT = 1.5

/**
 * 너무 짧은 record는 노이즈로 간주하여 집계에서 제외.
 * (예: 사용자가 측정 시작 후 3초 만에 정지)
 */
export const MIN_RECORD_DURATION_MS = 10000

const NEGATIVE_GOOD_THRESHOLD = 0.3
const NEGATIVE_WARNING_THRESHOLD = 0.5
const FLAT_GOOD_THRESHOLD = 0.85
const FLAT_WARNING_THRESHOLD = 0.95

export function calculateRiskLevel(
  negativeRatio: number,
  flatAffectAvg: number,
): RiskLevel {
  if (
    negativeRatio >= NEGATIVE_WARNING_THRESHOLD ||
    flatAffectAvg >= FLAT_WARNING_THRESHOLD
  ) {
    return 'warning'
  }
  if (
    negativeRatio < NEGATIVE_GOOD_THRESHOLD &&
    flatAffectAvg < FLAT_GOOD_THRESHOLD
  ) {
    return 'good'
  }
  return 'caution'
}

export function aggregateDailyRisk(
  records: EmotionRecord[],
  date: string,
): DailyRisk | null {
  const validRecords = records.filter((r) => r.duration >= MIN_RECORD_DURATION_MS)
  if (validRecords.length === 0) return null

  const totalDuration = validRecords.reduce((sum, r) => sum + r.duration, 0)
  if (totalDuration === 0) return null

  let weightedNegative = 0
  let weightedFlat = 0
  for (const r of validRecords) {
    const negative = r.sad + r.angry * ANGRY_WEIGHT
    weightedNegative += negative * r.duration
    weightedFlat += r.flatAffectScore * r.duration
  }

  const negativeRatio = weightedNegative / totalDuration
  const flatAffectAvg = weightedFlat / totalDuration
  const riskLevel = calculateRiskLevel(negativeRatio, flatAffectAvg)

  return {
    date,
    riskLevel,
    negativeRatio,
    flatAffectAvg,
    recordCount: validRecords.length,
  }
}
