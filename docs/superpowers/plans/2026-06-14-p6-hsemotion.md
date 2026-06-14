# P6 — HSEmotion(onnxruntime-web) 감정 분류 교체 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** face-api 표정넷을 HSEmotion EfficientNet-B0(onnx)로 교체해 감정 분류 정확도를 높인다. 얼굴 검출은 face-api SSD를 유지하는 하이브리드.

**Architecture:** 단일 seam `analyzeEmotion(video) → EmotionResult` 내부만 교체: face-api SSD로 bbox 검출 → 224 캔버스 크롭 → 전처리(BGR·ImageNet·NCHW) → onnxruntime-web로 HSEmotion 추론 → 8감정 softmax → 4감정 매핑. 다운스트림 무변경.

**Tech Stack:** Next.js 16, React 19, TS, onnxruntime-web 1.26(WASM, self-host, numThreads=1), face-api.js(SSD 검출만), Vitest.

**Spec:** [docs/superpowers/specs/2026-06-14-p6-hsemotion-design.md](../specs/2026-06-14-p6-hsemotion-design.md)

---

## 공통 규약
- 브랜치 `feature/p6-hsemotion` (생성됨).
- 테스트: Vitest, `tests/lib/*.test.ts`, `import { describe, it, expect } from 'vitest'`, 단일 실행 `npx vitest run <path>`.
- 커밋: 그린 후 1태스크 1커밋, 메시지 끝 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- 순수 로직(매핑/전처리)은 TDD. 검출·onnx 세션은 브라우저/모델 의존이라 단위테스트 대신 **Task 7 수동 검증**.

## 파일 구조
| 파일 | 책임 |
|------|------|
| `public/ort/*.wasm` | onnxruntime-web wasm 자산(self-host) |
| `public/models/enet_b0_8_va_mtl.onnx` | HSEmotion 모델(~16MB) |
| `lib/emotionMapping.ts` (신규, 순수) | `softmax`, `map8ToEmotionResult` |
| `lib/emotionPreprocess.ts` (신규, 순수) | `toModelTensor`(224 ImageData→BGR/정규화/NCHW Float32) + 상수 |
| `lib/faceDetect.ts` (신규) | face-api SSD 로드 + `detectFaceBox` |
| `lib/hsemotion.ts` (신규) | ort 세션 로드 + `classifyEmotion`(softmaxed 8) |
| `lib/emotionAnalysis.ts` (수정) | 오케스트레이션 + `loadEmotionModels`; normalizeExpressions/RawExpressions 제거 |
| `app/measure/page.tsx` (수정) | `loadFaceApiModels`→`loadEmotionModels` 임포트/호출 갱신 |
| `tests/lib/emotionAnalysis.test.ts` (삭제) | normalizeExpressions 전용이라 제거 |

---

## Task 1: 의존성·자산 셋업 (onnxruntime-web + wasm + 모델)

**Files:** `package.json`(+onnxruntime-web), `public/ort/*.wasm`, `public/models/enet_b0_8_va_mtl.onnx`

- [ ] **Step 1: onnxruntime-web 설치**

```bash
npm i onnxruntime-web@1.26.0
```

- [ ] **Step 2: wasm 자산 self-host로 복사**

```bash
mkdir -p public/ort && cp node_modules/onnxruntime-web/dist/*.wasm public/ort/ && ls -la public/ort/
```
Expected: `ort-wasm-simd-threaded.wasm` 등 .wasm 파일들이 복사됨.

- [ ] **Step 3: HSEmotion 모델 다운로드(~16MB)**

```bash
mkdir -p public/models && curl -L -o public/models/enet_b0_8_va_mtl.onnx "https://raw.githubusercontent.com/sb-ai-lab/EmotiEffLib/main/models/affectnet_emotions/onnx/enet_b0_8_va_mtl.onnx" && ls -la public/models/enet_b0_8_va_mtl.onnx
```
Expected: 파일 크기 ≈ 16,049,834 바이트(~16MB). 훨씬 작으면(HTML 리다이렉트 페이지면) URL 재확인.

