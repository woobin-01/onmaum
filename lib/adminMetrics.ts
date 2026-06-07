import { getAdminActionMessage } from '@/lib/adminActionMessages'
import type {
  AdminDashboardSummary,
  AdminRecommendedAction,
  CareReasonCode,
  DataQuality,
  EmployeeStressSummary,
  StressLevel,
} from '@/lib/adminTypes'

// 아래 상수는 "관리자 화면 표시용 우선순위 판단" 기준이다.
// 스트레스 점수 계산 공식이 아니라, 이미 계산되어 들어온 stressLevel/score/alertCount를
// 기준으로 "오늘 누구를 먼저 살펴볼지"를 정렬·표시하기 위한 임계값이다.
const HIGH_MAX_SCORE_THRESHOLD = 80
const FREQUENT_DANGER_ALERT_THRESHOLD = 2
const LOW_MEASUREMENT_MINUTES_THRESHOLD = 30

// "관리 필요" 판단에 직접 영향을 주는 사유 코드.
// (나머지 사유 코드는 설명 보조용이며, 그 자체만으로 관리 필요를 의미하지는 않는다.)
const NEEDS_CARE_REASON_CODES: CareReasonCode[] = [
  'high_max_score',
  'danger_alert_repeated',
  'recent_sessions_elevated',
]

export type AdminEmployeeFilter = 'all' | 'needs-care' | 'danger' | 'caution' | 'watch' | 'data-check'

const STRESS_LEVEL_LABEL: Record<StressLevel, string> = {
  good: '양호',
  watch: '관심',
  caution: '주의',
  danger: '휴식 권장',
}

const DATA_QUALITY_LABEL: Record<DataQuality, string> = {
  good: '양호',
  'low-detection': '얼굴 감지율 낮음',
  insufficient: '측정 시간 부족',
}

const RECOMMENDED_ACTION_LABEL: Record<AdminRecommendedAction, string> = {
  none: '조치 없음',
  monitor: '경과 확인',
  short_break: '짧은 휴식 권장',
  manager_check: '관리자 상태 확인',
  counseling_info: '상담 정보 안내',
  workload_review: '업무 배분 검토',
  data_check: '측정 환경 확인',
}

const CARE_REASON_LABEL: Record<CareReasonCode, string> = {
  high_max_score: '오늘 최고 스트레스 지수가 높습니다.',
  high_average_score: '오늘 평균 스트레스 지수가 높습니다.',
  danger_alert_repeated: '휴식 권장 알림이 반복 발생했습니다.',
  caution_alert_repeated: '주의 알림이 반복 발생했습니다.',
  stress_concentrated_afternoon: '오후 시간대에 스트레스 신호가 집중되었습니다.',
  stress_concentrated_closing: '마감 전 시간대에 스트레스 신호가 집중되었습니다.',
  low_detection: '얼굴 감지율이 낮아 데이터 확인이 필요합니다.',
  insufficient_measurement: '측정 시간이 부족해 추가 측정이 필요합니다.',
  recent_sessions_elevated: '최근 세션에서 주의 이상 상태가 반복되었습니다.',
}

export function getStressLevelLabel(level: StressLevel | null): string {
  if (level === null) return '분석 대기'
  return STRESS_LEVEL_LABEL[level]
}

export function getDataQualityLabel(dataQuality: DataQuality): string {
  return DATA_QUALITY_LABEL[dataQuality]
}

export function getRecommendedActionLabel(action: AdminRecommendedAction): string {
  return RECOMMENDED_ACTION_LABEL[action]
}

export function getCareReasonLabel(reason: CareReasonCode): string {
  return CARE_REASON_LABEL[reason]
}

/**
 * "관리 필요" 여부는 케어 우선순위 판단이며 의료적 진단이 아니다.
 * 이미 전달된 stressLevel/score/alertCount/careReasonCodes 값을 기준으로만 판단한다.
 */
