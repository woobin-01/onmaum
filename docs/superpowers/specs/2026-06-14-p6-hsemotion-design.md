# 온마음 P6 — HSEmotion(onnxruntime-web) 감정 분류 교체 설계

작성일: 2026-06-14
상태: 설계 확정 (구현 전)
브랜치: `feature/p6-hsemotion`
상위 spec: [2026-06-08-onmaum-v2-orb-stress-design.md](./2026-06-08-onmaum-v2-orb-stress-design.md) §3, §14(P6)

## 0. 목표

face-api.js의 표정 인식(특히 angry 약점)을 **HSEmotion EfficientNet-B0(AffectNet)** ONNX 모델로 교체해 감정 분류 정확도를 높인다. 앱은 앰비언트·집계 모델이라 per-frame 정확도 의존이 낮아 spec상 **후순위(P6)**였으나, 코어 정확도 개선으로 진행한다.

## 1. 핵심 결정 (확정)

| # | 결정 | 비고 |
|---|------|------|
| D1 | **하이브리드 검출** — face-api SSD 검출기 유지(bbox 크롭) + HSEmotion(onnx)로 감정 분류 | 검증된 검출 재사용, 리스크 최저. 풀-onnx 단일런타임(UltraFace 등)은 비채택(작업·리스크↑) |
| D2 | **8→4 매핑만** — `EmotionResult{happy,calm,sad,angry}` 계약 유지, V/A 미사용 | V/A→2축 재배선은 별도 큰 작업(향후 후보) |
| D3 | 모델 = **`enet_b0_8_va_mtl.onnx`** (출력 `[1,10]` 중 앞 8개만 사용) | spec 명명 모델 유지 + V/A 문 열어둠. Apache-2.0 |
| D4 | onnxruntime-web **WASM** 백엔드, wasm 자산 **self-host**(`public/`) | CDN 의존 회피(오프라인·프라이버시 일관) |
| D5 | **완전 교체** — face-api 표정넷 폴백 없음 | 로드 실패는 기존 `modelStatus:'error'`로 |

## 2. 변경의 seam

`useEmotionRecorder`가 0.5초마다 호출하는 단일 함수만 교체한다:

```
analyzeEmotion(video: HTMLVideoElement) → EmotionResult | null   // 계약 유지
```

다운스트림(`emotionAggregator` · `stressIndex` · `EmotionOrb` · `dailyStress`/`baseline` …)은 `EmotionResult`만 소비하므로 **무변경**.

## 3. 모듈 분해

- **`lib/faceDetect.ts`** — face-api SSD 검출기만 로드(`ssdMobilenetv1`), `detectFaceBox(video) → { x, y, width, height } | null`. 표정넷·랜드마크넷은 더 이상 로드하지 않음.
- **`lib/emotionPreprocess.ts`** (순수, TDD) — `toModelTensor(imageData: ImageData) → Float32Array` : 224×224 RGBA → **BGR · /255 · ImageNet 정규화 · NCHW** `[1,3,224,224]`. 크롭/리사이즈는 호출부(canvas)에서, 이 함수는 224×224 ImageData → 텐서 변환의 순수 로직.
- **`lib/hsemotion.ts`** — onnxruntime-web `InferenceSession` 로드(`/models/enet_b0_8_va_mtl.onnx`) + `classify(tensor) → Float32Array(10)`. 세션 생성·실행·에러 처리.
- **`lib/emotionMapping.ts`** (순수, TDD) — `map8ToEmotionResult(probs8: number[]) → EmotionResult`.
- **`lib/emotionAnalysis.ts`** (수정) — 오케스트레이션: `detectFaceBox` → 캔버스 크롭/리사이즈(224) → `toModelTensor` → `hsemotion.classify` → softmax(앞 8) → `map8ToEmotionResult`. 공개 API: `loadEmotionModels()`, `analyzeEmotion(video)`, `getDominantEmotion`(기존 유지). 미사용화되는 `normalizeExpressions`(+테스트)는 제거.

## 4. 모델 & 런타임

- 모델 파일: `enet_b0_8_va_mtl.onnx` — av-savchenko/hsemotion-onnx 계열에서 받아 `public/models/`에 둔다. 라이선스 **Apache-2.0**(학술·상업·번들 제한 없음).
- 출력: `[1, 10]` = `[8 emotion logits, valence, arousal]`. **앞 8개에 softmax** 적용해 확률화, 뒤 2개(V/A)는 이번엔 미사용.
- 8 클래스 순서(AffectNet): `Anger, Contempt, Disgust, Fear, Happiness, Neutral, Sadness, Surprise`.
- onnxruntime-web: `npm i onnxruntime-web`. WASM 자산을 `public/`에 복사하고 `ort.env.wasm.wasmPaths`를 그 경로로 설정(self-host). 세션은 앱 시작 시 1회 로드.

