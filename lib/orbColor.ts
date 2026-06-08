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

export function gradientColors(e: EmotionResult): { from: string; to: string } {
  const [a, b] = topTwoEmotions(e)
  return { from: rgbString(EMOTION_HUES[a]), to: rgbString(EMOTION_HUES[b]) }
}

const EMOTIONS: Emotion[] = ['happy', 'calm', 'sad', 'angry']

export function accumulatedColor(emotions: EmotionResult): string {
  const total = EMOTIONS.reduce((sum, k) => sum + emotions[k], 0)
  if (total <= 0) return rgbString(EMOTION_HUES.calm)
  const blended = EMOTIONS.reduce(
    (acc, k) => {
      const w = emotions[k] / total
      const c = EMOTION_HUES[k]
      return [acc[0] + c[0] * w, acc[1] + c[1] * w, acc[2] + c[2] * w] as [
        number,
        number,
        number,
      ]
    },
    [0, 0, 0] as [number, number, number],
  ).map(Math.round) as unknown as RGB
  return rgbString(blended)
}
