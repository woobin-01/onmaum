import { describe, it, expect } from 'vitest'
import {
  filterEmployees,
  getAdminDashboardSummary,
  getCareReasonLabel,
  getDataQualityLabel,
  getRecommendedActionLabel,
  getStressLevelLabel,
  isDataCheckNeeded,
  isEmployeeNeedsCare,
  sortEmployeesByCarePriority,
} from '@/lib/adminMetrics'
import type { EmployeeStressSummary } from '@/lib/adminTypes'

function makeEmployee(overrides: Partial<EmployeeStressSummary>): EmployeeStressSummary {
  return {
    employeeId: 'employee-x',
    displayName: '사원 X',
    teamName: '팀',
    todayAverageStressScore: 40,
    todayMaxStressScore: 50,
    currentStressLevel: 'good',
    cautionAlertCount: 0,
    dangerAlertCount: 0,
    measuredMinutesToday: 60,
    lastMeasuredAt: '2026-06-07T10:00:00+09:00',
    dataQuality: 'good',
    recommendedAction: 'none',
    careReasonCodes: [],
    ...overrides,
  }
}

describe('getAdminDashboardSummary', () => {
  it('전체/단계별 직원 수를 계산한다', () => {
    const employees = [
      makeEmployee({ employeeId: 'e1', currentStressLevel: 'good' }),
      makeEmployee({ employeeId: 'e2', currentStressLevel: 'watch' }),
      makeEmployee({ employeeId: 'e3', currentStressLevel: 'caution' }),
      makeEmployee({ employeeId: 'e4', currentStressLevel: 'danger' }),
      makeEmployee({ employeeId: 'e5', currentStressLevel: 'danger' }),
    ]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.totalEmployees).toBe(5)
    expect(summary.dangerEmployees).toBe(2)
    expect(summary.cautionEmployees).toBe(1)
    expect(summary.watchEmployees).toBe(1)
    expect(summary.goodEmployees).toBe(1)
  })

  it('평균 스트레스 계산 시 null을 제외한다', () => {
    const employees = [
      makeEmployee({ employeeId: 'e1', todayAverageStressScore: 40 }),
      makeEmployee({ employeeId: 'e2', todayAverageStressScore: 60 }),
      makeEmployee({ employeeId: 'e3', todayAverageStressScore: null }),
    ]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.averageStressScore).toBe(50)
  })

  it('데이터가 모두 null이면 평균은 null', () => {
    const employees = [makeEmployee({ employeeId: 'e1', todayAverageStressScore: null })]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.averageStressScore).toBeNull()
  })

  it('관리 필요 직원 수를 계산한다', () => {
    const employees = [
      makeEmployee({ employeeId: 'e1', currentStressLevel: 'good' }),
      makeEmployee({ employeeId: 'e2', currentStressLevel: 'danger' }),
      makeEmployee({ employeeId: 'e3', todayMaxStressScore: 85 }),
    ]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.needCareEmployees).toBe(2)
  })

  it('데이터 확인 필요 직원 수를 계산한다', () => {
    const employees = [
      makeEmployee({ employeeId: 'e1', dataQuality: 'good', measuredMinutesToday: 60 }),
      makeEmployee({ employeeId: 'e2', dataQuality: 'low-detection' }),
      makeEmployee({ employeeId: 'e3', dataQuality: 'good', measuredMinutesToday: 10 }),
    ]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.dataCheckEmployees).toBe(2)
  })

  it('휴식 권장 알림 총합을 계산한다', () => {
    const employees = [
      makeEmployee({ employeeId: 'e1', dangerAlertCount: 2 }),
      makeEmployee({ employeeId: 'e2', dangerAlertCount: 3 }),
    ]
    const summary = getAdminDashboardSummary(employees)
    expect(summary.totalDangerAlertsToday).toBe(5)
  })
})

describe('isEmployeeNeedsCare', () => {
  it('currentStressLevel이 danger면 관리 필요', () => {
    expect(isEmployeeNeedsCare(makeEmployee({ currentStressLevel: 'danger' }))).toBe(true)
  })

  it('todayMaxStressScore가 80 이상이면 관리 필요', () => {
    expect(isEmployeeNeedsCare(makeEmployee({ todayMaxStressScore: 80 }))).toBe(true)
    expect(isEmployeeNeedsCare(makeEmployee({ todayMaxStressScore: 79 }))).toBe(false)
  })

  it('dangerAlertCount가 2 이상이면 관리 필요', () => {
    expect(isEmployeeNeedsCare(makeEmployee({ dangerAlertCount: 2 }))).toBe(true)
    expect(isEmployeeNeedsCare(makeEmployee({ dangerAlertCount: 1 }))).toBe(false)
  })

  it('careReasonCodes에 high_max_score/danger_alert_repeated/recent_sessions_elevated가 있으면 관리 필요', () => {
    expect(isEmployeeNeedsCare(makeEmployee({ careReasonCodes: ['high_max_score'] }))).toBe(true)
    expect(isEmployeeNeedsCare(makeEmployee({ careReasonCodes: ['danger_alert_repeated'] }))).toBe(true)
    expect(isEmployeeNeedsCare(makeEmployee({ careReasonCodes: ['recent_sessions_elevated'] }))).toBe(true)
  })

  it('caution_alert_repeated 같은 보조 사유만 있으면 관리 필요로 판단하지 않는다', () => {
    expect(isEmployeeNeedsCare(makeEmployee({ careReasonCodes: ['caution_alert_repeated'] }))).toBe(false)
  })

  it('아무 조건도 해당하지 않으면 관리 필요 아님', () => {
    expect(isEmployeeNeedsCare(makeEmployee({}))).toBe(false)
  })
})

