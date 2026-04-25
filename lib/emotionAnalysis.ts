import * as faceapi from 'face-api.js'

export interface EmotionResult {
  neutral: number
  happy: number
  sad: number
  angry: number
  fearful: number
  disgusted: number
  surprised: number
}

export type EmotionKey = keyof EmotionResult

const MODELS_URL = '/models'

export async function loadFaceApiModels(): Promise<void> {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
  ])
}

export async function analyzeEmotion(
  videoEl: HTMLVideoElement,
): Promise<EmotionResult | null> {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions()

  if (!detection) return null

  const e = detection.expressions
  return {
    neutral: e.neutral,
    happy: e.happy,
    sad: e.sad,
    angry: e.angry,
    fearful: e.fearful,
    disgusted: e.disgusted,
    surprised: e.surprised,
  }
}

export function getDominantEmotion(emotions: EmotionResult): EmotionKey {
  const entries = Object.entries(emotions) as [EmotionKey, number][]
  return entries.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0]
}
