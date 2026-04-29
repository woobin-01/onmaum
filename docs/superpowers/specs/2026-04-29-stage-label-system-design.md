# Living Orb 단계 라벨 일시 표시 시스템 — 설계 문서

작성일: 2026-04-29
브랜치: `feature/living-orb-and-tone`
관련 plan: `docs/superpowers/plans/2026-04-28-living-orb-and-tone.md`

## 1. 목적

ONMAUM Living Orb의 단계가 한 번 오를 때, 한국어 라벨이 구 옆에 잠깐 나타났다 사라진다.

영구 표시도 아니고 완전 숨김도 아니다. "조용한 동반자"가 의미 있는 순간에만 자기 변화를 알리는, 일시적 시각/청각 피드백.

이 문서는 기존 plan의 Task 11(`useMilestone`) + Task 12(`MilestoneToast`)를 대체하고, Task 9(`LivingOrb`) + Task 10(`LivingOrbHost`)을 수정한다.

## 2. 컨셉

- "당신의 시간이 쌓였어요" 톤. 게임화 표현 금지 (축하·달성·보상·업적 X).
- 시스템 푸시 알림 영구 제외 — "위장 모드" 컨셉과 정면 충돌하기 때문.
- 평생 1회만 등장 — 한 단계는 평생 한 번만 라벨이 뜬다. 단계 하강해도 다시 안 뜬다.

## 3. 표시 정책

- **트리거**: 메이저 단계 상승 (`Empty → Awakening → Forming → Settled → Living`). 단계 정의는 기존 `lib/orbStages.ts`의 `OrbStage` 따름.
- **상승만** — 하강 시 라벨 표시 X.
- **평생 1회** — `localStorage.onmaum_orb_stage_max`로 기록. 이미 도달한 단계 재진입 시 라벨 X.
- **Empty로의 전환** → 라벨 X (메시지 자체 없음).
- **빠른 연속 상승** (현실적으로 거의 발생 X — 단계 간격이 매우 김) → 이전 라벨 즉시 종료 후 새 라벨 시작.

## 4. 시각 디자인

- **표시 시간**: 총 3.6초
  - 페이드인 300ms
  - 완전 표시 유지 2700ms
  - 페이드아웃 600ms
- **위치**: 구 옆 (가로 배치). LivingOrbHost가 LivingOrb와 StageLabel을 `inline-flex`로 나란히 배치.
- **폰트 크기**: 본문보다 살짝 작게 (12px, 본문 14px 기준). `text-[var(--fg-muted)]` 톤.
- **prefers-reduced-motion**: 페이드 효과 제거. 즉시 표시/사라짐.

## 5. 단계별 메시지 카피

```ts
// lib/stageLabels.ts
const STAGE_LABEL_MESSAGES: Partial<Record<OrbStage, string>> = {
  awakening: '감정 오브가 깨어났어요',
  forming: '결이 보이기 시작했어요',
  settled: '조금 더 또렷해졌어요',
  living: '당신과 함께 살아가요',
}
```

`empty` 키는 정의하지 않는다 (Empty 전환 시 메시지 없음).

## 6. 접근성

- StageLabel 요소: `role="status" + aria-live="polite"` (별도 span 분리, SR이 라벨만 자연스럽게 announce).
- LivingOrb SVG: variant에 따라 분기
  - `decoration` (default — 우상단 호스트 사용처) → `role="presentation" + aria-hidden="true"`. SR 무시.
  - `primary` (`/orb` 페이지 등 큰 구) → `role="img"` + 한국어 `aria-label`. 영구 표시.
- 라벨이 visible=false일 때 DOM에서 제거 (조건부 렌더링) — aria-live가 새 텍스트 등장으로 인식.

## 7. 인터페이스

### `lib/stageLabels.ts`

```ts
import type { OrbStage } from './orbStages'

// 단계 상승 시 일시 표시되는 동반자 톤 메시지 (Empty 제외 = 4종)
// Readonly<Partial<...>> — partial map 이라 동적 인덱싱과 immutable 둘 다 필요
export const STAGE_LABEL_MESSAGES: Readonly<Partial<Record<OrbStage, string>>> = {
  awakening: '감정 오브가 깨어났어요',
  forming: '결이 보이기 시작했어요',
  settled: '조금 더 또렷해졌어요',
  living: '당신과 함께 살아가요',
}

// LivingOrb variant="primary"의 영구 aria-label에 사용 (Empty 포함 = 5종) — orbStages.ts STAGE_MESSAGES 패턴
export const STAGE_KOREAN_NAMES = {
  empty: '비어있음',
  awakening: '깨어남',
  forming: '형성 중',
  settled: '안정',
  living: '살아있음',
} as const satisfies Record<OrbStage, string>

export function getStageLabelMessage(stage: OrbStage): string | null {
  return STAGE_LABEL_MESSAGES[stage] ?? null
}
```