- [ ] **Step 4: 빌드 확인 (onnxruntime-web 번들 정상)**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공. (실패 시 — Turbopack이 ort-web을 SSR에 넣으려 하면 — 해당 모듈을 client에서만 import하므로 보통 문제 없음. 그래도 빌드가 깨지면 `next.config`에 `serverExternalPackages: ['onnxruntime-web']` 추가를 검토하되, 이 태스크에선 우선 기본 설정으로 확인.)

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json public/ort public/models/enet_b0_8_va_mtl.onnx
git commit -m "chore(p6): onnxruntime-web + HSEmotion 모델/wasm 자산 셋업

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> 참고: `public/models/`엔 기존 face-api 모델(바이너리)이 이미 커밋돼 있어 16MB onnx 추가도 동일 패턴. (LFS 미사용)

---

## Task 2: `lib/emotionMapping.ts` — softmax + 8→4 매핑 (순수, TDD)

**Files:** Create `lib/emotionMapping.ts`; Test `tests/lib/emotionMapping.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/lib/emotionMapping.test.ts
import { describe, it, expect } from 'vitest'
import { softmax, map8ToEmotionResult } from '@/lib/emotionMapping'

// AffectNet 8 순서: [Anger, Contempt, Disgust, Fear, Happiness, Neutral, Sadness, Surprise]
describe('softmax', () => {
  it('합이 1, 단조 보존', () => {
    const s = softmax([0, 1, 2])
    const sum = s.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1)
    expect(s[2]).toBeGreaterThan(s[1])
    expect(s[1]).toBeGreaterThan(s[0])
  })
})

describe('map8ToEmotionResult', () => {
  const P = (overrides: Partial<Record<number, number>>) => {
    const a = [0, 0, 0, 0, 0, 0, 0, 0]
    for (const k of Object.keys(overrides)) a[Number(k)] = overrides[Number(k)]!
    return a
  }

  it('Happiness→happy', () => {
    expect(map8ToEmotionResult(P({ 4: 1 }))).toEqual({ happy: 1, calm: 0, sad: 0, angry: 0 })
  })
  it('Neutral→calm', () => {
    expect(map8ToEmotionResult(P({ 5: 1 }))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
  })
  it('Sadness+Fear→sad', () => {
    const r = map8ToEmotionResult(P({ 6: 0.6, 3: 0.4 }))
    expect(r.sad).toBeCloseTo(1)
  })
  it('Anger+Contempt+Disgust→angry', () => {
    const r = map8ToEmotionResult(P({ 0: 0.5, 1: 0.3, 2: 0.2 }))
    expect(r.angry).toBeCloseTo(1)
  })
  it('Surprise는 제외 후 재정규화', () => {
    // Happiness 0.4, Surprise 0.4, Sadness 0.2 → surprise 버림 → happy .4/.6, sad .2/.6
    const r = map8ToEmotionResult(P({ 4: 0.4, 7: 0.4, 6: 0.2 }))
    expect(r.happy).toBeCloseTo(0.4 / 0.6)
    expect(r.sad).toBeCloseTo(0.2 / 0.6)
    expect(r.calm).toBeCloseTo(0)
    expect(r.angry).toBeCloseTo(0)
  })
  it('전부 0(또는 Surprise만) → calm 폴백', () => {
    expect(map8ToEmotionResult(P({ 7: 1 }))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
    expect(map8ToEmotionResult(P({}))).toEqual({ happy: 0, calm: 1, sad: 0, angry: 0 })
  })
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/lib/emotionMapping.test.ts` · Expected: FAIL(module not found)

- [ ] **Step 3: 구현**

