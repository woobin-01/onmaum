import { describe, it, expect } from 'vitest'
import {
  STAGE_LABEL_MESSAGES,
  STAGE_KOREAN_NAMES,
  getStageLabelMessage,
} from '@/lib/stageLabels'

describe('STAGE_LABEL_MESSAGES', () => {
  it('awakening~living 4단계만 매핑 (Empty 제외)', () => {
    expect(STAGE_LABEL_MESSAGES.awakening).toBe('감정 오브가 깨어났어요')
    expect(STAGE_LABEL_MESSAGES.forming).toBe('결이 보이기 시작했어요')
    expect(STAGE_LABEL_MESSAGES.settled).toBe('조금 더 또렷해졌어요')
    expect(STAGE_LABEL_MESSAGES.living).toBe('당신과 함께 살아가요')
    expect(STAGE_LABEL_MESSAGES.empty).toBeUndefined()
  })
})

describe('STAGE_KOREAN_NAMES', () => {
  it('5단계 모두 한국어 이름 매핑 (Empty 포함)', () => {
    expect(STAGE_KOREAN_NAMES.empty).toBe('비어있음')
    expect(STAGE_KOREAN_NAMES.awakening).toBe('깨어남')
    expect(STAGE_KOREAN_NAMES.forming).toBe('형성 중')
    expect(STAGE_KOREAN_NAMES.settled).toBe('안정')
    expect(STAGE_KOREAN_NAMES.living).toBe('살아있음')
  })
})

describe('getStageLabelMessage', () => {
  it('awakening → 동반자 톤 메시지', () => {
    expect(getStageLabelMessage('awakening')).toBe('감정 오브가 깨어났어요')
  })

  it('living → 동반자 톤 메시지', () => {
    expect(getStageLabelMessage('living')).toBe('당신과 함께 살아가요')
  })

  it('empty → null (메시지 없음)', () => {
    expect(getStageLabelMessage('empty')).toBeNull()
  })
})