### `hooks/useStageLabel.ts`

```ts
'use client'

export interface StageLabelOutput {
  visible: boolean
  message: string | null
}

export function useStageLabel(currentStage: OrbStage): StageLabelOutput
```

내부 동작:
1. `useEffect`로 `currentStage` 변경 감지.
2. localStorage `onmaum_orb_stage_max` 읽기 (기존 `useMilestone` 키 재사용).
3. `isStageHigher(currentStage, prevMax)`이고 `getStageLabelMessage(currentStage) !== null`이면:
   - 이전 타이머가 있으면 clear (빠른 연속 변경 대응)
   - localStorage 갱신
   - `setVisible(true)`, `setMessage(...)`
   - `setTimeout(() => setVisible(false), VISIBLE_MS)` 등록
4. cleanup에서 타이머 clear.

**타이밍 상수**:

```ts
const FADE_IN_MS = 300
const HOLD_MS = 2700
const FADE_OUT_MS = 600
const VISIBLE_MS = FADE_IN_MS + HOLD_MS // = 3000ms (visible=false 트리거 시점)
// 페이드아웃은 CSS transition이 처리, 총 사라짐 완료는 VISIBLE_MS + FADE_OUT_MS = 3600ms
```

훅이 `setTimeout(VISIBLE_MS=3000)` 후 visible=false → CSS transition 600ms 페이드아웃 → 트리거 시점 기준 3.6초에 완전 사라짐.

### `components/StageLabel.tsx`

```tsx
'use client'

interface Props {
  visible: boolean
  message: string | null
  className?: string
}

export default function StageLabel({ visible, message, className }: Props) {
  if (!message) return null
  return (
    <span
      role="status"
      aria-live="polite"
      data-visible={visible}
      className={className /* CSS로 페이드 처리, [data-visible="true"]일 때 opacity:1 */}
    >
      {message}
    </span>
  )
}
```

### `components/LivingOrb.tsx` (수정)

기존 props에 `variant` 추가:

```tsx
interface Props {
  stage: OrbStage
  opacity: number
  hue: string
  saturation: number
  motion: number
  size?: number
  className?: string
  variant?: 'decoration' | 'primary'   // default: 'decoration'
}
```

- `useId()`로 gradient/filter ID 생성 (모듈-레벨 `idCounter` 폐기 — Task 9 fix).
- variant 분기:
  - `decoration` → `<svg role="presentation" aria-hidden="true" ...>`
  - `primary` → `<svg role="img" aria-label="감정 오브 — ${STAGE_KOREAN_NAMES[stage]}" ...>`
  - `STAGE_KOREAN_NAMES`는 5단계 모두 매핑 (`empty: '비어있음'`, `awakening: '깨어남'`, `forming: '형성 중'`, `settled: '안정'`, `living: '살아있음'`) — `lib/stageLabels.ts`에 `STAGE_LABEL_MESSAGES`와 함께 정의.

### `components/LivingOrbHost.tsx` (수정)

```tsx
export default function LivingOrbHost() {
  const { liveEmotion, active } = useLivingOrbInput()
  const { stage, axes } = useLivingOrb({ liveEmotion, active })
  const { visible, message } = useStageLabel(stage)

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-40 md:right-8 md:top-8 inline-flex items-center gap-2.5">
      <StageLabel visible={visible} message={message} />
      <LivingOrb
        stage={stage}
        opacity={axes.opacity}
        hue={axes.hue}
        saturation={axes.saturation}
        motion={axes.motion}
        size={56}
        variant="decoration"
      />
    </div>
  )
}
```

## 8. CSS

`components/StageLabel.css` (컴포넌트 전용) — `app/globals.css`가 다른 plan(Task 4)의 미커밋 변경을 안고 있어, 이번 시스템의 CSS는 컴포넌트 레벨로 분리. `StageLabel.tsx`가 직접 `import './StageLabel.css'`. 페이드 keyframes:

