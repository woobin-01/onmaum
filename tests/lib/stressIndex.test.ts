import { describe, it, expect } from 'vitest'
import { frameContribution } from '@/lib/stressIndex'

describe('frameContribution', () => {
  it('pos=happy, neg=sad + angry×1.5', () => {
    const c = frameContribution({ happy: 0.5, calm: 0.2, sad: 0.1, angry: 0.2 })
    expect(c.pos).toBeCloseTo(0.5)
    expect(c.neg).toBeCloseTo(0.1 + 0.2 * 1.5) // 0.4
  })

  it('calm은 긍정에 들어가지 않는다', () => {
    const c = frameContribution({ happy: 0, calm: 1, sad: 0, angry: 0 })
    expect(c.pos).toBeCloseTo(0)
    expect(c.neg).toBeCloseTo(0)
  })
})
