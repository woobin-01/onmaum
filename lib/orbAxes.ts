import type { Emotion, EmotionResult } from './emotionAnalysis'

const HUE_COLORS: Record<Emotion, readonly [number, number, number]> = {
  happy: [242, 201, 76],
  calm: [107, 171, 154],
  sad: [123, 163, 196],
  angry: [232, 128, 106],
}

export const NEUTRAL_HUE = 'rgb(107,171,154)'
const OPACITY_FULL_COUNT = 31
// Calibrated to the design table anchors: 5 records ~= 0.55, 10 records ~= 0.71.
const OPACITY_CURVE_DENOMINATOR = Math.log(36)
const EMOTIONS: Emotion[] = ['happy', 'calm', 'sad', 'angry']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function opacityFromCount(count: number): number {
  if (count <= 0) return 0.15
  if (count >= OPACITY_FULL_COUNT) return 1

  return 0.15 + 0.85 * (Math.log(count + 1) / OPACITY_CURVE_DENOMINATOR)
}

export function hueFromWeeklyEmotion(emotions: EmotionResult): string {
  const total = EMOTIONS.reduce((sum, emotion) => sum + emotions[emotion], 0)
  if (total <= 0) return NEUTRAL_HUE

  const [r, g, b] = EMOTIONS.reduce(
    (channels, emotion) => {
      const weight = emotions[emotion] / total
      const color = HUE_COLORS[emotion]

      return [
        channels[0] + color[0] * weight,
        channels[1] + color[1] * weight,
        channels[2] + color[2] * weight,
      ] as [number, number, number]
    },
    [0, 0, 0] as [number, number, number],
  ).map(Math.round)

  return `rgb(${r},${g},${b})`
}

export function saturationFromIntensity(
  negativeRatio: number,
  flatAffectAvg: number,
): number {
  const intensity = clamp(Math.max(negativeRatio, 1 - flatAffectAvg), 0, 1)

  return 0.3 + 0.7 * intensity
}

export function motionFromFrequency(daysOutOfSeven: number): number {
  const clamped = clamp(daysOutOfSeven, 0, 7)

  return 0.3 + 0.7 * (Math.log(clamped + 1) / Math.log(8))
}
