# Living Orb 단계 라벨 일시 표시 시스템 — 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Living Orb 단계가 한 번 오를 때 한국어 라벨이 구 옆에 3.6초간 등장 후 사라지는 시스템 구축. 기존 plan의 Task 11(`useMilestone`) + Task 12(`MilestoneToast`) 폐기, Task 9/10에 variant prop·useId·StageLabel 통합.

**Architecture:** `useStageLabel(stage)` 훅이 stage 상승을 감지하고 (localStorage `onmaum_orb_stage_max` 기반 평생 1회 정책) 3000ms 동안 visible=true 유지. CSS transition(300/600ms)으로 페이드인/아웃 처리. `StageLabel` 컴포넌트는 `role="status" + aria-live="polite"`로 SR에 자연스럽게 announce. `LivingOrbHost`가 LivingOrb와 StageLabel을 inline-flex로 가로 배치.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, Vitest + happy-dom + @testing-library/react.

**관련 spec:** `docs/superpowers/specs/2026-04-29-stage-label-system-design.md`

**브랜치:** `feature/living-orb-and-tone` (기존 — Task 6~9 + 신규 Task 1~5는 아직 미커밋 상태로 누적 중)

**의존성 — 이미 존재 (Task 1~5는 미커밋이지만 워킹트리에 있음):**
- `lib/orbStages.ts` — `OrbStage`, `STAGE_ORDER`, `isStageHigher`, `stageFromCount`
- `lib/orbAxes.ts` — `NEUTRAL_HUE` export 등
- `lib/weeklyEmotion.ts`, `hooks/useTheme.ts` 등

**파일 구조:**

| 파일 | 역할 | 종류 |
|---|---|---|
| `lib/stageLabels.ts` | `STAGE_LABEL_MESSAGES` (4개), `STAGE_KOREAN_NAMES` (5개), `getStageLabelMessage` | 신규 |
| `hooks/useStageLabel.ts` | stage 상승 감지 + visible 타이머 + localStorage | 신규 |
| `components/StageLabel.tsx` | role/aria-live + data-visible 속성 (CSS가 페이드 처리) | 신규 |
| `components/StageLabel.css` | `.stage-label` 페이드 transition + reduced-motion (컴포넌트 전용) | 신규 |
| `components/LivingOrb.tsx` | `variant` prop + `useId()` + role/aria 분기 | 수정 |
| `components/LivingOrbHost.tsx` | StageLabel + LivingOrb inline-flex 배치 | 수정 |
| `tests/lib/stageLabels.test.ts` | 메시지 매핑 단위 | 신규 |
| `tests/hooks/useStageLabel.test.ts` | 상승 감지 + 타이머 + localStorage + 빠른 연속 + 하강 무시 | 신규 |
| `tests/components/StageLabel.test.tsx` | 렌더 + 속성 + null 처리 | 신규 |
| `tests/components/LivingOrb.test.tsx` | 기존 5개 + variant 케이스 + useId 검증 | 수정 |
| `tests/integration/LivingOrbHost.integration.test.tsx` | 전체 흐름 (DB → stage → 라벨 → 사라짐) | 신규 |

---

## Task 1: `lib/stageLabels.ts` (TDD)

**Files:**
- Create: `lib/stageLabels.ts`
- Create: `tests/lib/stageLabels.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/lib/stageLabels.test.ts
import { describe, it, expect } from 'vitest'
import {
  STAGE_LABEL_MESSAGES,
  STAGE_KOREAN_NAMES,
  getStageLabelMessage,
} from '@/lib/stageLabels'

describe('STAGE_LABEL_MESSAGES', () => {
  it('awakening~living 4단계만 매핑 (Empty 제외)', () => {
    expect(STAGE_LABEL_MESSAGES.awakening).toBe('감정 오브가 깨어났어요')
    expect(STAGE_LABEL_MESSAGES.forming).toBe('결이 보이기 시작했어요')
    expect(STAGE_LABEL_MESSAGES.settled).toBe('조금 더 또렷해졌어요')
    expect(STAGE_LABEL_MESSAGES.living).toBe('당신과 함께 살아가요')
    expect(STAGE_LABEL_MESSAGES.empty).toBeUndefined()
  })
})

describe('STAGE_KOREAN_NAMES', () => {
  it('5단계 모두 한국어 이름 매핑 (Empty 포함)', () => {
    expect(STAGE_KOREAN_NAMES.empty).toBe('비어있음')
    expect(STAGE_KOREAN_NAMES.awakening).toBe('깨어남')
    expect(STAGE_KOREAN_NAMES.forming).toBe('형성 중')
    expect(STAGE_KOREAN_NAMES.settled).toBe('안정')
    expect(STAGE_KOREAN_NAMES.living).toBe('살아있음')
  })
})

describe('getStageLabelMessage', () => {
  it('awakening → 동반자 톤 메시지', () => {
    expect(getStageLabelMessage('awakening')).toBe('감정 오브가 깨어났어요')
  })

  it('living → 동반자 톤 메시지', () => {
    expect(getStageLabelMessage('living')).toBe('당신과 함께 살아가요')
  })

  it('empty → null (메시지 없음)', () => {
    expect(getStageLabelMessage('empty')).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 예상**

```bash
npm run test:run -- tests/lib/stageLabels.test.ts
```

Expected: `Failed to resolve import "@/lib/stageLabels"` (모듈 없음).

- [ ] **Step 3: 구현 작성**

```ts
// lib/stageLabels.ts
import type { OrbStage } from './orbStages'

