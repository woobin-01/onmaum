import { loadFaceDetector, detectFaceBox } from './faceDetect'
import { loadHsemotion, classifyEmotion } from './hsemotion'
import { toModelTensor, MODEL_SIZE } from './emotionPreprocess'
import { map8ToEmotionResult } from './emotionMapping'

export type Emotion = 'happy' | 'calm' | 'sad' | 'angry'

export interface EmotionResult {
  happy: number
  calm: number
  sad: number
  angry: number
}

export const EMOTION_LABELS: Record<Emotion, string> = {
  happy: '기쁨',
  calm: '평온',
  sad: '슬픔',
  angry: '화남',
}

export const EMOTION_ORDER: Emotion[] = ['happy', 'calm', 'sad', 'angry']

/** face-api 검출기 + HSEmotion onnx 세션 동시 로드. */
export async function loadEmotionModels(): Promise<void> {
  await Promise.all([loadFaceDetector(), loadHsemotion()])
}

let cropCanvas: HTMLCanvasElement | null = null
function getCropCanvas(): HTMLCanvasElement {
  if (!cropCanvas) {
    cropCanvas = document.createElement('canvas')
    cropCanvas.width = MODEL_SIZE
    cropCanvas.height = MODEL_SIZE
  }
  return cropCanvas
}

/** 얼굴 검출 → 224 크롭 → 전처리 → HSEmotion 추론 → 4감정. 미검출/실패 시 null. */
export async function analyzeEmotion(
  video: HTMLVideoElement,
): Promise<EmotionResult | null> {
  const box = await detectFaceBox(video)
  if (!box) return null

  const canvas = getCropCanvas()
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  // 얼굴 주변 10% 여백 포함 크롭 → 224×224
  const m = 0.1
  const sx = Math.max(0, box.x - box.width * m)
  const sy = Math.max(0, box.y - box.height * m)
  const sw = Math.min(video.videoWidth - sx, box.width * (1 + 2 * m))
  const sh = Math.min(video.videoHeight - sy, box.height * (1 + 2 * m))
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, MODEL_SIZE, MODEL_SIZE)

  const imageData = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE)
  const tensor = toModelTensor(imageData)
  const probs8 = await classifyEmotion(tensor)
  return map8ToEmotionResult(probs8)
}

export function getDominantEmotion(emotions: EmotionResult): Emotion {
  return EMOTION_ORDER.reduce((best, current) =>
    emotions[current] > emotions[best] ? current : best,
  )
}