```css
.stage-label {
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
  white-space: nowrap;
}
.stage-label[data-visible="true"] {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease-in, transform 300ms ease-in;
}
@media (prefers-reduced-motion: reduce) {
  .stage-label,
  .stage-label[data-visible="true"] {
    transition: none;
    transform: none;
  }
}
```

타이밍: `data-visible`이 true가 되면 300ms 페이드인. 2700ms 후 useStageLabel이 visible=false 로 전환 → 600ms 페이드아웃. 그 후 컴포넌트가 unmount(message=null) 또는 opacity=0 상태 유지.

## 9. 에러 / 엣지

| 케이스 | 처리 |
|---|---|
| `getStageLabelMessage(stage)` → `null` | 라벨 미표시 (`StageLabel`이 `null` 반환) |
| localStorage 접근 실패 (private mode 등) | try/catch 무음. 세션 내 라벨은 표시되지만 영구 저장 X (다음 마운트 시 다시 뜰 수 있음 — acceptable) |
| 잘못된 localStorage 값 (예: `'banana'`) | `STAGE_ORDER`에 없는 값 → empty로 간주 (기존 `useMilestone` 동작 그대로) |
| 단계 하강 (예: forming → empty) | localStorage 그대로, visible=false 유지 |
| `prefers-reduced-motion: reduce` | CSS `@media`로 transition 제거 |
| variant 미지정 | default `decoration` |
| message 없는데 visible=true | `StageLabel`이 `null` 반환 (방어) |

## 10. 테스트 범위

| 파일 | 검증 |
|---|---|
| `tests/lib/stageLabels.test.ts` | 4단계 매핑 + `empty`/잘못된 입력 → `null` |
| `tests/hooks/useStageLabel.test.ts` | 상승 감지, 3.6초 타이머, localStorage 갱신, 빠른 연속 변경 시 즉시 교체, 하강 무시, 평생 1회 (재마운트 시 동일 stage 라벨 X), localStorage 실패 graceful |
| `tests/components/StageLabel.test.tsx` | message=null 시 렌더 X, message 있을 때 텍스트 + aria-live, data-visible 속성 |
| `tests/components/LivingOrb.test.tsx` | 기존 5개 + variant=decoration → role/aria-hidden, variant=primary → role="img" + aria-label, useId 사용 검증 (id 형식만) |
| `tests/integration/LivingOrbHost.integration.test.tsx` | DB에 record 추가 → stage 상승 → 라벨 등장 → 3.6초 후 사라짐 전체 흐름 |

## 11. Plan 영향

| 기존 Task | 처리 |
|---|---|
| Task 9 (LivingOrb) | **수정** — variant prop, useId, role/aria-hidden 분기. 이전 fix(Critical) 흡수. |
| Task 10 (LivingOrbHost) | **수정** — StageLabel inline-flex 배치 추가. |
| Task 11 (useMilestone) | **폐기** — useStageLabel로 대체. localStorage 키만 흡수. |
| Task 12 (MilestoneToast) | **폐기** — StageLabel로 대체. 시스템 푸시 영구 제외. |
| (신규) | `lib/stageLabels.ts`, `hooks/useStageLabel.ts`, `components/StageLabel.tsx` + 각 테스트 + 통합 테스트 + globals.css 페이드 keyframes. |

## 12. Out of Scope

- 사용자 설정 표시 시간 (빠르게/보통/길게/끄기) → v2
- 첫 가입 시 환영 메시지 (Empty 상태) → v2
- 같은 단계 메시지 변주 (랜덤) → v2
- 푸시 알림 → 영구 제외 (위장 모드 컨셉과 충돌)

## 13. 결정 미정 → 결정 완료 (2026-04-29)

| 항목 | 결정 |
|---|---|
| 라벨 위치 | 구 옆 (가로) |
| 폰트 크기 | 본문보다 살짝 작게 (12px) |
| 빠른 연속 변경 | 이전 라벨 즉시 종료 후 새 라벨 |
| localStorage 키 | 기존 `onmaum_orb_stage_max` 재사용 |
| variant default | `decoration` |
| 테스트 위치 | 기존 `tests/` 패턴 (spec의 `__tests__/` 미채택) |
| 디렉토리 | flat 유지 (`lib/orb/` 서브디렉토리 도입 X) |
| 타입 케이스 | 기존 `OrbStage` (소문자) 유지 (`MajorStage` 미도입) |
