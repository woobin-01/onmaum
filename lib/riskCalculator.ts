/**
 * 화남 인식률 보정 가중치. (memory: project_step4_anger_compensation)
 * stressIndex 등에서 재사용.
 */
export const ANGRY_WEIGHT = 1.5

/** 너무 짧은 record는 노이즈로 간주하여 집계에서 제외. */
export const MIN_RECORD_DURATION_MS = 10000
