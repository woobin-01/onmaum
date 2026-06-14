export const MODEL_SIZE = 224
// HSEmotion(EfficientNet-B0)은 OpenCV BGR 입력에 아래 mean/std를 채널 순서(0→B,1→G,2→R) 그대로 적용한다.
export const MEAN = [0.485, 0.456, 0.406]
export const STD = [0.229, 0.224, 0.225]

interface PixelSource {
  data: Uint8ClampedArray | number[]
  width: number
  height: number
}

/**
 * 224×224 RGBA → Float32 NCHW [1,3,224,224], 채널 순서 BGR, /255 후 정규화.
 * (호출부에서 224×224로 크롭/리사이즈한 ImageData를 넘긴다.)
 */
export function toModelTensor(img: PixelSource): Float32Array {
  const { data, width, height } = img
  const n = width * height
  const out = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    const r = data[i * 4] / 255
    const g = data[i * 4 + 1] / 255
    const b = data[i * 4 + 2] / 255
    out[i] = (b - MEAN[0]) / STD[0] // B plane
    out[n + i] = (g - MEAN[1]) / STD[1] // G plane
    out[2 * n + i] = (r - MEAN[2]) / STD[2] // R plane
  }
  return out
}
