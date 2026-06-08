import type { EmotionResult } from './emotionAnalysis'
import { ANGRY_WEIGHT } from './riskCalculator'

export function frameContribution(e: EmotionResult): { pos: number; neg: number } {
  return { pos: e.happy, neg: e.sad + e.angry * ANGRY_WEIGHT }
}