```ts
// lib/emotionMapping.ts
import type { EmotionResult } from './emotionAnalysis'

/** 수치 안정 softmax. */
export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - m))
  const sum = exps.reduce((a, b) => a + b, 0)
  return sum > 0 ? exps.map((e) => e / sum) : xs.map(() => 0)
}

/**
 * HSEmotion AffectNet 8클래스 확률 → 앱의 4감정.
 * 순서: [0 Anger, 1 Contempt, 2 Disgust, 3 Fear, 4 Happiness, 5 Neutral, 6 Sadness, 7 Surprise]
 * - happy=Happiness · calm=Neutral · sad=Sadness+Fear · angry=Anger+Contempt+Disgust
 * - Surprise는 4정서에 안 맞아 제외(질량 버림) 후 재정규화. 합 0이면 calm=1 폴백.
 */
export function map8ToEmotionResult(probs8: number[]): EmotionResult {
  const happy = probs8[4] ?? 0
  const calm = probs8[5] ?? 0
  const sad = (probs8[6] ?? 0) + (probs8[3] ?? 0)
  const angry = (probs8[0] ?? 0) + (probs8[1] ?? 0) + (probs8[2] ?? 0)
  const sum = happy + calm + sad + angry
  if (sum <= 0) return { happy: 0, calm: 1, sad: 0, angry: 0 }
  return { happy: happy / sum, calm: calm / sum, sad: sad / sum, angry: angry / sum }
}
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/lib/emotionMapping.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/emotionMapping.ts tests/lib/emotionMapping.test.ts
git commit -m "feat(p6): HSEmotion softmax + 8→4 감정 매핑 (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `lib/emotionPreprocess.ts` — 텐서 전처리 (순수, TDD)

**Files:** Create `lib/emotionPreprocess.ts`; Test `tests/lib/emotionPreprocess.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/lib/emotionPreprocess.test.ts
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
    // 평면 순서 B,G,R / 값 = (c/255 - mean)/std (mean/std 인덱스 0→B,1→G,2→R)
    expect(t[0]).toBeCloseTo((0 - MEAN[0]) / STD[0]) // B plane
    expect(t[1]).toBeCloseTo((0 - MEAN[1]) / STD[1]) // G plane
    expect(t[2]).toBeCloseTo((1 - MEAN[2]) / STD[2]) // R plane
  })

  it('NCHW 평면 레이아웃(2픽셀): [B0,B1, G0,G1, R0,R1]', () => {
    // px0 = (255,0,0), px1 = (0,0,255)
    const t = toModelTensor(img([255, 0, 0, 255, 0, 0, 255, 255], 2, 1))
    const n = 2
    // B plane: px0 B=0, px1 B=255
    expect(t[0]).toBeCloseTo((0 - MEAN[0]) / STD[0])
    expect(t[1]).toBeCloseTo((1 - MEAN[0]) / STD[0])
    // R plane: px0 R=255, px1 R=0
    expect(t[2 * n + 0]).toBeCloseTo((1 - MEAN[2]) / STD[2])
    expect(t[2 * n + 1]).toBeCloseTo((0 - MEAN[2]) / STD[2])
  })

  it('상수', () => {
    expect(MODEL_SIZE).toBe(224)
    expect(MEAN).toEqual([0.485, 0.456, 0.406])
    expect(STD).toEqual([0.229, 0.224, 0.225])
  })
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/lib/emotionPreprocess.test.ts` · Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// lib/emotionPreprocess.ts
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
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/lib/emotionPreprocess.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/emotionPreprocess.ts tests/lib/emotionPreprocess.test.ts
git commit -m "feat(p6): HSEmotion 입력 전처리(BGR/ImageNet/NCHW) (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `lib/faceDetect.ts` — face-api SSD 검출기 래퍼

**Files:** Create `lib/faceDetect.ts` (단위테스트 없음 — face-api/DOM 의존, Task 7 수동검증)

- [ ] **Step 1: 구현**

```ts
// lib/faceDetect.ts
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
```

- [ ] **Step 2: 타입 확인** — Run: `npx tsc --noEmit` · Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/faceDetect.ts
git commit -m "feat(p6): face-api SSD 검출기 래퍼(검출만)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `lib/hsemotion.ts` — onnxruntime-web 세션 + 분류

**Files:** Create `lib/hsemotion.ts` (단위테스트 없음 — wasm/모델 의존, Task 7 수동검증)

- [ ] **Step 1: 구현**

```ts
// lib/hsemotion.ts
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
```

- [ ] **Step 2: 타입 확인** — Run: `npx tsc --noEmit` · Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/hsemotion.ts
git commit -m "feat(p6): onnxruntime-web HSEmotion 세션 + 분류

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `lib/emotionAnalysis.ts` 교체 + 배선 정리

**Files:** Modify `lib/emotionAnalysis.ts`; Modify `app/measure/page.tsx`; Delete `tests/lib/emotionAnalysis.test.ts`

- [ ] **Step 1: `lib/emotionAnalysis.ts` 전체 교체**

```ts
// lib/emotionAnalysis.ts
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
```

- [ ] **Step 2: `app/measure/page.tsx` 임포트/호출 갱신**

`import { loadFaceApiModels, type EmotionResult } from '@/lib/emotionAnalysis'` →
`import { loadEmotionModels, type EmotionResult } from '@/lib/emotionAnalysis'`

그리고 effect 안의 `loadFaceApiModels()` 호출을 `loadEmotionModels()`로 바꾼다. (다른 코드/로그 메시지는 그대로 둬도 됨.)

- [ ] **Step 3: 구 테스트 삭제**

```bash
git rm tests/lib/emotionAnalysis.test.ts
```
(normalizeExpressions 전용 테스트였고 해당 함수는 제거됨. map8/softmax/전처리 테스트가 대체.)

- [ ] **Step 4: 타입 + 전체 테스트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run test:run && npm run build`
Expected: tsc·lint 클린, 전체 테스트 통과(normalizeExpressions 테스트 빠진 만큼 감소), 빌드 성공.

