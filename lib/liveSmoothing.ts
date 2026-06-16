import type { EmotionResult } from './emotionAnalysis'
import { emaStress, EMA_ALPHA } from './stressIndex'

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** 약 1.5초(2Hz 샘플 기준). 늘리면 더 차분, 줄이면 더 민감. */
export const LIVE_MEDIAN_WINDOW = 3

/**
 * 오브용 실시간 스무더.
 *   1) 채널별 최근 N프레임 중앙값 → 단발 스파이크 제거
 *   2) EMA(emaStress 재사용) → 추세를 부드럽게
 *   3) 합이 1이 되도록 재정규화
 * 측정 정지/얼굴 미검출 시 reset()으로 초기화한다.
 */
export class LiveEmotionSmoother {
  private bufHappy: number[] = []
  private bufCalm: number[] = []
  private bufSad: number[] = []
  private bufAngry: number[] = []
  private prev: EmotionResult | null = null

  constructor(
    private window: number = LIVE_MEDIAN_WINDOW,
    private alpha: number = EMA_ALPHA,
  ) {}

  push(e: EmotionResult): EmotionResult {
    const med: EmotionResult = {
      happy: this.med(this.bufHappy, e.happy),
      calm: this.med(this.bufCalm, e.calm),
      sad: this.med(this.bufSad, e.sad),
      angry: this.med(this.bufAngry, e.angry),
    }
    const next: EmotionResult =
      this.prev === null
        ? med
        : {
            happy: emaStress(this.prev.happy, med.happy, this.alpha),
            calm: emaStress(this.prev.calm, med.calm, this.alpha),
            sad: emaStress(this.prev.sad, med.sad, this.alpha),
            angry: emaStress(this.prev.angry, med.angry, this.alpha),
          }
    const sum = next.happy + next.calm + next.sad + next.angry
    const norm: EmotionResult =
      sum > 0
        ? { happy: next.happy / sum, calm: next.calm / sum, sad: next.sad / sum, angry: next.angry / sum }
        : next
    this.prev = norm
    return norm
  }

  reset(): void {
    this.bufHappy = []
    this.bufCalm = []
    this.bufSad = []
    this.bufAngry = []
    this.prev = null
  }

  private med(buf: number[], v: number): number {
    buf.push(v)
    if (buf.length > this.window) buf.shift()
    return median(buf)
  }
}
