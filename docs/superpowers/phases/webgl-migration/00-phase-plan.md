# Phase 1: WebGL/GLSL 셰이더 기반 Orb Rendering Migration

> **버전:** v2 (Open Questions 답변 반영). 본 문서가 학습 로드맵 / 프로토타입 spec / 본 마이그레이션 plan의 상위 기준이 된다.
>
> **작성일 (v1):** 2026-05-04
> **개정일 (v2):** 2026-05-04 (사용자 답변 반영)
> **선행 Phase:** Phase 0 — Living Orb + 톤 통합 + 단계 라벨 시스템 (진행 중, Task 19~20 직전)

---

## 1. Phase 개요

### 1.1 명칭

**Phase 1 — WebGL/GLSL Shader 기반 Orb Rendering Migration**

### 1.2 Phase 번호와 기존 Phase와의 관계

- **Phase 0 (선행, 진행 중):** Living Orb 시스템의 *기능적* 완성 — 데이터 매핑(4축 + edge softness), 단계 시스템(Empty/Awakening/Forming/Settled/Living), 라우트 통합, 라벨 알림, prefers-reduced-motion 정책, 톤 통합(라이트/다크). 시각 백엔드는 Canvas 2D(`ReactiveOrb`) + SVG(`LivingOrb`).
- **Phase 1 (본 문서):** *시각 백엔드의 교체*. Canvas 2D + SVG → Three.js + GLSL fragment shader (R3F 채택, §3.1). 데이터 흐름·정책·라우트 구조는 Phase 0의 결정을 그대로 따른다. 새 기능 도입이 아니라 **표현 매체 교체**.

### 1.3 한 줄 요약

> ONMAUM의 "살아있는 동반자" 컨셉을 시각적으로 진정성 있게 구현하기 위해, Canvas 2D + SVG 기반 Orb 렌더링을 react-three-fiber + GLSL fragment shader 기반 WebGL로 교체한다.

### 1.4 목적

ONMAUM의 핵심 컨셉은 *살아있는 동반자*다. 사용자의 감정 데이터가 Orb의 표면 디테일·내부 빛·유체 흐름·경계 흐림에 픽셀 단위로 매핑되어야 컨셉의 본질이 시각적으로 성립한다.

현재 구현(Canvas 2D + SVG)은:

- 그라디언트 stop의 이산적 변화로 표현이 *층진다*
- 표면 노이즈를 RAF 기반 좌표 흔들림으로 흉내낼 뿐, 표면 자체의 미세 결을 만들지 못한다
- 빛의 굴절·내부 빛·유체 흐름은 셰이더 없이는 근사 불가능하다
- 픽셀 단위 색 계산이 CPU 측이라 6축 동시 매핑 시 frame budget 한계

WebGL/GLSL은 이를 GPU 픽셀 단위 계산으로 옮긴다. 모션·빛·색·경계의 각 표현이 **연속적이고 동시적**이 된다.

### 1.5 성공 기준

§8에서 측정 방법으로 상세 정의. 요약:

1. **시각 진정성** — 디자인 의도 명세(영상 레퍼런스 5~10개 + 텍스트 명세 + 가능 시 스케치, §3.6) 대비 인지적 일치
2. **데이터-시각 매핑 정밀도** — 4축 + edge softness 6개 채널이 각각 시각 변수에 *분리 가능하게* 매핑되어야 함 (사용자가 한 축의 변화를 다른 축과 구분해 인지 가능)
3. **성능** — 데스크탑 60fps 안정, 미드레인지 모바일 30fps 안정 (구체 디바이스 §10 잔여)
4. **접근성** — `prefers-reduced-motion` 시 정적 1 프레임 (Phase 0 Task 19 정책 그대로)
5. **호환성** — §8.4의 브라우저 매트릭스
6. **코드 품질** — 셰이더 단위 분리, 컴포넌트 단일 책임, 회귀 테스트 가능 단위 분리

### 1.6 명시적 비목표 (Out of Scope)

- 새 데이터 축, 새 단계, 새 라우트 도입
- Phase 0의 데이터 매핑 정의 변경 (hue/opacity/motion/saturation/edge softness)
- 단계 전환 알림 정책 변경 (평생 1회, 상승만)
- A11y 정책 변경 (variant role, aria-label, reduced-motion)
- 기존 라우트 구조나 컴포넌트 호출부의 *외부 동작* 변경 (props 인터페이스는 보존, §2 옵션 2)
- *추가 효과* (파티클, 후처리 블룸 등)의 자율 도입 — 디자인 의도에 명시된 요소만

