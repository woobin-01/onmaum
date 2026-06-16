export const MODEL_SIZE = 224
// HSEmotion(EfficientNet-B0)은 torchvision 학습 그대로 RGB 입력에 ImageNet mean/std를
// 채널 순서(0→R, 1→G, 2→B)로 적용한다. (BGR로 넣으면 R↔B가 뒤바뀌어 예측이 망가짐)
export const MEAN = [0.485, 0.456, 0.406]
export const STD = [0.229, 0.224, 0.225]

interface PixelSource {
  data: Uint8ClampedArray | number[]
  width: number
  height: number
}

/**
 * 224×224 RGBA → Float32 NCHW [1,3,224,224], 채널 순서 RGB, /255 후 정규화.
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
    out[i] = (r - MEAN[0]) / STD[0] // R plane
    out[n + i] = (g - MEAN[1]) / STD[1] // G plane
    out[2 * n + i] = (b - MEAN[2]) / STD[2] // B plane
  }
  return out
}