- [ ] **Step 5: 커밋**

```bash
git add lib/emotionAnalysis.ts app/measure/page.tsx tests/lib/emotionAnalysis.test.ts
git commit -m "feat(p6): emotionAnalysis를 face-api검출+HSEmotion으로 교체

normalizeExpressions/RawExpressions 제거, loadFaceApiModels→loadEmotionModels.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 수동 검증 (run/verify) — ⚠️ 전처리 정합성 핵심

**Files:** 없음(런타임 관찰)

- [ ] **Step 1: dev 서버로 /measure 실행** — `npm run dev` → 시크릿 창 `http://localhost:3000/measure`(온보딩 통과) → "측정 시작"(카메라 허용).
- [ ] **Step 2: 모델 로드 확인** — 콘솔 에러 없이 측정 시작됨. (onnx 세션·wasm 로드 실패 시 `modelStatus:'error'`/콘솔 확인.)
- [ ] **Step 3: 예측 sanity (전처리 정합성)** — 뚜렷한 표정으로 EmotionDisplay(측정 중 표시)/오브가 상식적으로 반응하는지:
  - 웃기 → happy(기쁨) 우세, 무표정 → calm(평온), 찡그림/화남 → angry(화남), 슬픈 표정 → sad.
  - **예측이 무작위/한 감정 고정이면 전처리(BGR·정규화 순서) 의심** → spec §5 재점검(채널 순서, mean/std 인덱스, /255). 필요시 RGB↔BGR 토글해 비교.
- [ ] **Step 4: 화남 개선 확인** — 기존 face-api 대비 angry 포착이 나아졌는지 체감 확인(목표).
- [ ] **Step 5: 결과 기록** — 정상이면 PASS, 이상하면 전처리 가설과 함께 보고.

> 이 태스크는 단위테스트로 못 잡는 모델 정합성을 확인하는 단계라 **건너뛰지 말 것**.

---

## Self-Review (작성자 체크)

**1. Spec coverage**
- D1 하이브리드(faceDetect+hsemotion) ✓ Task 4·5·6. D2 8→4 매핑 ✓ Task 2. D3 va_mtl 앞8 ✓ Task 5(slice(0,8)). D4 wasm self-host+numThreads=1 ✓ Task 1·5. D5 폴백없음 ✓ Task 6(null 반환).
- §4 모델/런타임 ✓ Task1·5. §5 전처리 ✓ Task3 + §검증 Task7. §6 매핑 ✓ Task2. §9 테스트 ✓ Task2·3 + Task7. §3 모듈분해 ✓ 파일구조.

**2. Placeholder scan** — 없음. Task1 Step4·Task7은 조건부 검증(플레이스홀더 아님). 모델 URL·크기·ort 버전 실측 반영.

**3. Type consistency**
- `EmotionResult`(emotionAnalysis) — emotionMapping이 `import type`로 사용(런타임 순환 없음) ✓
- `softmax`/`map8ToEmotionResult`(emotionMapping) — hsemotion/emotionAnalysis에서 사용 ✓
- `toModelTensor`/`MODEL_SIZE`/`MEAN`/`STD`(emotionPreprocess) — emotionAnalysis/테스트 사용 ✓
- `FaceBox`/`detectFaceBox`/`loadFaceDetector`(faceDetect) · `loadHsemotion`/`classifyEmotion`(hsemotion) — emotionAnalysis 사용 ✓
- `loadEmotionModels` — measure page 사용(이름 일치) ✓

**4. 알려진 리스크(문서화)**
- 전처리 BGR/정규화 정합성(Task7에서 검증·필요시 토글).
- onnxruntime-web + Turbopack 번들(Task1 Step4에서 확인, 실패 시 serverExternalPackages).
- 16MB 모델 git 커밋(기존 face-api 바이너리와 동일 패턴).
- ort 단일스레드 성능(0.5초 주기엔 충분, 느리면 WebGPU EP는 향후).