### 1.7 선결 조건 (Phase 1 시작 전 충족 필요)

Q15 답변 반영. Phase 1 본 작업 시작 전에 다음이 완료되어야 한다:

- Phase 0 Task 20 (LandingHero theme prop 전달 + 통합 검증) 완료 + commit
- Phase 0 미커밋 in-flight 파일군 cleanup 완료 — 다음 파일들의 commit 또는 폐기 결정:
  - modified: `components/ServiceWorkerRegistrar.tsx`, `hooks/useScrollReveal.ts`
  - untracked: `hooks/useTheme.ts`, `lib/orbAxes.ts`, `lib/orbStages.ts`, `lib/weeklyEmotion.ts` 및 대응 테스트 파일
- 깨끗한 git 상태 (working tree clean) 확인
- 이는 *이전 globals.css 미커밋 사고 반복 방지* 목적

학습(Sub-Phase A)은 §3.7 Q3/Q6 결정에 따라 Phase 0과 병행 시작 가능. **본 마이그레이션(Sub-Phase B 이후)은 위 선결 조건 충족 후 진입.**

---

## 2. 마이그레이션 전략

### 2.1 채택: 옵션 2 — 새 컴포넌트로 분리

`components/ReactiveOrbWebGL.tsx`, `components/LivingOrbWebGL.tsx`를 별도로 작성. 기존 `ReactiveOrb` / `LivingOrb`는 Sub-Phase D 종료까지 보존. 라우트별로 import만 교체하며 점진 전환.

**사용자 승인:** v1 검토 시 옵션 2 + "추상 레이어가 일시적 가짜 비용"이라는 분석에 동의.

### 2.2 채택 이유 (우선순위 순)

1. **점진성** — 학습 곡선 큰 기술이라 라우트별 검증·튜닝·확산이 가능해야 한다. 옵션 2만 자연스럽게 지원
2. **롤백 단순성** — `import` 한 줄. 셰이더 환경 의존성 + 모바일 GPU 차이 + SSR 호환성을 동시에 안고 가는 마이그레이션에서 빠른 되돌림은 비용이 아니라 자산
3. **fallback과의 정합** — WebGL 미지원/저성능 환경의 fallback이 *구 컴포넌트로의 다운그레이드*로 자연 정의된다 (§3.5)
4. **수렴 가능성** — Sub-Phase D 종료 시점(Q4 답)에 구 컴포넌트 삭제 = 옵션 1로 자연 수렴

### 2.3 비채택 옵션 (참고용)

- **옵션 1 (완전 교체):** 모든 라우트 동시 전환 부담. 한 PR로 전체 시각 시스템 영향. *위험도 높음*. 단, 본 Phase 종료 시점에 Sub-Phase D cleanup으로 옵션 1로 *수렴*함
- **옵션 3 (추상 레이어):** 본 Phase 목적이 *교체*인 한 dual-backend 추상화는 일시적 가짜 비용. 셰이더 디버그 시 React 추상화 레이어가 컨텍스트 스위치 가중

### 2.4 옵션 2의 한 가지 트레이드오프 명시 (Q4 결정의 함의)

Q4 답 = Sub-Phase D 종료 시점에 구 컴포넌트 삭제.

이 결정의 함의: **Sub-Phase E 폴리싱 단계에는 구 컴포넌트가 fallback으로 동작하지 않는다.** 즉 fallback 코드는 *Sub-Phase D 진입 전부터 신 컴포넌트 안에* 정의되어야 한다 (예: WebGL 미지원 시 정적 한 프레임 emit, 또는 신 컴포넌트의 fallback 모드).

옵션 2의 핵심 장점 중 하나(구 컴포넌트의 자연 fallback)는 D 종료까지만 유효. E 폴리싱은 *신 컴포넌트의 fallback 모드* 검증.

> **본 결정의 잠재 충돌 — 사용자 확인 필요:** Q4 사용자 답변에 "폴리싱 중에는 fallback 옵션 보존"이라는 문구가 있었는데, 이는 *구 컴포넌트로의 fallback*이 아니라 *신 컴포넌트 안에 정의된 fallback 모드 코드의 보존*으로 해석함. 만약 의도가 *구 컴포넌트 fallback도 E까지 보존*이었다면 Q4 답을 (b) Sub-Phase E 종료 시점으로 변경해야. **§10 잔여 항목 #1로 등록.**

---

## 3. 기술 스택 결정 사항

각 항목 v1에서 보류였으나 답변 반영해 결정. 잔여 항목은 §10에 정리.

### 3.1 라이브러리: react-three-fiber (R3F) — Q7 결정

