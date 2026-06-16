import { describe, it, expect } from 'vitest'
import { LiveEmotionSmoother, LIVE_MEDIAN_WINDOW } from '@/lib/liveSmoothing'
import type { EmotionResult } from '@/lib/emotionAnalysis'

// 평온 프레임(측정 페이지의 CALM_FALLBACK과 동일 분포)과 화남 스파이크.
const CALM: EmotionResult = { happy: 0.1, calm: 0.7, sad: 0.1, angry: 0.1 }
const ANGRY: EmotionResult = { happy: 0, calm: 0, sad: 0, angry: 1 }

describe('LiveEmotionSmoother', () => {
  it('단발 화남 스파이크는 중앙값에 묻혀 오브를 화남으로 튀게 하지 않는다', () => {
    const s = new LiveEmotionSmoother()
    s.push(CALM)
    s.push(CALM)
    const r = s.push(ANGRY) // 평온·평온 뒤 화남 한 번 = 단발 스파이크

    // 화남이 잠깐 1.0으로 들어와도, 최근 3프레임 중앙값은 여전히 평온이라
    // 결과는 평온 우세를 유지해야 한다.
    expect(r.angry).toBeLessThan(r.calm)
    expect(r.angry).toBeLessThan(0.3)
  })

  it('부정(화남)이 연속으로 들어오면 화남 값이 점점 올라간다', () => {
    const s = new LiveEmotionSmoother()
    s.push(CALM) // 평온 기준선에서 출발

    const angrySeq: number[] = []
    for (let i = 0; i < 8; i++) angrySeq.push(s.push(ANGRY).angry)

    // 시간이 갈수록 화남이 누적되어 처음보다 커지고, 결국 우세 감정이 된다.
    expect(angrySeq[angrySeq.length - 1]).toBeGreaterThan(angrySeq[0])
    expect(angrySeq[angrySeq.length - 1]).toBeGreaterThan(0.5)
  })

  it('reset()은 중앙값 버퍼와 EMA 상태를 모두 비워 다음 측정이 깨끗하게 시작된다', () => {
    const s = new LiveEmotionSmoother()
    s.push(CALM)
    s.push(CALM)
    s.push(CALM)

    s.reset()
    // 리셋 후 첫 push는 (버퍼·이전값 모두 비었으므로) 그 프레임 그대로 나와야 한다.
    const r = s.push(ANGRY)
    expect(r.angry).toBeCloseTo(1)
    expect(r.calm).toBeCloseTo(0)
  })

  it('기본 중앙값 윈도우는 3프레임', () => {
    expect(LIVE_MEDIAN_WINDOW).toBe(3)
  })
})