// 단계 상승 시 일시 표시되는 동반자 톤 메시지 (Empty 제외 = 4종)
// Readonly<Partial<...>> — partial map 이라 as const satisfies 대신 이 패턴 사용 (동적 인덱싱 허용).
export const STAGE_LABEL_MESSAGES: Readonly<Partial<Record<OrbStage, string>>> = {
  awakening: '감정 오브가 깨어났어요',
  forming: '결이 보이기 시작했어요',
  settled: '조금 더 또렷해졌어요',
  living: '당신과 함께 살아가요',
}

// LivingOrb variant="primary"의 영구 aria-label에 사용 (Empty 포함 = 5종) — orbStages.ts 의 STAGE_MESSAGES 와 동일 패턴
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

- [ ] **Step 4: 테스트 PASS 확인**

```bash
npm run test:run -- tests/lib/stageLabels.test.ts
```

Expected: `Tests 5 passed (5)`.

- [ ] **Step 5: tsc 검증**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: 출력 없음.

- [ ] **Step 6: 커밋**

```bash
git add lib/stageLabels.ts tests/lib/stageLabels.test.ts
git commit -m "feat: stageLabels — 단계별 한국어 카피 + 영구 라벨 매핑 TDD"
```

---

## Task 2: `hooks/useStageLabel.ts` (TDD)

**Files:**
- Create: `hooks/useStageLabel.ts`
- Create: `tests/hooks/useStageLabel.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/hooks/useStageLabel.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStageLabel } from '@/hooks/useStageLabel'

describe('useStageLabel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('초기 empty → visible=false, message=null', () => {
    const { result } = renderHook(() => useStageLabel('empty'))
    expect(result.current.visible).toBe(false)
    expect(result.current.message).toBeNull()
  })

  it('처음 awakening 도달 → visible=true, message 설정, localStorage 갱신', () => {
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('awakening')
  })

  it('이미 awakening 도달했으면 다시 마운트해도 visible=false', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'awakening')
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(false)
    expect(result.current.message).toBeNull()
  })

  it('awakening → forming 상승 → visible=true, forming 메시지', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'awakening')
    const { result } = renderHook(() => useStageLabel('forming'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('결이 보이기 시작했어요')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('하강(forming → empty)은 visible=false, localStorage 그대로', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'forming')
    const { result } = renderHook(() => useStageLabel('empty'))
    expect(result.current.visible).toBe(false)
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('잘못된 localStorage 값은 empty 로 간주 (awakening 라벨 정상 등장)', () => {
    localStorage.setItem('onmaum_orb_stage_max', 'banana')
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
  })

  it('3000ms 후 visible=false 자동 전환 (페이드아웃 시작)', () => {
    const { result } = renderHook(() => useStageLabel('awakening'))
    expect(result.current.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(result.current.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2)
    })
    expect(result.current.visible).toBe(false)
  })

  it('빠른 연속 변경 — 새 단계 즉시 적용 + 이전 타이머 clear', () => {
    const { result, rerender } = renderHook(
      ({ stage }: { stage: 'awakening' | 'forming' }) => useStageLabel(stage),
      { initialProps: { stage: 'awakening' } },
    )
    expect(result.current.message).toBe('감정 오브가 깨어났어요')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    rerender({ stage: 'forming' })
    expect(result.current.visible).toBe(true)
    expect(result.current.message).toBe('결이 보이기 시작했어요')
    // 누적 t=3000 — awakening 의 옛 타이머가 cleared 되지 않았다면 만료해서 false 가 되어버림.
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.visible).toBe(true)
    // 누적 t=3499 — forming 새 타이머 만료(t=3500) 1ms 전. 여전히 visible=true.
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current.visible).toBe(true)
    // 누적 t=3501 — forming 새 타이머 만료 직후.
    act(() => {
      vi.advanceTimersByTime(2)
    })
    expect(result.current.visible).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 예상**

```bash
npm run test:run -- tests/hooks/useStageLabel.test.ts
```

Expected: `Failed to resolve import "@/hooks/useStageLabel"`.

- [ ] **Step 3: 구현 작성**

```ts
// hooks/useStageLabel.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { isStageHigher, STAGE_ORDER, type OrbStage } from '@/lib/orbStages'
import { getStageLabelMessage } from '@/lib/stageLabels'

