// 관리자 화면 전용 "요약" 타입.
// 원시 감정 데이터나 스트레스 점수 계산 공식이 아니라,
// 다른 담당자가 계산한 결과를 요약해 보여주기 위한 표시용 타입이다.

export type StressLevel = 'good' | 'watch' | 'caution' | 'danger'

export type DataQuality = 'good' | 'low-detection' | 'insufficient'

export type AdminRecommendedAction =
  | 'none'
  | 'monitor'
  | 'short_break'
  | 'manager_check'
  | 'counseling_info'
  | 'workload_review'
  | 'data_check'

export type AdminActionType =
  | 'break_recommended'
  | 'checked'
  | 'counseling_info_shared'
  | 'workload_review'
  | 'data_environment_checked'
  | 'memo'

// 관리자 화면에 "왜 이 직원을 먼저 살펴보면 좋은지"를 사람이 읽을 수 있는 문장으로
// 보여주기 위한 사유 코드. 진단이나 평가가 아니라 케어 우선순위 설명용이다.
export type CareReasonCode =
  | 'high_max_score'
  | 'high_average_score'
  | 'danger_alert_repeated'
  | 'caution_alert_repeated'
  | 'stress_concentrated_afternoon'
  | 'stress_concentrated_closing'
  | 'low_detection'
  | 'insufficient_measurement'
  | 'recent_sessions_elevated'

export interface EmployeeStressSummary {
  employeeId: string
  displayName: string
  teamName?: string

  todayAverageStressScore: number | null
  todayMaxStressScore: number | null
  currentStressLevel: StressLevel | null

  cautionAlertCount: number
  dangerAlertCount: number

  measuredMinutesToday: number
  lastMeasuredAt: string | null
  dataQuality: DataQuality

  recommendedAction: AdminRecommendedAction
  careReasonCodes: CareReasonCode[]
}

export interface EmployeeStressTrendPoint {
  date: string
  averageStressScore: number | null
  maxStressScore: number | null
  dangerAlertCount: number
}

export interface EmployeeTimeSlotStress {
  label: '오전' | '점심 전후' | '오후' | '마감 전'
  averageStressScore: number | null
  maxStressScore: number | null
  cautionAlertCount: number
  dangerAlertCount: number
  summary: string
}

export interface EmployeeSessionSummary {
  sessionId: string
  startedAt: string
  endedAt: string
  averageStressScore: number | null
  maxStressScore: number | null
  finalStressLevel: StressLevel | null
  cautionAlertCount: number
  dangerAlertCount: number
  recommendedAction: AdminRecommendedAction
}

export interface AdminActionLog {
  id: string
  employeeId: string
  actionType: AdminActionType
  memo?: string
  createdAt: string
}

export interface EmployeeAdminDetail {
  employee: EmployeeStressSummary
  trend7Days: EmployeeStressTrendPoint[]
  timeSlotsToday: EmployeeTimeSlotStress[]
  recentSessions: EmployeeSessionSummary[]
  actionLogs: AdminActionLog[]
}

export interface AdminDashboardSummary {
  totalEmployees: number
  needCareEmployees: number
  dangerEmployees: number
  cautionEmployees: number
  watchEmployees: number
  goodEmployees: number
  dataCheckEmployees: number
  averageStressScore: number | null
  totalDangerAlertsToday: number
}
