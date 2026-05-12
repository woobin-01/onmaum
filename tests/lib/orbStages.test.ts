import { describe, expect, test } from 'vitest'
import {
  isStageHigher,
  STAGE_MESSAGES,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
  stageFromCount,
  type OrbStage,
} from '@/lib/orbStages'

describe('orbStages', () => {
  test('defines exact stage thresholds', () => {
    expect(STAGE_THRESHOLDS).toEqual({
      empty: 0,
      awakening: 1,
      forming: 4,
      settled: 11,
      living: 31,
    })
  })

  test('defines stages in empty to living order', () => {
    expect(STAGE_ORDER).toEqual(['empty', 'awakening', 'forming', 'settled', 'living'])
  })

  test('defines Korean messages for every stage', () => {
    const stages: OrbStage[] = ['empty', 'awakening', 'forming', 'settled', 'living']

    expect(STAGE_MESSAGES).toEqual({
      empty: '아직 당신을 모릅니다',
      awakening: '조금씩 느껴지기 시작',
      forming: '당신의 결이 보이기 시작',
      settled: '당신의 결이 분명해집니다',
      living: '당신과 함께 살아갑니다',
    })
    for (const stage of stages) {
      expect(STAGE_MESSAGES[stage]).toMatch(/[가-힣]/)
    }
  })

  test('maps counts to stages by threshold ranges', () => {
    expect(stageFromCount(0)).toBe('empty')
    expect(stageFromCount(1)).toBe('awakening')
    expect(stageFromCount(3)).toBe('awakening')
    expect(stageFromCount(4)).toBe('forming')
    expect(stageFromCount(10)).toBe('forming')
    expect(stageFromCount(11)).toBe('settled')
    expect(stageFromCount(30)).toBe('settled')
    expect(stageFromCount(31)).toBe('living')
    expect(stageFromCount(9999)).toBe('living')
  })

  test('maps negative counts to empty', () => {
    expect(stageFromCount(-1)).toBe('empty')
  })

  test('detects whether one stage is higher than another', () => {
    expect(isStageHigher('forming', 'empty')).toBe(true)
    expect(isStageHigher('empty', 'forming')).toBe(false)
    expect(isStageHigher('forming', 'forming')).toBe(false)
  })
})