const STORAGE_KEY = 'onmaum_orb_stage_max'

const FADE_IN_MS = 300
const HOLD_MS = 2700
const FADE_OUT_MS = 600
// visible=false 트리거 시점. CSS transition 600ms 페이드아웃 후 트리거 시점 기준 3.6초에 완전 사라짐.
const VISIBLE_MS = FADE_IN_MS + HOLD_MS // 3000ms

export interface StageLabelOutput {
  visible: boolean
  message: string | null
}

function readMax(): OrbStage {
  if (typeof window === 'undefined') return 'empty'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    // includes 로 narrowing 후 cast — type lie 방지 (validation 후 narrow)
    if (v && (STAGE_ORDER as readonly string[]).includes(v)) return v as OrbStage
  } catch {}
  return 'empty'
}

function writeMax(stage: OrbStage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, stage)
  } catch {}
}

export function useStageLabel(currentStage: OrbStage): StageLabelOutput {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prevMax = readMax()
    if (!isStageHigher(currentStage, prevMax)) return

    const msg = getStageLabelMessage(currentStage)
    if (msg === null) return

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    writeMax(currentStage)
    setMessage(msg)
    setVisible(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      timerRef.current = null
    }, VISIBLE_MS)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentStage])

  return { visible, message }
}
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
npm run test:run -- tests/hooks/useStageLabel.test.ts
```

Expected: `Tests 8 passed (8)`.

- [ ] **Step 5: tsc 검증**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: 출력 없음.

- [ ] **Step 6: 커밋**

```bash
git add hooks/useStageLabel.ts tests/hooks/useStageLabel.test.ts
git commit -m "feat: useStageLabel — 단계 상승 감지 + 3초 visible 타이머 + 평생 1회 TDD"
```

---

## Task 3: `components/StageLabel.tsx` + 컴포넌트 전용 CSS (TDD)

**Files:**
- Create: `components/StageLabel.tsx`
- Create: `components/StageLabel.css`
- Create: `tests/components/StageLabel.test.tsx`

> **2026-04-29 갱신**: CSS는 `app/globals.css` 가 아니라 `components/StageLabel.css` 컴포넌트 전용 파일에 둔다. 이유: 기존 `app/globals.css` 가 다른 plan(Task 4)의 미커밋 변경을 안고 있어, 이번 commit에 그 변경이 흡수되는 걸 피하기 위함. StageLabel.tsx 가 직접 `import './StageLabel.css'` 한다 — Next.js 16 의 컴포넌트 레벨 CSS import 패턴.

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// tests/components/StageLabel.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StageLabel from '@/components/StageLabel'

describe('StageLabel', () => {
  it('message=null → 렌더 X (null 반환)', () => {
    const { container } = render(<StageLabel visible={true} message={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('message 있으면 텍스트 + role="status" + aria-live="polite"', () => {
    const { getByRole } = render(
      <StageLabel visible={true} message="결이 보이기 시작했어요" />,
    )
    const span = getByRole('status')
    expect(span.textContent).toBe('결이 보이기 시작했어요')
    expect(span.getAttribute('aria-live')).toBe('polite')
  })

  it('visible=true → data-visible="true"', () => {
    const { getByRole } = render(
      <StageLabel visible={true} message="감정 오브가 깨어났어요" />,
    )
    expect(getByRole('status').getAttribute('data-visible')).toBe('true')
  })

  it('visible=false 이지만 message 있으면 여전히 렌더 (페이드아웃 중)', () => {
    const { getByRole } = render(
      <StageLabel visible={false} message="감정 오브가 깨어났어요" />,
    )
    const span = getByRole('status')
    expect(span.getAttribute('data-visible')).toBe('false')
    expect(span.textContent).toBe('감정 오브가 깨어났어요')
  })

  it('className prop 이 적용', () => {
    const { getByRole } = render(
      <StageLabel
        visible={true}
        message="결이 보이기 시작했어요"
        className="custom-class"
      />,
    )
    expect(getByRole('status').className).toContain('custom-class')
    // 기본 stage-label 클래스도 함께 적용되어야 함
    expect(getByRole('status').className).toContain('stage-label')
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 예상**

```bash
npm run test:run -- tests/components/StageLabel.test.tsx
```

Expected: `Failed to resolve import "@/components/StageLabel"`.

- [ ] **Step 3: 컴포넌트 구현**

```tsx
// components/StageLabel.tsx
'use client'

