import { describe, it, expect } from 'vitest'
import { getStressAlertCopy } from '@/lib/stressAlertMessages'

describe('getStressAlertCopy', () => {
  it('good → 안정 문구 반환', () => {
    const copy = getStressAlertCopy('good')
    expect(copy.title).toBe('안정적인 상태입니다')
    expect(copy.message).toContain('스트레스 신호가 크지 않습니다')
    expect(copy.recommendation).toContain('리듬을 유지')
  })

  it('watch → 체크 권유 문구 반환', () => {
    const copy = getStressAlertCopy('watch')
    expect(copy.title).toBe('상태를 한 번 체크해보세요')
    expect(copy.message).toContain('스트레스 신호가 조금 보입니다')
    expect(copy.recommendation).toContain('물 한 잔')
  })

  it('caution → 호흡 권유 문구 반환', () => {
    const copy = getStressAlertCopy('caution')
    expect(copy.title).toBe('천천히 호흡해볼까요?')
    expect(copy.message).toContain('스트레스가 높아지고 있어요')
    expect(copy.recommendation).toContain('호흡')
  })

  it('danger + score=82 → 문구에 82점 포함', () => {
    const copy = getStressAlertCopy('danger', 82)
    expect(copy.title).toBe('잠시 쉬어갈 시간이에요')
    expect(copy.message).toContain('82점')
    expect(copy.recommendation).toContain('1분 휴식')
  })

  it('danger + score=null → 점수 없이 자연스러운 문구 반환', () => {
    const copy = getStressAlertCopy('danger', null)
    expect(copy.title).toBe('잠시 쉬어갈 시간이에요')
    expect(copy.message).not.toContain('null')
    expect(copy.message).not.toContain('점')
    expect(copy.message).toContain('스트레스 신호가 높게 유지되고 있어요')
  })

  it('danger + score 미전달 → 점수 없이 자연스러운 문구 반환', () => {
    const copy = getStressAlertCopy('danger')
    expect(copy.message).toContain('스트레스 신호가 높게 유지되고 있어요')
  })

  it('진단/공포 표현을 사용하지 않는다', () => {
    const levels = ['good', 'watch', 'caution', 'danger'] as const
    for (const level of levels) {
      const copy = getStressAlertCopy(level, 90)
      const text = `${copy.title} ${copy.message} ${copy.recommendation}`
      expect(text).not.toMatch(/우울증|치료|진단|위험합니다|정신질환/)
    }
  })
})
