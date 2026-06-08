import type { Emotion } from './emotionAnalysis'

export const EMOTION_CAPTIONS: Record<Emotion, string> = {
  calm: '마음이 잔잔해요 🌿',
  happy: '오늘 기분, 좋아 보여요 ☀️',
  sad: '오늘 좀 무거웠죠. 천천히 가요',
  angry: '마음에 힘이 들어갔네요. 잠깐 숨 돌릴까요?',
}

export function captionFor(dominant: Emotion): string {
  return EMOTION_CAPTIONS[dominant]
}