import './StageLabel.css'

interface Props {
  visible: boolean
  message: string | null
  className?: string
}

export default function StageLabel({ visible, message, className }: Props) {
  if (!message) return null
  const cls = ['stage-label', className].filter(Boolean).join(' ')
  return (
    <span
      role="status"
      aria-live="polite"
      data-visible={visible ? 'true' : 'false'}
      className={cls}
    >
      {message}
    </span>
  )
}
```

- [ ] **Step 4: `components/StageLabel.css` 작성**

```css
/* StageLabel — 단계 라벨 일시 표시 페이드 */
.stage-label {
  display: inline-block;
  font-size: 12px;
  color: var(--fg-muted);
  white-space: nowrap;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
  pointer-events: none;
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

- [ ] **Step 5: 테스트 PASS 확인**

```bash
npm run test:run -- tests/components/StageLabel.test.tsx
```

Expected: `Tests 5 passed (5)`.

- [ ] **Step 6: tsc + 빌드 검증**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: 출력 없음.

- [ ] **Step 7: 커밋**

```bash
git add components/StageLabel.tsx components/StageLabel.css tests/components/StageLabel.test.tsx
git commit -m "feat: StageLabel + 컴포넌트 전용 CSS 페이드 (300/600 + reduced-motion) TDD"
```

---

## Task 4: `LivingOrb` variant prop + useId (수정 — 기존 Task 9 fix 통합)

**Files:**
- Modify: `components/LivingOrb.tsx`
- Modify: `tests/components/LivingOrb.test.tsx`

기존 LivingOrb는 모듈-레벨 `let idCounter = 0` 사용 (Hydration mismatch 위험) + 영어 `aria-label` + variant 개념 없음. 이 task에서 `useId()` 도입, variant prop 추가, role/aria 분기.

- [ ] **Step 1: 새 테스트 케이스 추가 (TDD — 기존 5개 + 신규 4개)**

`tests/components/LivingOrb.test.tsx` 파일에서 기존 import 줄 다음에 import 추가:

```tsx
// 기존 import 그대로 두고 다음 줄 추가
import { STAGE_KOREAN_NAMES } from '@/lib/stageLabels'
```

`describe('LivingOrb', () => {` 블록 끝에 다음 4개 테스트 추가 (기존 5개는 그대로 둠):

```tsx
  it('variant="decoration" (default) → role="presentation" + aria-hidden="true"', () => {
    const { container } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('presentation')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('aria-label')).toBeNull()
  })

  it('variant="primary" → role="img" + 한국어 aria-label', () => {
    const { container } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
        variant="primary"
      />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-hidden')).not.toBe('true')
    expect(svg?.getAttribute('aria-label')).toBe(
      `감정 오브 — ${STAGE_KOREAN_NAMES.forming}`,
    )
  })

  it('useId 사용 — 같은 instance 의 두 렌더에서 id 안정 (모듈 카운터가 아님을 검증)', () => {
    const { container, rerender } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const fillBefore = container.querySelector('circle')?.getAttribute('fill')
    rerender(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const fillAfter = container.querySelector('circle')?.getAttribute('fill')
    // 동일 인스턴스의 재렌더에서 fill url 이 변하지 않아야 한다 (useId 의 안정성).
    expect(fillAfter).toBe(fillBefore)
  })

  it('variant="primary" + stage="empty" → aria-label 에 "비어있음" 노출', () => {
    const { container } = render(
      <LivingOrb
        stage="empty"
        opacity={0.15}
        hue="rgb(107,171,154)"
        saturation={0.3}
        motion={0.3}
        variant="primary"
      />,
    )
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      '감정 오브 — 비어있음',
    )
  })
```

- [ ] **Step 2: 테스트 실행 — FAIL 예상**

```bash
npm run test:run -- tests/components/LivingOrb.test.tsx
```

Expected: 새 4개 테스트 실패 (기존 코드는 `role="img"`만, variant 없음).

- [ ] **Step 3: `components/LivingOrb.tsx` 전체 교체**

기존 파일 전체를 다음 코드로 교체:

```tsx
// components/LivingOrb.tsx
'use client'

import { useId, type AriaAttributes, type AriaRole } from 'react'
import { type OrbStage } from '@/lib/orbStages'
import { STAGE_KOREAN_NAMES } from '@/lib/stageLabels'

interface Props {
  stage: OrbStage
  opacity: number
  hue: string
  saturation: number
  motion: number
  size?: number
  className?: string
  variant?: 'decoration' | 'primary'
}

const STAGE_BLUR_PX: Record<OrbStage, number> = {
  empty: 0,
  awakening: 1.6,
  forming: 1.0,
  settled: 0.4,
  living: 0,
}

type A11yProps = AriaAttributes & { role: AriaRole }

/**
 * Living Orb SVG 컴포넌트.
 *
 * @param variant `'decoration'` (default — 우상단 호스트 등 데코) → role="presentation" + aria-hidden="true".
 *                `'primary'` (/orb 페이지 등 큰 구) → role="img" + 한국어 aria-label.
 *                `data-variant` 속성도 함께 노출되어 외부 CSS targeting 가능 (예: `[data-variant="primary"]`).
 */
export default function LivingOrb({
  stage,
  opacity,
  hue,
  saturation,
  motion,
  size = 56,
  className,
  variant = 'decoration',
}: Props) {
  const reactId = useId()
  // useId() 는 ":r0:" 형식 → SVG ID 와 url(#...) 참조엔 안전하지만 CSS 셀렉터(#id) 에선 콜론 escape 필요.
  // 미래 CSS targeting 안전성 위해 sanitize.
  const uid = `lo-${reactId.replace(/:/g, '')}`
  const filterId = `${uid}-blur`
  const gradientId = `${uid}-grad`

  // motion 0.3~1 → breathe duration 5.2s ~ 2.5s
  const breathDuration = (5.2 - 2.7 * Math.max(0, Math.min(1, motion))).toFixed(2)
  const innerOpacity = 0.6 + 0.4 * Math.max(0, Math.min(1, saturation))
  const ringOpacity = 0.15 + 0.45 * Math.max(0, Math.min(1, saturation))
  const blurPx = STAGE_BLUR_PX[stage]

  const animation =
    stage === 'empty'
      ? 'none'
      : `orbBreathe ${breathDuration}s ease-in-out infinite`

  const a11yProps: A11yProps =
    variant === 'primary'
      ? {
          role: 'img',
          'aria-label': `감정 오브 — ${STAGE_KOREAN_NAMES[stage]}`,
        }
      : {
          role: 'presentation',
          'aria-hidden': true,
        }

  return (
    <svg
      {...a11yProps}
      data-orb={stage}
      data-variant={variant}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity, animation }}
    >
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity={innerOpacity} />
          <stop offset="45%" stopColor={hue} stopOpacity={innerOpacity * 0.7} />
          <stop offset="90%" stopColor={hue} stopOpacity={ringOpacity} />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </radialGradient>
        {blurPx > 0 && (
          <filter id={filterId}>
            <feGaussianBlur stdDeviation={blurPx} />
          </filter>
        )}
      </defs>
      {stage === 'empty' ? (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={hue}
          strokeWidth="0.6"
          strokeOpacity="0.5"
        />
      ) : (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill={`url(#${gradientId})`}
          filter={blurPx > 0 ? `url(#${filterId})` : undefined}
        />
      )}
    </svg>
  )
}
```

- [ ] **Step 4: 테스트 PASS 확인 — 기존 5개 + 새 4개 = 9개 모두 통과**

```bash
npm run test:run -- tests/components/LivingOrb.test.tsx
```

Expected: `Tests 9 passed (9)`.

**중요**: 기존 5개 테스트 중 하나는 `aria-label`이 영어로 `Living Orb {stage}`였다. variant 분기 후 `decoration`(default)에는 aria-label이 없어진다. 만약 기존 테스트에서 `aria-label`을 검증하는 부분이 남아있다면 그 테스트는 `variant="primary"` 케이스로 옮겨졌으므로 기존 테스트에서 제거해야 할 수도 있다 — 기존 테스트 파일을 검토하고 영어 aria-label 검증 줄이 있다면 삭제.

- [ ] **Step 5: tsc 검증**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: 출력 없음.

- [ ] **Step 6: 커밋**

```bash
git add components/LivingOrb.tsx tests/components/LivingOrb.test.tsx
git commit -m "feat(LivingOrb): variant prop + useId — 모듈-레벨 idCounter 폐기, role/aria 분기"
```

---

## Task 5: `LivingOrbHost` 수정 + 통합 테스트

**Files:**
- Modify: `components/LivingOrbHost.tsx` (기존 plan Task 10에 정의됨, 아직 미작성 — 신규 작성에 가까움)
- Create: `tests/integration/LivingOrbHost.integration.test.tsx`

**전제**: `components/LivingOrbProvider.tsx`는 기존 plan Task 10 Step 1에 정의되어 있으며, 여기서는 그대로 사용한다고 가정. (Provider 자체가 아직 미작성이면 Task 10 Step 1 내용으로 먼저 만들어야 함 — 아래 Step 0 참고.)

- [ ] **Step 0 (조건부): `LivingOrbProvider.tsx` 가 없으면 먼저 생성**

`ls components/LivingOrbProvider.tsx` 로 존재 여부 확인. 없으면 다음 코드로 생성:

```tsx
// components/LivingOrbProvider.tsx
'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { EmotionResult } from '@/lib/emotionAnalysis'

