import { describe, it, expect } from 'vitest'
import { TIPS, selectRandomTip } from '@/lib/selfCareTips'

describe('TIPS', () => {
  it('최소 5개 이상의 팁을 정의', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(5)
  })

  it('각 팁은 icon과 text를 가진다', () => {
    for (const tip of TIPS) {
      expect(typeof tip.icon).toBe('string')
      expect(tip.icon.length).toBeGreaterThan(0)
      expect(typeof tip.text).toBe('string')
      expect(tip.text.length).toBeGreaterThan(0)
    }
  })
})

describe('selectRandomTip', () => {
  it('인자 없으면 TIPS 안의 임의 팁 반환', () => {
    const tip = selectRandomTip()
    expect(TIPS).toContain(tip)
  })

  it('currentTip 주어지면 그것과 다른 팁 반환', () => {
    const current = TIPS[0]
    for (let i = 0; i < 100; i++) {
      const next = selectRandomTip(current)
      expect(next).not.toBe(current)
    }
  })

  it('selectRandomTip(current) 결과는 항상 TIPS 안에 있음', () => {
    const current = TIPS[0]
    for (let i = 0; i < 50; i++) {
      const next = selectRandomTip(current)
      expect(TIPS).toContain(next)
    }
  })
})
