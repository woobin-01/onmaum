import type { EmotionResult } from './emotionAnalysis'

/** 수치 안정 softmax. */
export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - m))
  const sum = exps.reduce((a, b) => a + b, 0)
  return sum > 0 ? exps.map((e) => e / sum) : xs.map(() => 0)
}

/**
 * HSEmotion AffectNet 8클래스 확률 → 앱의 4감정.
 * 순서: [0 Anger, 1 Contempt, 2 Disgust, 3 Fear, 4 Happiness, 5 Neutral, 6 Sadness, 7 Surprise]
 * - happy=Happiness · calm=Neutral · sad=Sadness+Fear · angry=Anger+Contempt+Disgust
 * - Surprise는 4정서에 안 맞아 제외(질량 버림) 후 재정규화. 합 0이면 calm=1 폴백.
 */
export function map8ToEmotionResult(probs8: number[]): EmotionResult {
  const happy = probs8[4] ?? 0
  const calm = probs8[5] ?? 0
  const sad = (probs8[6] ?? 0) + (probs8[3] ?? 0)
  const angry = (probs8[0] ?? 0) + (probs8[1] ?? 0) + (probs8[2] ?? 0)
  const sum = happy + calm + sad + angry
  if (sum <= 0) return { happy: 0, calm: 1, sad: 0, angry: 0 }
  return { happy: happy / sum, calm: calm / sum, sad: sad / sum, angry: angry / sum }
}
