import { describe, it, expect } from 'vitest'
import { toModelTensor, MODEL_SIZE, MEAN, STD } from '@/lib/emotionPreprocess'

// ImageData 대신 구조적 호환 객체 사용(happy-dom ImageData 의존 회피)
function img(pixels: number[], w: number, h: number) {
  return { data: Uint8ClampedArray.from(pixels), width: w, height: h }
}

describe('toModelTensor', () => {
  it('1×1 빨강 픽셀 → BGR 평면·정규화 값', () => {
    // R=255,G=0,B=0,A=255
    const t = toModelTensor(img([255, 0, 0, 255], 1, 1))
    expect(t.length).toBe(3) // n=1, 3채널
    expect(t[0]).toBeCloseTo((0 - MEAN[0]) / STD[0]) // B plane
    expect(t[1]).toBeCloseTo((0 - MEAN[1]) / STD[1]) // G plane
    expect(t[2]).toBeCloseTo((1 - MEAN[2]) / STD[2]) // R plane
  })

  it('NCHW 평면 레이아웃(2픽셀): [B0,B1, G0,G1, R0,R1]', () => {
    // px0 = (255,0,0), px1 = (0,0,255)
    const t = toModelTensor(img([255, 0, 0, 255, 0, 0, 255, 255], 2, 1))
    const n = 2
    expect(t[0]).toBeCloseTo((0 - MEAN[0]) / STD[0]) // B plane px0
    expect(t[1]).toBeCloseTo((1 - MEAN[0]) / STD[0]) // B plane px1
    expect(t[2 * n + 0]).toBeCloseTo((1 - MEAN[2]) / STD[2]) // R plane px0
    expect(t[2 * n + 1]).toBeCloseTo((0 - MEAN[2]) / STD[2]) // R plane px1
  })

  it('상수', () => {
    expect(MODEL_SIZE).toBe(224)
    expect(MEAN).toEqual([0.485, 0.456, 0.406])
    expect(STD).toEqual([0.229, 0.224, 0.225])
  })
})
