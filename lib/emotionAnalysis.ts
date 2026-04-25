import * as faceapi from 'face-api.js'

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

const MODELS_URL = '/models'

const DETECTOR_OPTIONS = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.5,
})

export async function loadFaceApiModels(): Promise<void> {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
  ])
}

export async function analyzeEmotion(
  videoEl: HTMLVideoElement,
): Promise<EmotionResult | null> {
  const detection = await faceapi
    .detectSingleFace(videoEl, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceExpressions()

  if (!detection) return null

  const e = detection.expressions
  const happy = e.happy
  const calm = e.neutral
  const sad = e.sad
  const angry = e.angry

  const sum = happy + calm + sad + angry
  if (sum <= 0) return { happy: 0, calm: 1, sad: 0, angry: 0 }

  return {
    happy: happy / sum,
    calm: calm / sum,
    sad: sad / sum,
    angry: angry / sum,
  }
}

export function getDominantEmotion(emotions: EmotionResult): Emotion {
  return EMOTION_ORDER.reduce((best, current) =>
    emotions[current] > emotions[best] ? current : best,
  )
}