**채택 이유:**
- React 생태계 자연 통합
- props → uniform 파이프라인이 R3F 패턴과 자연
- Three.js raw 대비 학습 곡선 낮음 (사용자 평가)

**학습 부담:** Three.js 코어 + R3F 두 층. §4에서 학습 항목 명시.

**Three.js raw 비채택:** 셰이더 학습기에는 명료할 수 있으나, 본 프로젝트는 React 기반이라 imperative 패턴이 코드베이스 일관성을 깨뜨림.

### 3.2 셰이더 작성 위치: 길이 기반 — Q9 결정

**규칙:**
- **50줄 이하:** 인라인 (TypeScript template literal)
- **50줄 초과:** 별도 `.glsl` 파일

**Sub-Phase B 프로토타입 셰이더 길이가 50줄 임계점 도달 시 결정 적용.** 임계점 도달 시 build 도구(`vite-plugin-glsl` 또는 webpack loader) Next.js 16 호환성 검증을 *그 시점에* 수행.

### 3.3 노이즈 처리: 셰이더 inline (Simplex) — Q10 결정

**채택:**
- 셰이더 안에 inline GLSL Simplex 노이즈 (Ashima/Stefan Gustavson 표준 코드)
- npm `simplex-noise` 의존성 추가 X

**이유:**
- GPU 픽셀 단위 계산이 본 Phase 목적
- ShaderToy 학습 자료 풍부 → 학습 가치 (§3.7 Q14 70/30)
- 외부 의존성 감소

### 3.4 성능 측정 도구: stats.js + Chrome DevTools 병용

v1 결정 그대로. 역할 분담:
- `stats.js`: in-app FPS overlay, 개발 중 즉시 확인
- Chrome DevTools Performance / Rendering tab: 병목 분석

### 3.5 모바일 fallback 전략 — Q11 결정

**다운그레이드 트리거:** 60fps 미만이 *5초 이상 지속* 시 fallback 활성화.

**감지 로직:**
- frame time을 sliding window(5초)로 측정
- 평균 frame time > 16.6ms (60fps 미만)이 5초 이상 유지 → fallback 모드 진입
- 정적 단계(reduced-motion) 또는 첫 frame 시간으로 빠른 사전 감지도 병행 (WebGL2 부재 시 즉시 fallback)

**사용자 알림:** 없음 (자연 폴백, 컨셉 충돌 방지).
- ONMAUM의 컨셉은 *조용한 동반자*. 성능 다운그레이드 알림이 컨셉을 깨뜨림
- 사용자는 fallback 모드를 인지하지 못한 채로도 Orb를 본다

**fallback 대상:**
- Sub-Phase D 종료 전까지: 구 컴포넌트 (`ReactiveOrb`/`LivingOrb`)
- Sub-Phase D 종료 후: 신 컴포넌트 안에 정의된 fallback 모드 (정적 한 프레임 또는 단순 셰이더 변형) — §2.4 트레이드오프

### 3.6 디자인 의도 구체화 방법 — Q1 결정

**조합 방식:**
- (a) **영상 레퍼런스 5~10개 수집** — Apple Siri, Spotify AI DJ, 명상 앱 등
- (b) **각 레퍼런스에서 가져올 시각 요소를 텍스트로 명세**
- (c) **가능하면 간단 스케치 추가** (필수 아님)

**산출 위치:** 학습 로드맵의 별도 sub-task. 학습 로드맵(`01-learning-roadmap.md`) 작성 시 *디자인 의도 구체화*를 명시적 sub-task로 포함.

**활용:**
- Sub-Phase B 입력
- §5.4 위험(디자인 의도와 결과물 차이) 완화의 1차 수단
- 시각 진정성 측정(§8.1)의 기준

