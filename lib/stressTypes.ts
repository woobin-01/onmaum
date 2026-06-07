// 스트레스 판별 담당자가 채워줄 입력 타입.
// 점수/레벨 계산 로직은 이 파일이 아니라 별도 모듈(스트레스 판별 담당)에서 수행한다.

export type StressLevel = 'good' | 'watch' | 'caution' | 'danger'

export interface StressState {
  stressScore: number | null // 0~100, 계산 불가 시 null
  stressLevel: StressLevel | null
  reason?: string // 예: 'negative_emotion_sustained', 'low_detection', 'session_summary'
  measuredAt?: Date
}

export interface StressSessionSummary {
  sessionId: string
  startedAt: Date
  endedAt: Date
  averageStressScore: number | null
  maxStressScore: number | null
  finalStressLevel: StressLevel | null
}
