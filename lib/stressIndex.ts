import type { EmotionResult } from './emotionAnalysis'
import { ANGRY_WEIGHT } from './riskCalculator'

export function frameContribution(e: EmotionResult): { pos: number; neg: number } {
  return { pos: e.happy, neg: e.sad + e.angry * ANGRY_WEIGHT }
}

export interface StressScores {
  positive: number // 0~100
  stress: number // 0~100
}

interface StressInput {
  happy: number
  sad: number
  angry: number
  duration: number
}

export function aggregateStress(records: StressInput[]): StressScores | null {
  const total = records.reduce((sum, r) => sum + r.duration, 0)
  if (records.length === 0 || total <= 0) return null

  let weightedPos = 0
  let weightedNeg = 0
  for (const r of records) {
    weightedPos += r.happy * r.duration
    weightedNeg += (r.sad + r.angry * ANGRY_WEIGHT) * r.duration
  }
  return {
    positive: (100 * weightedPos) / total,
    stress: (100 * weightedNeg) / total,
  }
}

export function mindBalance(s: StressScores): number {
  return s.positive - s.stress
}

export function affectEnergy(s: StressScores): number {
  return s.positive + s.stress
}