## 5. 전처리 (⚠️ 최대 정합성 리스크)

HSEmotion 학습 전처리와 **정확히 일치**해야 한다. 어긋나면 예측이 무의미해진다.

1. 검출 bbox로 비디오 프레임을 크롭(약간의 여백 포함) → 224×224 캔버스에 그림.
2. `getImageData()` → RGBA Uint8.
3. 각 픽셀을 **BGR 순서**로, 값 = `(channel/255 - mean[i]) / std[i]`, `mean=[0.485,0.456,0.406]`, `std=[0.229,0.224,0.225]` (인덱스 0→B, 1→G, 2→R 순으로 그대로 적용 — HSEmotion이 OpenCV BGR 입력에 이 mean/std를 쓰는 방식 그대로 재현).
4. 레이아웃 **NCHW** `[1,3,224,224]` Float32Array.

**검증 필수:** 구현 후 (a) 뚜렷한 표정(웃음/무표정/찡그림) 샘플로 예측이 상식적인지 수동 확인, 가능하면 (b) Python `hsemotion-onnx`로 같은 얼굴 이미지를 돌려 상위 클래스가 일치하는지 대조. (plan에 검증 태스크 포함.)

## 6. 8→4 매핑 (`emotionMapping.ts`, 순수·TDD)

`normalizeExpressions`의 철학(disgust→angry, 재정규화) 계승:

```
raw = {
  happy: P(Happiness),
  calm:  P(Neutral),
  sad:   P(Sadness) + P(Fear),
  angry: P(Anger) + P(Contempt) + P(Disgust),
}
// Surprise는 우리 4정서에 안 맞는 모호 정서 → 질량에서 제외(버림)
// raw 합으로 재정규화(합 1). raw 합이 0이면 { calm: 1, 나머지 0 } 폴백.
```

## 7. 로딩 · 에러 · 폴백

- `loadEmotionModels()` — face-api SSD + ort 세션 동시 로드. 어느 하나 실패 시 reject → 측정 페이지의 `modelStatus:'error'`로 표시(기존 패턴).
- 프레임: 얼굴 미검출 또는 추론 예외 → `null` 반환(기존 `tick` try/catch가 처리). 표정넷 폴백 없음(완전 교체).

## 8. 성능

EfficientNet-B0(WASM) ~20–60ms + SSD 검출 ~수십 ms < 500ms 주기. 문제 없음. (체감 느리면 추후 WebGPU/WebGL EP 검토 — 이번 비목표.)

## 9. 테스트 (TDD)

- **`emotionMapping`** (순수): 각 클래스→버킷 매핑, Fear→sad·Contempt/Disgust→angry, **Surprise 제외+재정규화**, 합=1, 전부 0 → calm 폴백.
- **`emotionPreprocess`** (순수): 알려진 1픽셀/소형 ImageData → BGR 순서 + 정규화 값 + NCHW 인덱싱 정확성.
- 검출·onnx 통합: 단위테스트 어려움 → `useEmotionRecorder`의 주입형 `analyze`로 우회(기존 테스트 유지), 실제 예측은 **수동 검증(run 스킬)**.
- 기존 `tests/lib/emotionAnalysis.test.ts`(normalizeExpressions)는 제거/대체.

## 10. 비목표 (Out of Scope)

- valence/arousal을 2축 지수·오브에 배선(향후 별도 이니셔티브).
- 얼굴 검출기 교체(face-api SSD 유지).
- 정확도 정량 벤치마크(데모 sanity 확인으로 갈음).
- WebGPU/WebGL 실행 백엔드(WASM로 시작).

## 11. 오픈 이슈 / 검증 필요

- **전처리 정합성**(BGR·mean/std 순서) — 구현 중 모델 실제 입력 규격으로 재확인(§5 검증).
- 모델 파일 정확한 출처 URL·크기 — 다운로드 시 확인(EfficientNet-B0 ONNX 대략 10~16MB 예상).
- onnxruntime-web WASM 자산 self-host 경로 설정(Next 16 + Turbopack에서 정적 서빙) — plan에서 구체화.
- face-api 의존 유지(검출용) — 추후 풀-onnx 단일런타임 전환은 별도 후보.
