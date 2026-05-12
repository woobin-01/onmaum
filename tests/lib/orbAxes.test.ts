import { describe, expect, test } from 'vitest'
import {
  hueFromWeeklyEmotion,
  motionFromFrequency,
  opacityFromCount,
  saturationFromIntensity,
} from '@/lib/orbAxes'

describe('orbAxes', () => {
  test('maps count to logarithmic opacity', () => {
    expect(opacityFromCount(0)).toBeCloseTo(0.15)
    expect(opacityFromCount(31)).toBeCloseTo(1.0)
    expect(opacityFromCount(5)).toBeGreaterThan(0.5)
    expect(opacityFromCount(5)).toBeLessThan(0.6)
    expect(opacityFromCount(10)).toBeGreaterThan(0.69)
    expect(opacityFromCount(10)).toBeLessThan(0.73)
    expect(opacityFromCount(9999)).toBe(1)
    expect(opacityFromCount(-5)).toBeCloseTo(0.15)
  })

  test('maps weekly emotion mix to weighted rgb hue', () => {
    expect(
      hueFromWeeklyEmotion({ happy: 1, calm: 0, sad: 0, angry: 0 }),
    ).toBe('rgb(242,201,76)')
    expect(
      hueFromWeeklyEmotion({ happy: 0, calm: 1, sad: 0, angry: 0 }),
    ).toBe('rgb(107,171,154)')
    expect(
      hueFromWeeklyEmotion({ happy: 0.5, calm: 0.5, sad: 0, angry: 0 }),
    ).toBe('rgb(175,186,115)')
    expect(
      hueFromWeeklyEmotion({ happy: 0, calm: 0, sad: 0, angry: 0 }),
    ).toBe('rgb(107,171,154)')
  })

  test('maps negative and flat affect intensity to saturation', () => {
    expect(saturationFromIntensity(0, 1)).toBeCloseTo(0.3)
    expect(saturationFromIntensity(1, 0.5)).toBeCloseTo(1.0)
    expect(saturationFromIntensity(0, 0)).toBeCloseTo(1.0)
    expect(saturationFromIntensity(0.4, 0.2)).toBeCloseTo(0.86, 2)
    expect(saturationFromIntensity(-0.5, 2)).toBeCloseTo(0.3)
    expect(saturationFromIntensity(2, -1)).toBeCloseTo(1.0)
  })

  test('maps days out of seven to logarithmic motion', () => {
    expect(motionFromFrequency(0)).toBeCloseTo(0.3)
    expect(motionFromFrequency(7)).toBeCloseTo(1.0)
    expect(motionFromFrequency(3)).toBeGreaterThan(0.74)
    expect(motionFromFrequency(3)).toBeLessThan(0.8)
    expect(motionFromFrequency(-1)).toBeCloseTo(0.3)
    expect(motionFromFrequency(15)).toBeCloseTo(1.0)
  })
})
