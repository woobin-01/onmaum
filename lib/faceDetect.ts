import * as faceapi from 'face-api.js'

const MODELS_URL = '/models'
const DETECTOR_OPTIONS = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })

let loaded = false

/** face-api SSD 검출기만 로드(표정넷·랜드마크넷 미사용). */
export async function loadFaceDetector(): Promise<void> {
  if (loaded) return
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL)
  loaded = true
}

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

/** 단일 얼굴 bbox. 미검출 시 null. */
export async function detectFaceBox(video: HTMLVideoElement): Promise<FaceBox | null> {
  const det = await faceapi.detectSingleFace(video, DETECTOR_OPTIONS)
  if (!det) return null
  const { x, y, width, height } = det.box
  return { x, y, width, height }
}