interface Value {
  liveEmotion: EmotionResult | null
  active: boolean
  setLive: (emotion: EmotionResult | null, active: boolean) => void
}

const LivingOrbContext = createContext<Value | null>(null)

export function LivingOrbProvider({ children }: { children: React.ReactNode }) {
  const [liveEmotion, setLiveEmotion] = useState<EmotionResult | null>(null)
  const [active, setActive] = useState(false)

  const setLive = useCallback(
    (emotion: EmotionResult | null, isActive: boolean) => {
      setLiveEmotion(emotion)
      setActive(isActive)
    },
    [],
  )

  return (
    <LivingOrbContext.Provider value={{ liveEmotion, active, setLive }}>
      {children}
    </LivingOrbContext.Provider>
  )
}

export function useLivingOrbInput(): Value {
  const ctx = useContext(LivingOrbContext)
  if (!ctx) {
    throw new Error('useLivingOrbInput must be used within <LivingOrbProvider>')
  }
  return ctx
}
```

- [ ] **Step 1: 통합 테스트 작성 (실패 예상)**

```tsx
// tests/integration/LivingOrbHost.integration.test.tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LivingOrbHost from '@/components/LivingOrbHost'
import { LivingOrbProvider } from '@/components/LivingOrbProvider'
import { db } from '@/lib/db'
import type { EmotionRecord } from '@/lib/db'

