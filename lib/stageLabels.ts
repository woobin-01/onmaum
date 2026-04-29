import type { OrbStage } from './orbStages'

// 단계 상승 시 일시 표시되는 동반자 톤 메시지 (Empty 제외 = 4종)
export const STAGE_LABEL_MESSAGES: Partial<Record<OrbStage, string>> = {
  awakening: '감정 오브가 깨어났어요',
  forming: '결이 보이기 시작했어요',
  settled: '조금 더 또렷해졌어요',
  living: '당신과 함께 살아가요',
}

// LivingOrb variant="primary"의 영구 aria-label에 사용 (Empty 포함 = 5종)
export const STAGE_KOREAN_NAMES: Record<OrbStage, string> = {
  empty: '비어있음',
  awakening: '깨어남',
  forming: '형성 중',
  settled: '안정',
  living: '살아있음',
}

export function getStageLabelMessage(stage: OrbStage): string | null {
  return STAGE_LABEL_MESSAGES[stage] ?? null
}
