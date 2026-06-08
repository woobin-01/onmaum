import type { Emotion, EmotionResult } from './emotionAnalysis'
import { EMOTION_ORDER } from './emotionAnalysis'

export type RGB = readonly [number, number, number]

export const EMOTION_HUES: Record<Emotion, RGB> = {
  happy: [242, 201, 76],
  calm: [107, 171, 154],
  sad: [123, 163, 196],
  angry: [232, 128, 106],
}

export function rgbString(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export function topTwoEmotions(e: EmotionResult): [Emotion, Emotion] {
  const sorted = [...EMOTION_ORDER].sort((a, b) => e[b] - e[a])
  return [sorted[0], sorted[1]]
}