beforeEach(async () => {
  localStorage.clear()
  await db.delete()
  await db.open()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

async function seedRecords(count: number) {
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    await db.emotions.add({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000),
      duration: 60000,
      detectionRate: 1,
      happy: 0,
      calm: 1,
      sad: 0,
      angry: 0,
      dominantEmotion: 'calm',
      flatAffectScore: 0.5,
    } as EmotionRecord)
  }
}

describe('LivingOrbHost integration', () => {
  it('record 0개 → StageLabel 안 뜸 + LivingOrb 는 decoration role', async () => {
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    // status role 이 없어야 한다 (StageLabel 미표시)
    expect(screen.queryByRole('status')).toBeNull()
    // LivingOrb 는 decoration → role="presentation"
    const orb = document.querySelector('svg[data-orb]')
    expect(orb?.getAttribute('role')).toBe('presentation')
    expect(orb?.getAttribute('aria-hidden')).toBe('true')
  })

  it('record 5개 → forming 도달 → StageLabel 등장 + 한국어 카피', async () => {
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    const label = await screen.findByRole('status')
    expect(label.textContent).toBe('결이 보이기 시작했어요')
    expect(label.getAttribute('data-visible')).toBe('true')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('3000ms 후 data-visible="false" 로 전환 (페이드아웃 시작)', async () => {
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    const label = await screen.findByRole('status')
    expect(label.getAttribute('data-visible')).toBe('true')
    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(label.getAttribute('data-visible')).toBe('false')
  })

  it('이미 forming 도달했으면 재렌더 시 StageLabel 미표시', async () => {
    localStorage.setItem('onmaum_orb_stage_max', 'forming')
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    // useLiveQuery 가 records 를 가져온 뒤에도 StageLabel 은 안 뜬다
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 예상**

```bash
npm run test:run -- tests/integration/LivingOrbHost.integration.test.tsx
```

Expected: 모듈 미존재 또는 기존 Host 가 StageLabel 통합 안 됐으므로 실패.

- [ ] **Step 3: `components/LivingOrbHost.tsx` 작성/수정**

파일이 없으면 생성, 있으면 전체 교체:

```tsx
// components/LivingOrbHost.tsx
'use client'

import { useLivingOrb } from '@/hooks/useLivingOrb'
import { useStageLabel } from '@/hooks/useStageLabel'
import LivingOrb from './LivingOrb'
import { useLivingOrbInput } from './LivingOrbProvider'
import StageLabel from './StageLabel'

export default function LivingOrbHost() {
  const { liveEmotion, active } = useLivingOrbInput()
  const { stage, axes } = useLivingOrb({ liveEmotion, active })
  const { visible, message } = useStageLabel(stage)

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-40 inline-flex items-center gap-2.5 md:right-8 md:top-8">
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

- [ ] **Step 4: 테스트 PASS 확인**

```bash
npm run test:run -- tests/integration/LivingOrbHost.integration.test.tsx
```

Expected: `Tests 4 passed (4)`.

- [ ] **Step 5: 전체 회귀 검증 — 다른 테스트 안 깨졌는지 확인**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: 모든 test file PASS. 만약 깨진 게 있으면 root cause 분석 후 fix.

- [ ] **Step 6: tsc 검증**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: 출력 없음.

- [ ] **Step 7: 커밋**

stage 0 step에서 LivingOrbProvider 도 새로 만들었다면 함께 stage:

```bash
# Provider 도 새로 만든 경우:
git add components/LivingOrbProvider.tsx components/LivingOrbHost.tsx tests/integration/LivingOrbHost.integration.test.tsx

# Provider 가 이미 있던 경우:
git add components/LivingOrbHost.tsx tests/integration/LivingOrbHost.integration.test.tsx
```

```bash
git commit -m "feat(LivingOrbHost): StageLabel inline-flex 배치 + 통합 테스트 (4 cases) TDD"
```

---

## Task 6: 기존 plan 의 Task 11/12 폐기 메모 + Task 9/10 갱신 메모

**Files:**
- Modify: `docs/superpowers/plans/2026-04-28-living-orb-and-tone.md`

기존 plan 문서에 Task 11/12 의 시작 부분과 Task 9/10 의 시작 부분에 폐기/갱신 메모를 추가한다. 코드 변경은 없음.

- [ ] **Step 1: Task 9 머리에 갱신 메모 추가**

`## Task 9: \`components/LivingOrb.tsx\` (SVG, TDD)` 줄 바로 다음에 다음 블록 삽입:

```markdown
> **2026-04-29 갱신**: `variant` prop·`useId()`·role/aria-hidden 분기는 새 plan
> `docs/superpowers/plans/2026-04-29-stage-label-system.md` Task 4 에서 처리.
> 이 Task 9 spec 의 모듈-레벨 `idCounter` 와 영어 `aria-label` 은 폐기.
```

- [ ] **Step 2: Task 10 머리에 갱신 메모 추가**

`## Task 10: \`LivingOrbProvider\` + \`LivingOrbHost\`` 줄 다음에:

```markdown
> **2026-04-29 갱신**: `LivingOrbHost` 의 StageLabel 통합·inline-flex 배치는
> 새 plan `docs/superpowers/plans/2026-04-29-stage-label-system.md` Task 5 에서
> 처리. Provider 자체는 이 Task 10 spec 그대로 사용.
```

- [ ] **Step 3: Task 11 머리에 폐기 메모 추가**

`## Task 11: \`hooks/useMilestone.ts\` (TDD)` 줄 다음에:

```markdown
> **2026-04-29 폐기**: 시스템 푸시 알림이 "위장 모드" 컨셉과 충돌한다는 판단으로
> `useMilestone` + `MilestoneToast` 시스템은 폐기. 기능은 새 plan
> `docs/superpowers/plans/2026-04-29-stage-label-system.md` 의 `useStageLabel` +
> `StageLabel` 로 대체. localStorage 키 `onmaum_orb_stage_max` 와 `isStageHigher`
> 로직만 새 시스템에 흡수됨. 이 Task 11 은 구현하지 않는다.
```

- [ ] **Step 4: Task 12 머리에 폐기 메모 추가**

`## Task 12: \`components/MilestoneToast.tsx\` (TDD)` 줄 다음에:

```markdown
> **2026-04-29 폐기**: Task 11 폐기와 동일 사유. 토스트 5초 표시 + 시스템 푸시
> 옵트인은 `StageLabel` (3.6초 인라인 라벨, 푸시 영구 제외) 로 대체. 이 Task 12 는
> 구현하지 않는다.
```

- [ ] **Step 5: 커밋**

```bash
git add docs/superpowers/plans/2026-04-28-living-orb-and-tone.md
git commit -m "docs(plan): Task 9/10 갱신·Task 11/12 폐기 메모 — 새 stage-label-system plan 으로 이전"
```

---

## Task 7: app/`/measure` wiring (Provider + Host 트리 + setLive 호출)

**Files:**
- Modify: `app/layout.tsx` — `LivingOrbProvider` 트리 추가
- Modify: `components/AppChrome.tsx` — 비랜딩 페이지에서 `LivingOrbHost` 렌더
- Modify: `app/measure/page.tsx` (또는 `useEmotionRecorder` 사용처) — face detection 시 `setLive(emotion, active)` 호출

> **추가 사유 (2026-04-29 SL Task 5 review)**: SL Task 5 까지로 시스템 자체는 완성됐지만, runtime 에는 아직 connect 안 됨. Provider/Host 가 layout 어디에도 mount 안 됐고, `/measure` 가 `setLive` 를 호출하지 않으므로 active orb 가 동작하지 않는다. 이 Task 7 에서 wiring 을 명시적으로 처리.

- [ ] **Step 1: `app/layout.tsx` 수정**

```tsx
// app/layout.tsx — 핵심 변경: AppChrome 을 LivingOrbProvider 로 wrap
import { LivingOrbProvider } from '@/components/LivingOrbProvider'

// ...

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink-50">
        <LivingOrbProvider>
          <AppChrome>{children}</AppChrome>
        </LivingOrbProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: `components/AppChrome.tsx` 수정**

랜딩(`/`) 외 모든 페이지에서 `LivingOrbHost` 렌더:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import ContactsFooter from '@/components/ContactsFooter'
import LivingOrbHost from '@/components/LivingOrbHost'
import Navigation from '@/components/Navigation'

interface Props {
  children: React.ReactNode
}

export default function AppChrome({ children }: Props) {
  const pathname = usePathname()
  const isLanding = pathname === '/'

  if (isLanding) {
    return <>{children}</>
  }

  return (
    <>
      <Navigation />
      <div className="flex-1">{children}</div>
      <ContactsFooter />
      <LivingOrbHost />
    </>
  )
}
```

- [ ] **Step 3: `/measure` 페이지에서 `setLive` 호출**

`app/measure/page.tsx` 의 `useEmotionRecorder` 또는 face detection 결과 처리부에:

```tsx
import { useLivingOrbInput } from '@/components/LivingOrbProvider'
// ...
const { setLive } = useLivingOrbInput()
// detection 결과 도달 시:
setLive(currentEmotion, true)
// detection 정지 시:
setLive(null, false)
```

(정확한 호출 위치는 `app/measure/page.tsx` 의 기존 hook 흐름에 맞게 결정. 측정 중일 때만 `active=true`.)

- [ ] **Step 4: 회귀 + 시각 검증**

```bash
npm run test:run 2>&1 | tail -10
npx tsc --noEmit 2>&1 | tail -10
```

이후 dev server (`npm run dev`) 띄워 브라우저로:
- 랜딩(`/`) — 우상단 orb 안 보여야 함
- `/measure` 외 비랜딩 페이지 — 우상단 orb 보임
- `/measure` 측정 시작 — orb 색이 live emotion 따라 변화
- 첫 측정 완료 → `/stats` 등 다른 페이지 이동 → awakening 라벨 등장 (3.6초 후 사라짐)

- [ ] **Step 5: 커밋**

```bash
git add app/layout.tsx components/AppChrome.tsx app/measure/page.tsx
git commit -m "feat(integration): LivingOrbProvider 트리 + Host 렌더 + /measure setLive wiring"
```

---

## 완료 후 검증

모든 task 완료 후 한 번 더 통합 검증:

```bash
npm run test:run 2>&1 | tail -10
npx tsc --noEmit 2>&1 | tail -10
```

기대값:
- 모든 test file PASS
- tsc 깨끗 (출력 없음)
- git log 에 8개 새 커밋 (Task 1~7 + 메모 정리)

---

## Out of Scope (이번 plan에서 안 함)

spec 12절과 동일:
- 사용자 설정 표시 시간
- Empty 환영 메시지
- 메시지 변주
- 푸시 알림 (영구 제외)
