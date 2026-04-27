export interface SelfCareTip {
  icon: string
  text: string
}

export const TIPS: SelfCareTip[] = [
  { icon: '💧', text: '물 한 잔 마셔보세요' },
  { icon: '🌬️', text: '천천히 깊게 5번 숨을 들이쉬어 보세요' },
  { icon: '🚶', text: '잠시 일어나 5분만 걸어보세요' },
  { icon: '👀', text: '20초간 먼 곳을 바라보세요' },
  { icon: '🌿', text: '창밖 자연을 한 번 바라보세요' },
  { icon: '🫶', text: '오늘 잘한 일 한 가지를 떠올려보세요' },
  { icon: '☕', text: '따뜻한 차 한 잔 어떠세요' },
  { icon: '📵', text: '5분만 화면에서 눈을 떼어보세요' },
  { icon: '🤲', text: '어깨를 천천히 풀어보세요' },
  { icon: '🛌', text: '오늘 충분히 잘 수 있도록 미리 준비해보세요' },
]

export function selectRandomTip(currentTip?: SelfCareTip): SelfCareTip {
  const candidates = currentTip ? TIPS.filter((t) => t !== currentTip) : TIPS
  if (candidates.length === 0) {
    return TIPS[0]
  }
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx]
}
