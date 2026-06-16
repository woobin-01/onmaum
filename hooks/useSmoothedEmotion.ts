'use client'

import { useEffect, useRef, useState } from 'react'
import type { EmotionResult } from '@/lib/emotionAnalysis'
import { LiveEmotionSmoother } from '@/lib/liveSmoothing'

/**
 * 오브용 부드러운 감정값.
 * useEmotionRecorder의 currentEmotion(프레임마다 튀는 raw 값)을
 * median → EMA로 완만하게 만들어 돌려준다.
 * 얼굴 미검출/측정 정지(null)이면 스무더를 리셋해 다음 측정이 깨끗하게 시작된다.
 */
export function useSmoothedEmotion(current: EmotionResult | null): EmotionResult | null {
  const smootherRef = useRef<LiveEmotionSmoother | null>(null)
  if (smootherRef.current === null) smootherRef.current = new LiveEmotionSmoother()

  const [smoothed, setSmoothed] = useState<EmotionResult | null>(null)

  useEffect(() => {
    const smoother = smootherRef.current!
    if (current === null) {
      smoother.reset()
      // ref에 든 외부 스무더와 동기화하는 의도적 setState. current 변할 때만 실행돼 cascading 아님.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSmoothed(null)
      return
    }
    // 새 프레임(current)이 올 때만 스무더를 돌려 결과를 state로 반영.
    setSmoothed(smoother.push(current))
  }, [current])

  return smoothed
}