export function isEmployeeNeedsCare(employee: EmployeeStressSummary): boolean {
  if (employee.currentStressLevel === 'danger') return true
  if (
    employee.todayMaxStressScore !== null &&
    employee.todayMaxStressScore >= HIGH_MAX_SCORE_THRESHOLD
  ) {
    return true
  }
  if (employee.dangerAlertCount >= FREQUENT_DANGER_ALERT_THRESHOLD) return true
  if (employee.careReasonCodes.some((code) => NEEDS_CARE_REASON_CODES.includes(code))) return true
  return false
}

/**
 * "데이터 확인 필요" 여부 — 스트레스 신호 판단과는 별개로,
 * 측정 자체(얼굴 감지율/측정 시간)가 충분했는지를 보기 위한 기준이다.
 */
export function isDataCheckNeeded(employee: EmployeeStressSummary): boolean {
  if (employee.dataQuality === 'low-detection') return true
  if (employee.dataQuality === 'insufficient') return true
  if (employee.measuredMinutesToday < LOW_MEASUREMENT_MINUTES_THRESHOLD) return true
  return false
}

function carePriorityScore(employee: EmployeeStressSummary): number {
  if (employee.currentStressLevel === 'danger') return 0
  if (isEmployeeNeedsCare(employee)) return 1
  return 2
}

export function sortEmployeesByCarePriority(
  employees: EmployeeStressSummary[],
): EmployeeStressSummary[] {
  return [...employees].sort((a, b) => {
    const priorityDiff = carePriorityScore(a) - carePriorityScore(b)
    if (priorityDiff !== 0) return priorityDiff

    const maxA = a.todayMaxStressScore ?? -1
    const maxB = b.todayMaxStressScore ?? -1
    if (maxA !== maxB) return maxB - maxA

    if (a.dangerAlertCount !== b.dangerAlertCount) {
      return b.dangerAlertCount - a.dangerAlertCount
    }

    return a.displayName.localeCompare(b.displayName)
  })
}

export function filterEmployees(
  employees: EmployeeStressSummary[],
  filter: AdminEmployeeFilter,
): EmployeeStressSummary[] {
  switch (filter) {
    case 'all':
      return employees
    case 'needs-care':
      return employees.filter(isEmployeeNeedsCare)
    case 'danger':
      return employees.filter((e) => e.currentStressLevel === 'danger')
    case 'caution':
      return employees.filter((e) => e.currentStressLevel === 'caution')
    case 'watch':
      return employees.filter((e) => e.currentStressLevel === 'watch')
    case 'data-check':
      return employees.filter(isDataCheckNeeded)
  }
}

export function getAdminDashboardSummary(
  employees: EmployeeStressSummary[],
): AdminDashboardSummary {
  const totalEmployees = employees.length
  const dangerEmployees = employees.filter((e) => e.currentStressLevel === 'danger').length
  const cautionEmployees = employees.filter((e) => e.currentStressLevel === 'caution').length
  const watchEmployees = employees.filter((e) => e.currentStressLevel === 'watch').length
  const goodEmployees = employees.filter((e) => e.currentStressLevel === 'good').length
  const dataCheckEmployees = employees.filter(isDataCheckNeeded).length

  const validScores = employees
    .map((e) => e.todayAverageStressScore)
    .filter((score): score is number => score !== null)
  const averageStressScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : null

  const totalDangerAlertsToday = employees.reduce((sum, e) => sum + e.dangerAlertCount, 0)
  const needCareEmployees = employees.filter(isEmployeeNeedsCare).length

  return {
    totalEmployees,
    needCareEmployees,
    dangerEmployees,
    cautionEmployees,
    watchEmployees,
    goodEmployees,
    dataCheckEmployees,
    averageStressScore,
    totalDangerAlertsToday,
  }
}

// CarePriorityList/AdminTodayActions 등에서 "추천 조치"를 한 줄 라벨로 보여줄 때 사용한다.
export function getRecommendedActionTitle(action: AdminRecommendedAction): string {
  return getAdminActionMessage(action).title
}
