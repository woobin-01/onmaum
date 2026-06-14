import { describe, it, expect } from 'vitest'
import { ANGRY_WEIGHT, MIN_RECORD_DURATION_MS } from '@/lib/riskCalculator'

describe('riskCalculator 상수', () => {
  it('ANGRY_WEIGHT = 1.5', () => {
    expect(ANGRY_WEIGHT).toBe(1.5)
  })

  it('MIN_RECORD_DURATION_MS = 10000', () => {
    expect(MIN_RECORD_DURATION_MS).toBe(10000)
  })
})