**사용자 행동 필요:** 학습 로드맵 작성 후 사용자가 영상 후보 5~10개를 모음 (§10 잔여 항목 #2).

### 3.7 학습과 본 Phase 진행 — Q3 / Q6 / Q14 결정

- **도입 시점 (Q3):** Phase 0 (Task 20) 안정화 후 본 Phase 1 (Sub-Phase B 이후) 시작
- **학습 병행 (Q6):** 셰이더 학습은 Phase 0 진행 중 *하루 1~2시간 병행* 시작 가능
- **결과/학습 비중 (Q14):** 70/30 — 결과 추구 우선, 학습 가치도 진지하게 인정. 비관 시나리오에서 학습 가치 비중이 의사결정 변수

**4주차 페이스 평가 포인트:** 학습 시작 후 4주 시점에 진척도 평가. 미통과 시 Phase 진입 자체 재검토 (§5.1).

---

## 4. 학습 요구사항

본 Phase의 학습 단계(Sub-Phase A)에서 도달해야 할 수준. 학습 완료 시점이 Sub-Phase B 시작 전제 조건.

### 4.1 react-three-fiber (Q7 R3F 채택)

- `Canvas`, `useThree`, `useFrame`, primitives
- `Mesh`, `Material`, `Geometry`의 R3F 표현
- props → uniform 파이프라인
- Suspense 통합 패턴
- R3F의 SSR 처리 가이드 (Next.js 16 컨텍스트)

### 4.2 GLSL 셰이더 (fragment 중심)

- vertex / fragment shader 분리, 각각의 책임
- `uniform`, `varying`, `attribute` 차이
- `smoothstep`, `mix`, `fract`, `length`, `dot` 등 표준 함수
- UV 좌표계와 화면 좌표 변환
- precision qualifier (`highp` / `mediump` / `lowp`) — 모바일 영향

### 4.3 노이즈 함수 — Simplex inline (Q10)

- 2D / 3D simplex 노이즈 inline GLSL 구현 (Ashima/Stefan Gustavson 코드 이해)
- 시간 축 추가로 흐름 표현 (`vec3(uv, time)`)
- 옥타브 합성 (FBM — Fractal Brownian Motion)
- 노이즈 → 표면 결, 노이즈 → 유체 흐름의 매핑 패턴

### 4.4 WebGL 성능 최적화 패턴

- 드로우 콜 최소화, 단일 fullscreen quad 패턴
- uniform 업데이트 빈도 (frame당 vs n frame당)
- texture 재사용 vs 재생성 비용
- precision 영향 (특히 모바일 GPU)
- VRAM 한계와 textureSize

### 4.5 SSR 환경에서의 WebGL 처리

- Next.js 16의 `'use client'` + `dynamic(() => import(...), { ssr: false })`
- Hydration 시 placeholder 처리
- 첫 paint와 WebGL canvas 등장의 시간차 처리
- AGENTS.md의 "This is NOT the Next.js you know" 경고 준수 — 패턴 검증 필수

### 4.6 디자인 의도 구체화 — Q1 (병행 sub-task)

학습 진행과 병행으로 영상 레퍼런스 5~10개 수집 + 텍스트 명세 작성. 학습 로드맵에서 별도 sub-task로 분해.

**학습 산출물:** Sub-Phase A 종료 시점에:
- 학습 노트 (별도 문서)
- 핵심 패턴 정리
- 작은 실험 코드 스니펫
- 디자인 의도 명세 (영상 레퍼런스 + 텍스트 + 스케치)

**본 마이그레이션 코드와 분리 보존.**

---

## 5. 위험 평가

솔직한 평가. "괜찮을 것 같다" 류 낙관 배제.

### 5.1 학습 곡선으로 인한 일정 지연

- **발생 가능성:** 높음
- **영향도:** 중간~높음
- **이유:** 셰이더 + R3F 두 층 학습. 시각 디테일까지 도달하려면 단순 hello-world 이상의 숙련 필요
- **대응 전략:**
  - Sub-Phase A를 별도 단계로 분리 + Phase 0 진행 중 하루 1~2시간 병행 시작 (§3.7)
  - **4주차 평가 포인트:** 학습 시작 후 4주 시점에 §4 self-check 통과 평가. 미통과 시 Phase 진입 자체 재검토
  - 일정 추정에 비관 시나리오 포함 (§7)

### 5.2 셰이더 디버깅 어려움

- **발생 가능성:** 중간
- **영향도:** 중간
- **이유:** GLSL은 `console.log` 없음, 색을 출력 디버그 수단으로 써야 함. 분기·NaN·precision 문제는 시각적으로만 드러남
- **대응 전략:**
  - ShaderToy 같은 외부 환경에서 단위 셰이더 검증 후 본 코드 이식
  - Chrome WebGL Inspector / Spector.js 활용
  - "디버그 출력 모드" 셰이더 변형 (uniform 별로 RGB 출력) 패턴화

### 5.3 모바일 성능 부족

- **발생 가능성:** 높음
- **영향도:** 높음
- **이유:** 모바일 GPU는 데스크탑 대비 수십~수백 배 느릴 수 있음. precision 강제, fragment 호출 수 (해상도) 영향 큼
- **대응 전략:**
  - fallback 전략 — 60fps 미만 5초 지속 시 자동 다운그레이드 (§3.5)
  - 모바일 path 변형: 옥타브 수 감소 / precision 다운 / 해상도 다운
  - **학습 단계부터 실제 디바이스 테스트** (사용자 답변 — 학습 단계 환경 setup 포함)
  - Sub-Phase C 검증에 모바일 디바이스 실측 포함 (§10 잔여 #3 — 기준 디바이스 결정 필요)

### 5.4 디자인 의도와 결과물 차이

- **발생 가능성:** 높음
- **영향도:** 중간
- **이유:** 셰이더는 표현 자유도가 큼 → "어디까지가 의도인지" 불명확하면 무한 튜닝
- **대응 전략:**
  - 디자인 의도 구체화 (§3.6) — 영상 레퍼런스 + 텍스트 명세 + 스케치 조합
  - 매 sub-phase 종료 시점에 의도 대비 시각 리뷰
  - 의도 명세를 문서로 보존해 후속 튜닝 시 기준 유지
  - 외부 디자이너 리뷰 가능 시 활용 (§10 잔여 #4)

### 5.5 접근성 보장 (특히 prefers-reduced-motion)

- **발생 가능성:** 낮음
- **영향도:** 높음
- **이유:** Phase 0 Task 19에서 정책 수립. WebGL에서도 동일 정책 구현 필요
- **대응 전략:**
  - Phase 0 Task 19와 동일 정책: `prefers-reduced-motion` 시 정적 1 프레임
  - 셰이더 안에 `if (u_reducedMotion) { time = 0.0; }` 또는 RAF 1회 후 종료
  - 자동 회귀 검증: e2e 테스트에서 reduced-motion 강제 후 frame 수 측정

### 5.6 SSR 호환성 문제

- **발생 가능성:** 중간
- **영향도:** 중간
- **이유:** Next.js 16에서 WebGL은 클라이언트 전용. 잘못된 import / SSR 처리 시 hydration mismatch 또는 build 실패
- **대응 전략:**
  - 모든 WebGL 컴포넌트는 `dynamic(..., { ssr: false })`로 import
  - 첫 paint placeholder는 정적 한 프레임 또는 빈 div
  - Next.js 16 dynamic 패턴 검증 (AGENTS.md 경고 준수)

### 5.7 개발 도구 체인 변경 위험

- **발생 가능성:** 중간 (Q9의 50줄 임계점 도달 시점에)
- **영향도:** 낮음
- **이유:** `.glsl` 파일 처리(Q9 분리 결정 시) Next.js 16 호환성 미확인. 빌드 도구 추가 시 부작용 가능
- **대응 전략:**
  - 인라인 셰이더로 시작 (Q9 임계점 도달 전)
  - 임계점 도달 시 그 시점에 Next.js 16 공식 문서/이슈 검색 후 결정

---

## 6. 단계 분할 (Sub-Phase 구조)

각 Sub-Phase는 입력 / 산출물 / 종료 조건이 명확. 다음 단계 진입은 종료 조건 충족 시.

### 6.1 Sub-Phase A — 학습

- **시작 시점:** Phase 0 진행 중 병행 시작 가능 (Q3 / Q6 결정)
- **입력:** 본 기획 문서 승인, 학습 로드맵 (`01-learning-roadmap.md`) 작성 완료
- **산출물:**
  - 학습 노트
  - 핵심 패턴 정리
  - 실험 코드 스니펫
  - 디자인 의도 명세 (영상 5~10개 + 텍스트 + 스케치, §3.6)
- **종료 조건:**
  - §4.1~4.5 self-check 통과
  - 디자인 의도 명세 1차 완성
- **4주차 평가 포인트:** 학습 시작 4주 시점에 페이스 재평가 (Phase 진입 재검토 가능, §5.1)

### 6.2 Sub-Phase B — 프로토타입

- **시작 시점:** Phase 0 종료 + 미커밋 cleanup 완료 + Sub-Phase A 종료 (§1.7 선결 조건)
- **위치:** `/lab/orb-v2` (Q5/Q12 결정)
- **입력:** Sub-Phase A 산출물 (학습 + 디자인 의도 명세)
- **산출물:**
  - `/lab/orb-v2`에서 동작하는 ReactiveOrb 1개 셰이더 구현 (R3F + GLSL inline)
  - 4축 + edge softness 매핑 동작
- **종료 조건:**
  - 6 채널 매핑이 시각적으로 분리 가능
  - 데스크탑 60fps 안정
  - 디자인 의도와의 일치도 1차 평가 통과
  - **셰이더 길이 50줄 초과 시 Q9에 따라 별도 `.glsl` 파일로 분리**
- **참고:** ReactiveOrb 먼저 (큰 구, 학습 곡선 통과). LivingOrb는 Sub-Phase D에서.

### 6.3 Sub-Phase C — 검증

- **입력:** Sub-Phase B 산출물, 기준 디바이스 (§10 잔여 #3)
- **산출물:** 검증 리포트 — 시각/성능/접근성/호환성 각각의 측정 결과 + go/no-go 결정
- **종료 조건:**
  - 모든 성공 기준(§1.5) 1차 통과
  - go 결정 시 Sub-Phase D 진입 / no-go 시 Sub-Phase B 재작업 또는 Phase 종료

### 6.4 Sub-Phase D — 본 마이그레이션

- **입력:** Sub-Phase C go 결정
- **산출물:**
  - `components/ReactiveOrbWebGL.tsx` (랜딩 hero 큰 구)
  - `components/LivingOrbWebGL.tsx` (앱 영역 우상단 작은 구) — Q2 둘 다 채택
  - 라우트별 import 교체:
    - `/` (LandingHero) → `ReactiveOrbWebGL` import
    - 비랜딩 페이지의 `LivingOrbHost` → `LivingOrbWebGL` import
    - `/orb` 페이지 (단계 라벨 시스템) → `LivingOrbWebGL` (variant primary)
  - LivingOrbWebGL의 5단계 시스템·variant·data-attribute 보존 (Phase 0 결정)
  - **신 컴포넌트 안에 fallback 모드 정의** (구 컴포넌트는 D 종료 시 삭제되므로, §2.4 트레이드오프)
  - **Sub-Phase D 종료 commit:** `components/ReactiveOrb.tsx` + `components/LivingOrb.tsx` 삭제 (Q4 결정)
- **종료 조건:**
  - 모든 라우트에서 WebGL 버전 정상 동작
  - 회귀 테스트 통과 (Phase 0의 데이터 매핑 / 단계 시스템 / 라벨 알림 모두 그대로)
  - fallback 모드 코드가 신 컴포넌트 안에 정의됨

### 6.5 Sub-Phase E — 폴리싱

- **입력:** Sub-Phase D 산출물 (구 컴포넌트는 이 시점에 이미 삭제됨)
- **산출물:**
  - fallback 모드 검증 (60fps 미만 5초 지속 트리거, §3.5)
  - 모바일 path 튜닝 (옥타브 / precision / 해상도)
  - A11y 최종 검증 (reduced-motion, screen reader, 색 대비)
  - 문서 정리 (셰이더 주석, 컴포넌트 인터페이스 doc)
- **종료 조건:**
  - §8 모든 측정 통과
  - 코드 리뷰 통과 (Critical/Important 이슈 0)

---

## 7. 일정 추정

학습 곡선 큰 기술 + Q3/Q6 학습 병행 + Q14 70/30 결과 우선 반영.

### 7.1 일정 산정 모델

- **Sub-Phase A 학습:** Phase 0과 병행. 하루 1~2시간 × 주 5일 = 주당 ~10시간. Phase 0 종료 시점에 학습 진척도가 *어디까지 와 있는지*에 따라 Sub-Phase A 잔여 시간이 결정됨
- **Sub-Phase B~E:** Phase 0 종료 후 단독 진행. 1일 = 집중 작업 4~6시간 가정

### 7.2 시나리오별 일정 (Phase 0 종료 시점부터 측정)

| Sub-Phase | 낙관 (학습 술술) | 현실 (일반 막힘) | 비관 (큰 막힘) |
|---|---|---|---|
| A 학습 잔여 | 0주 (Phase 0 중 완료) | 1주 | 3주 |
| B 프로토타입 | 1주 | 2주 | 4주 |
| C 검증 | 3일 | 1주 | 2주 |
| D 본 마이그레이션 | 1주 | 2주 | 4주 |
| E 폴리싱 | 3일 | 1주 | 2주 |
| **Phase 1 합계** | **약 2.5주** | **약 7주** | **약 15주** |

### 7.3 평가 포인트

- **학습 4주차:** 진척도 평가 (Phase 0 진행 중). 미통과 시 Phase 진입 자체 재검토
- **Sub-Phase B 종료:** 디자인 의도 1차 매칭 평가. 비관 시나리오 진입 신호 시 Q14의 학습 가치 비중(30%) 고려한 의사결정 (Phase 종료 후 발표 자료에 학습 흔적 솔직히 공개)
- **Sub-Phase C 종료:** go/no-go 결정 — no-go 시 Phase 종료 가능성 인정

---

## 8. 성공 기준 측정 방법

### 8.1 시각 진정성

- **측정:** 디자인 의도 명세(§3.6) 대비 인지적 일치
- **방법:** 사용자(본인) 시각 리뷰 + §10 잔여 #4(외부 디자이너 리뷰 가능성) 확정 시 외부 리뷰
- **통과 기준:** 의도 명세의 핵심 요소(표면 결 / 내부 빛 / 유체 흐름 / 경계 흐림) 4가지가 모두 인지 가능

### 8.2 성능

- **측정:** 60fps (데스크탑) / 30fps 이상 (미드레인지 모바일) 안정 유지
- **방법:** stats.js + Chrome DevTools Performance, 30초 측정 평균
- **통과 기준:** 평균 frame time < 16.6ms (60fps) 데스크탑 / < 33.3ms (30fps) 모바일. p95 frame time도 임계값 내
- **fallback 트리거:** 60fps 미만 5초 지속 시 활성화 (§3.5)
- **기준 디바이스:** §10 잔여 #3에서 결정

### 8.3 접근성

- **측정:** `prefers-reduced-motion: reduce` 강제 시 정적 1 프레임
- **방법:** OS 설정 또는 browser devtools에서 강제 → 30초간 frame 변화 측정
- **통과 기준:** frame 변화 없음, RAF 호출 0회 이상 (mount 후 1회 후 종료)

### 8.4 호환성

- **측정 매트릭스:**
  - 데스크탑: 최신 2버전 Chrome / Safari / Firefox / Edge
  - 모바일: iOS Safari 16+ / Android Chrome 110+
  - WebGL2 미지원 환경: fallback 동작 확인
- **방법:** 각 브라우저에서 골든 패스 시각 검증
- **통과 기준:** 각 브라우저에서 정상 동작 또는 정의된 fallback 동작

### 8.5 코드 품질

- **측정:**
  - 셰이더 코드: 단위 분리 (vertex / fragment 분리, 노이즈 함수 분리, 메인 셰이더 함수 분리)
  - 컴포넌트: 단일 책임 (`*WebGL.tsx`는 렌더만, 데이터 매핑은 `useLivingOrb` 등 기존 hook 그대로)
  - 테스트: 데이터 매핑 hook은 단위 테스트 유지 (시각 컴포넌트 자체는 visual regression 또는 수동 검증)
- **방법:** 코드 리뷰 (외부 reviewer agent + 사용자 직접)
- **통과 기준:** Critical / Important 이슈 0개

---

## 9. 다음 단계 (이번 작업 후)

본 v2 문서 commit 후 진행할 작업:

### 9.1 즉시 다음 작업

**`docs/superpowers/phases/webgl-migration/01-learning-roadmap.md`**

학습 로드맵. 다음을 포함:

- §4의 5개 영역(R3F / GLSL / 노이즈 / 성능 / SSR)을 주차/항목별로 분해
- **디자인 의도 구체화 sub-task** (영상 레퍼런스 5~10개 수집 + 텍스트 명세 + 스케치, §3.6)
- **기준 디바이스 결정 후 학습 환경 setup sub-task** (§10 잔여 #3 답변 후)
- **실제 디바이스 테스트 환경 구축** (학습 단계부터)
- 4주차 평가 체크리스트 (§5.1)

**시작 조건:** §10 잔여 #3 (기준 디바이스) 답변 후. 그 답을 학습 환경 setup에 직접 반영.

### 9.2 후속 placeholder

작성 시점: 해당 Sub-Phase 진입 직전.

- **`docs/superpowers/phases/webgl-migration/02-prototype-spec.md`**
  Sub-Phase B 프로토타입 spec. ReactiveOrb 1개 셰이더 명세, 4축 + edge softness 매핑 정의, `/lab/orb-v2` 라우트, 동작 기준
- **`docs/superpowers/phases/webgl-migration/03-implementation-plan.md`**
  Sub-Phase D 본 마이그레이션 plan. ReactiveOrbWebGL + LivingOrbWebGL task 단위 분해

---

## 10. 잔여 결정 항목 (사용자 추가 답변 필요)

본 v2에서도 결정 못 한 항목. 학습 로드맵 작성 / 학습 진행 / 프로토타입 진입 시점에 답변 필요.

### #1. Q4 의도 재확인 — Sub-Phase E 폴리싱 중 fallback 의미

**상황:** Q4 답에 "Sub-Phase D 종료 시점 / 폴리싱 중에는 fallback 옵션 보존"이라는 두 줄이 함께 있음. §2.4에서 이를 "신 컴포넌트 안의 fallback 모드 코드 보존"으로 해석.

**확인 필요:**
- (a) 신 컴포넌트 안의 fallback 모드 코드 보존 의미 (현재 해석)
- (b) 구 컴포넌트도 E 종료까지 보존 — Q4 답을 (b) Sub-Phase E 종료로 수정

**우선순위:** 중간 (Sub-Phase D 진입 전 결정 필요).

### #2. Q1 디자인 의도 — 영상 레퍼런스 후보

**상황:** §3.6에서 *방식*은 결정(영상 5~10개 + 텍스트 + 스케치). 구체 후보는 미정.

**필요:**
- 사용자가 본 적 있는 인상적 시각 사례 (Apple Siri, Spotify AI DJ, 명상 앱 등)
- 5~10개 후보 영상/이미지 (URL 또는 설명)

**우선순위:** 높음 (학습 로드맵 디자인 의도 sub-task 입력).

**시점:** 학습 로드맵 작성 후 사용자가 직접 수집.

### #3. Q8 기준 디바이스 — 모바일 성능 측정용

**상황:** §5.3 / §8.2와 직결.

**필요:**
- 사용자 본인이 가진 폰 모델
- 추가 디바이스: iPhone, 가능하면 갤럭시
- 학습 단계부터 실제 디바이스 테스트

**우선순위:** 높음 (학습 환경 setup의 입력).

### #4. Q13 외부 디자이너 리뷰 가능성

**상황:** §5.4 위험 완화 + §8.1 측정 방법과 직결.

**필요:**
- 주변에 외부 디자이너 리뷰 가능한 사람 유무
- 가능 시 리뷰 빈도 / 형식 (매 sub-phase / Phase 종료 / 단발)

**우선순위:** 중간 (Sub-Phase B 종료 시점에 처음 활용 가능).

---

## 11. 결정 요약 (Q1~Q15 답변 반영)

본 v2에 반영된 결정 사항 한눈에:

| 항목 | 결정 | 위치 |
|---|---|---|
| Q1 디자인 의도 구체화 | 영상 5~10개 + 텍스트 + 스케치 | §3.6 |
| Q2 마이그레이션 범위 | 둘 다 (ReactiveOrb 먼저, LivingOrb 후속) | §1.6, §6.4 |
| Q3 도입 시점 | Phase 0 직후 시작, 학습은 병행 | §3.7, §6.1 |
| Q4 기존 코드 삭제 | Sub-Phase D 종료 시점 (잠재 충돌 §10 #1) | §2.4, §6.4 |
| Q5 프로토타입 위치 | 본 프로젝트 내 별도 라우트 | §6.2 |
| Q6 학습 병행 | Phase 0 진행 중 하루 1~2시간 | §3.7 |
| Q7 라이브러리 | react-three-fiber | §3.1 |
| Q8 기준 디바이스 | **잔여 #3** | §10 |
| Q9 셰이더 위치 | 50줄 임계 (이하 인라인 / 초과 분리) | §3.2 |
| Q10 노이즈 | 셰이더 inline Simplex | §3.3 |
| Q11 fallback | 60fps 미만 5초 지속 / 알림 X | §3.5 |
| Q12 라우트 이름 | `/lab/orb-v2` | §6.2 |
| Q13 외부 디자이너 | **잔여 #4** | §10 |
| Q14 결과/학습 비중 | 70/30 | §3.7 |
| Q15 미커밋 정리 | Phase 1 진입 전 cleanup | §1.7 |

---

## 12. 참고 — Phase 0 결정 보존 (변경 X)

본 Phase에서도 그대로 따른다. 충돌 발견 시 §10 잔여 항목에 보고 후 사용자 결정.

- ReactiveOrb (랜딩 hero 큰 구) + LivingOrb (앱 영역 우상단 작은 구) 둘 다 유지
- 랜딩 = 다크 강제 / 앱 = 라이트/다크 토글
- 5단계 메이저 시스템 (Empty / Awakening / Forming / Settled / Living)
- 4축(hue / opacity / motion / saturation) + edge softness 매핑
- 단계 전환 알림 정책 — 평생 1회, 상승만, 3.6초 노출
- prefers-reduced-motion 처리 — 정적 1 프레임 (Phase 0 Task 19에서 정의)
- 구 전용 화면 (`/orb`) — 단계 라벨 시스템 plan에서 도입
- 게임화 금지 / "조용한 동반자" 컨셉 (§3.5 fallback 알림 X 결정의 근거)
- 위장 모드 컨셉 (시스템 푸시 영구 제외)

---

*문서 끝. 다음 작업: §10 잔여 #3 (기준 디바이스) 답변 후 `01-learning-roadmap.md` 작성 진입.*
