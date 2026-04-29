import type { OrbStage } from './orbStages'

// 단계 상승 시 일시 표시되는 동반자 톤 메시지 (Empty 제외 = 4종)
// Readonly<Partial<...>> — runtime immutable + OrbStage 동적 인덱싱 허용 (partial map 이라 as const satisfies 사용 불가).
export const STAGE_LABEL_MESSAGES: Readonly<Partial<Record<OrbStage, string>>> = {
  awakening: '감정 오브가 깨어났어요',
  forming: '결이 보이기 시작했어요',
  settled: '조금 더 또렷해졌어요',
  living: '당신과 함께 살아가요',
}

// LivingOrb variant="primary"의 영구 aria-label에 사용 (Empty 포함 = 5종)
// orbStages.ts 의 STAGE_MESSAGES 와 동일 패턴 — full record 라 narrow literal type 안전.
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
