import { describe, it, expect } from 'vitest'
import { EMOTION_CAPTIONS, captionFor } from '@/lib/orbCaption'

describe('orbCaption', () => {
  it('4감정 토스 톤 카피 (spec §9)', () => {
    expect(EMOTION_CAPTIONS.calm).toBe('마음이 잔잔해요 🌿')
    expect(EMOTION_CAPTIONS.happy).toBe('오늘 기분, 좋아 보여요 ☀️')
    expect(EMOTION_CAPTIONS.sad).toBe('오늘 좀 무거웠죠. 천천히 가요')
    expect(EMOTION_CAPTIONS.angry).toBe('마음에 힘이 들어갔네요. 잠깐 숨 돌릴까요?')
  })
  it('captionFor(지배 감정)', () => {
    expect(captionFor('happy')).toBe('오늘 기분, 좋아 보여요 ☀️')
  })
  it('단정 어휘를 쓰지 않는다(주어=마음, ~해요/~까요?)', () => {
    for (const c of Object.values(EMOTION_CAPTIONS)) {
      expect(c).not.toMatch(/당신은|불안합니다|화났습니다/)
    }
  })
})