describe('isDataCheckNeeded', () => {
  it('low-detection이면 데이터 확인 필요', () => {
    expect(isDataCheckNeeded(makeEmployee({ dataQuality: 'low-detection' }))).toBe(true)
  })

  it('insufficient면 데이터 확인 필요', () => {
    expect(isDataCheckNeeded(makeEmployee({ dataQuality: 'insufficient' }))).toBe(true)
  })

  it('측정 시간이 30분 미만이면 데이터 확인 필요', () => {
    expect(isDataCheckNeeded(makeEmployee({ measuredMinutesToday: 29 }))).toBe(true)
    expect(isDataCheckNeeded(makeEmployee({ measuredMinutesToday: 30 }))).toBe(false)
  })
})

describe('filterEmployees', () => {
  const employees = [
    makeEmployee({ employeeId: 'good', currentStressLevel: 'good' }),
    makeEmployee({ employeeId: 'watch', currentStressLevel: 'watch' }),
    makeEmployee({ employeeId: 'caution', currentStressLevel: 'caution' }),
    makeEmployee({ employeeId: 'danger', currentStressLevel: 'danger' }),
    makeEmployee({ employeeId: 'data-check', dataQuality: 'low-detection' }),
  ]

  it('all이면 전체를 반환한다', () => {
    expect(filterEmployees(employees, 'all')).toHaveLength(5)
  })

  it('danger/caution/watch는 해당 단계만 반환한다', () => {
    expect(filterEmployees(employees, 'danger').map((e) => e.employeeId)).toEqual(['danger'])
    expect(filterEmployees(employees, 'caution').map((e) => e.employeeId)).toEqual(['caution'])
    expect(filterEmployees(employees, 'watch').map((e) => e.employeeId)).toEqual(['watch'])
  })

  it('data-check는 데이터 확인이 필요한 직원만 반환한다', () => {
    expect(filterEmployees(employees, 'data-check').map((e) => e.employeeId)).toEqual(['data-check'])
  })

  it('needs-care는 관리 필요 직원만 반환한다', () => {
    expect(filterEmployees(employees, 'needs-care').map((e) => e.employeeId)).toEqual(['danger'])
  })
})

describe('sortEmployeesByCarePriority', () => {
  it('danger 직원이 우선 정렬된다', () => {
    const employees = [
      makeEmployee({ employeeId: 'good-1', currentStressLevel: 'good', todayMaxStressScore: 90 }),
      makeEmployee({ employeeId: 'danger-1', currentStressLevel: 'danger', todayMaxStressScore: 60 }),
    ]
    const sorted = sortEmployeesByCarePriority(employees)
    expect(sorted[0].employeeId).toBe('danger-1')
  })

  it('todayMaxStressScore가 높은 직원이 우선 정렬된다 (동일 우선순위 내)', () => {
    const employees = [
      makeEmployee({ employeeId: 'danger-low', currentStressLevel: 'danger', todayMaxStressScore: 81 }),
      makeEmployee({ employeeId: 'danger-high', currentStressLevel: 'danger', todayMaxStressScore: 95 }),
    ]
    const sorted = sortEmployeesByCarePriority(employees)
    expect(sorted[0].employeeId).toBe('danger-high')
    expect(sorted[1].employeeId).toBe('danger-low')
  })
})

describe('label helpers', () => {
  it('getStressLevelLabel: 단계별 라벨 반환', () => {
    expect(getStressLevelLabel('good')).toBe('양호')
    expect(getStressLevelLabel('watch')).toBe('관심')
    expect(getStressLevelLabel('caution')).toBe('주의')
    expect(getStressLevelLabel('danger')).toBe('휴식 권장')
    expect(getStressLevelLabel(null)).toBe('분석 대기')
  })

  it('getDataQualityLabel: 데이터 품질 라벨 반환', () => {
    expect(getDataQualityLabel('good')).toBe('양호')
    expect(getDataQualityLabel('low-detection')).toBe('얼굴 감지율 낮음')
    expect(getDataQualityLabel('insufficient')).toBe('측정 시간 부족')
  })

  it('getRecommendedActionLabel: 권장 조치 라벨 반환', () => {
    expect(getRecommendedActionLabel('short_break')).toBe('짧은 휴식 권장')
    expect(getRecommendedActionLabel('manager_check')).toBe('관리자 상태 확인')
    expect(getRecommendedActionLabel('data_check')).toBe('측정 환경 확인')
  })

  it('getCareReasonLabel: 관리 필요 사유를 문장으로 반환한다', () => {
    expect(getCareReasonLabel('high_max_score')).toBe('오늘 최고 스트레스 지수가 높습니다.')
    expect(getCareReasonLabel('danger_alert_repeated')).toBe('휴식 권장 알림이 반복 발생했습니다.')
  })

  it('사유 문구에 진단/평가/징계처럼 보이는 단어가 포함되지 않는다', () => {
    const reasons = [
      'high_max_score',
      'high_average_score',
      'danger_alert_repeated',
      'caution_alert_repeated',
      'stress_concentrated_afternoon',
      'stress_concentrated_closing',
      'low_detection',
      'insufficient_measurement',
      'recent_sessions_elevated',
    ] as const
    for (const reason of reasons) {
      expect(getCareReasonLabel(reason)).not.toMatch(/우울증|정신질환|치료|진단|징계|문제 직원|위험 직원/)
    }
  })
})
