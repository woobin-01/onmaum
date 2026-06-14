import * as ort from 'onnxruntime-web'
import { softmax } from './emotionMapping'

// self-host wasm + 단일 스레드(COOP/COEP·SharedArrayBuffer 의존 회피)
ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1

const MODEL_URL = '/models/enet_b0_8_va_mtl.onnx'
let session: ort.InferenceSession | null = null

export async function loadHsemotion(): Promise<void> {
  if (session) return
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
  })
}

/**
 * 전처리된 NCHW Float32([1,3,224,224]) → 8감정 확률(softmax).
 * 모델 출력 [1,10] 중 앞 8개(감정 로짓)만 사용, 뒤 2개(valence/arousal)는 미사용.
 */
export async function classifyEmotion(tensorData: Float32Array): Promise<number[]> {
  if (!session) throw new Error('hsemotion 세션이 로드되지 않았습니다')
  const input = new ort.Tensor('float32', tensorData, [1, 3, 224, 224])
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: input }
  const output = await session.run(feeds)
  const logits = Array.from(output[session.outputNames[0]].data as Float32Array)
  return softmax(logits.slice(0, 8))
}
