// 발표 시연용 관리자 데이터 모듈.
//
// 이 레포는 서버 없이 브라우저 IndexedDB에 "본인" 데이터만 저장하므로
// 여러 직원의 데이터를 실제로 모으는 기능은 현재 구조로는 만들 수 없다.
// 따라서 시연에서는 5명의 직원을 "사원 N" 형태로 익명화한 샘플 데이터로 제공한다.
// (스트레스 점수/레벨/알림 횟수는 계산 공식이 없으므로 만들지 않으며,
//  담당자가 실제 직원별 요약 데이터를 제공하면 lib/adminDataAdapter.ts만 교체하면 된다.)

import type {
  AdminActionLog,
  EmployeeAdminDetail,
  EmployeeSessionSummary,
  EmployeeStressSummary,
  EmployeeStressTrendPoint,
  EmployeeTimeSlotStress,
} from '@/lib/adminTypes'

const DEMO_EMPLOYEES: EmployeeStressSummary[] = [
  {
    employeeId: 'employee-1',
    displayName: '사원 1',
    teamName: '상담 A팀',
    todayAverageStressScore: 32,
    todayMaxStressScore: 48,
    currentStressLevel: 'good',
    cautionAlertCount: 0,
    dangerAlertCount: 0,
    measuredMinutesToday: 180,
    lastMeasuredAt: '2026-06-07T09:40:00+09:00',
    dataQuality: 'good',
    recommendedAction: 'none',
    careReasonCodes: [],
  },
  {
    employeeId: 'employee-2',
    displayName: '사원 2',
    teamName: '상담 A팀',
    todayAverageStressScore: 61,
    todayMaxStressScore: 76,
    currentStressLevel: 'caution',
    cautionAlertCount: 3,
    dangerAlertCount: 0,
    measuredMinutesToday: 150,
    lastMeasuredAt: '2026-06-07T11:15:00+09:00',
    dataQuality: 'good',
    recommendedAction: 'short_break',
    careReasonCodes: ['caution_alert_repeated'],
  },
  {
    employeeId: 'employee-3',
    displayName: '사원 3',
    teamName: '상담 B팀',
    todayAverageStressScore: 82,
    todayMaxStressScore: 93,
    currentStressLevel: 'danger',
    cautionAlertCount: 4,
    dangerAlertCount: 4,
    measuredMinutesToday: 165,
    lastMeasuredAt: '2026-06-07T14:05:00+09:00',
    dataQuality: 'good',
    recommendedAction: 'manager_check',
    careReasonCodes: ['high_max_score', 'danger_alert_repeated', 'stress_concentrated_afternoon'],
  },
  {
    employeeId: 'employee-4',
    displayName: '사원 4',
    teamName: '상담 B팀',
    todayAverageStressScore: 47,
    todayMaxStressScore: 58,
    currentStressLevel: 'watch',
    cautionAlertCount: 0,
    dangerAlertCount: 0,
    measuredMinutesToday: 120,
    lastMeasuredAt: '2026-06-07T10:30:00+09:00',
    dataQuality: 'good',
    recommendedAction: 'monitor',
    careReasonCodes: [],
  },
  {
    employeeId: 'employee-5',
    displayName: '사원 5',
    teamName: '상담 C팀',
    todayAverageStressScore: null,
    todayMaxStressScore: null,
    currentStressLevel: null,
    cautionAlertCount: 0,
    dangerAlertCount: 0,
    measuredMinutesToday: 12,
    lastMeasuredAt: '2026-06-07T08:50:00+09:00',
    dataQuality: 'low-detection',
    recommendedAction: 'data_check',
    careReasonCodes: ['low_detection', 'insufficient_measurement'],
  },
]

const DEMO_TREND: Record<string, EmployeeStressTrendPoint[]> = {
  'employee-3': [
    { date: '2026-06-01', averageStressScore: 58, maxStressScore: 70, dangerAlertCount: 1 },
    { date: '2026-06-02', averageStressScore: 63, maxStressScore: 74, dangerAlertCount: 1 },
    { date: '2026-06-03', averageStressScore: 60, maxStressScore: 72, dangerAlertCount: 0 },
    { date: '2026-06-04', averageStressScore: 71, maxStressScore: 85, dangerAlertCount: 2 },
    { date: '2026-06-05', averageStressScore: 75, maxStressScore: 88, dangerAlertCount: 3 },
    { date: '2026-06-06', averageStressScore: 79, maxStressScore: 90, dangerAlertCount: 3 },
    { date: '2026-06-07', averageStressScore: 82, maxStressScore: 93, dangerAlertCount: 4 },
  ],
}

const DEMO_TIME_SLOTS: Record<string, EmployeeTimeSlotStress[]> = {
  'employee-3': [
    {
      label: '오전',
      averageStressScore: 64,
      maxStressScore: 75,
      cautionAlertCount: 1,
      dangerAlertCount: 0,
      summary: '오전에는 비교적 안정적인 흐름을 보였습니다.',
    },
    {
      label: '점심 전후',
      averageStressScore: 71,
      maxStressScore: 80,
      cautionAlertCount: 1,
      dangerAlertCount: 1,
      summary: '점심 전후로 스트레스 신호가 조금씩 높아졌습니다.',
    },
    {
      label: '오후',
      averageStressScore: 88,
      maxStressScore: 93,
      cautionAlertCount: 1,
      dangerAlertCount: 2,
      summary: '오후 시간대에 스트레스 신호가 집중되었습니다.',
    },
    {
      label: '마감 전',
      averageStressScore: 85,
      maxStressScore: 91,
      cautionAlertCount: 1,
      dangerAlertCount: 1,
      summary: '마감 전까지 다소 높은 흐름이 이어졌습니다.',
    },
  ],
}

const DEMO_SESSIONS: Record<string, EmployeeSessionSummary[]> = {
  'employee-3': [
    {
      sessionId: 'session-employee-3-1',
      startedAt: '2026-06-07T13:30:00+09:00',
      endedAt: '2026-06-07T13:52:00+09:00',
      averageStressScore: 84,
      maxStressScore: 93,
      finalStressLevel: 'danger',
      cautionAlertCount: 1,
      dangerAlertCount: 2,
      recommendedAction: 'manager_check',
    },
    {
      sessionId: 'session-employee-3-2',
      startedAt: '2026-06-07T10:05:00+09:00',
      endedAt: '2026-06-07T10:28:00+09:00',
      averageStressScore: 74,
      maxStressScore: 85,
      finalStressLevel: 'caution',
      cautionAlertCount: 2,
      dangerAlertCount: 1,
      recommendedAction: 'short_break',
    },
  ],
}

function buildDefaultTrend(summary: EmployeeStressSummary): EmployeeStressTrendPoint[] {
  // 시연용 기본 추이: 오늘 값 주변으로 완만한 흐름을 만든다 (계산 로직 아님, 표시용 샘플).
  const base = summary.todayAverageStressScore
  if (base === null) {
    return Array.from({ length: 7 }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      averageStressScore: null,
      maxStressScore: null,
      dangerAlertCount: 0,
    }))
  }
  return Array.from({ length: 7 }, (_, i) => {
    const drift = (i - 6) * 2
    return {
      date: `2026-06-0${i + 1}`,
      averageStressScore: Math.max(0, base + drift),
      maxStressScore: summary.todayMaxStressScore,
      dangerAlertCount: i === 6 ? summary.dangerAlertCount : Math.max(0, summary.dangerAlertCount - 1),
    }
  })
}

function buildDefaultTimeSlots(summary: EmployeeStressSummary): EmployeeTimeSlotStress[] {
  const labels: EmployeeTimeSlotStress['label'][] = ['오전', '점심 전후', '오후', '마감 전']
  if (summary.todayAverageStressScore === null) {
    return labels.map((label) => ({
      label,
      averageStressScore: null,
      maxStressScore: null,
      cautionAlertCount: 0,
      dangerAlertCount: 0,
      summary: '측정 시간이 부족해 시간대별 요약을 만들기 어렵습니다.',
    }))
  }
  return labels.map((label, i) => ({
    label,
    averageStressScore: summary.todayAverageStressScore,
    maxStressScore: summary.todayMaxStressScore,
    cautionAlertCount: i === labels.length - 1 ? summary.cautionAlertCount : 0,
    dangerAlertCount: i === labels.length - 1 ? summary.dangerAlertCount : 0,
    summary: '특별히 집중된 시간대 없이 비교적 고른 흐름을 보였습니다.',
  }))
}

function buildDefaultSessions(summary: EmployeeStressSummary): EmployeeSessionSummary[] {
  if (summary.todayAverageStressScore === null) return []
  return [
    {
      sessionId: `session-${summary.employeeId}-1`,
      startedAt: '2026-06-07T11:00:00+09:00',
      endedAt: '2026-06-07T11:20:00+09:00',
      averageStressScore: summary.todayAverageStressScore,
      maxStressScore: summary.todayMaxStressScore,
      finalStressLevel: summary.currentStressLevel,
      cautionAlertCount: summary.cautionAlertCount,
      dangerAlertCount: summary.dangerAlertCount,
      recommendedAction: summary.recommendedAction,
    },
  ]
}

export function getDemoEmployeeSummaries(): EmployeeStressSummary[] {
  return DEMO_EMPLOYEES
}

export function getDemoEmployeeDetail(employeeId: string): EmployeeAdminDetail | null {
  const summary = DEMO_EMPLOYEES.find((e) => e.employeeId === employeeId)
  if (!summary) return null

  const trend7Days = DEMO_TREND[employeeId] ?? buildDefaultTrend(summary)
  const timeSlotsToday = DEMO_TIME_SLOTS[employeeId] ?? buildDefaultTimeSlots(summary)
  const recentSessions = DEMO_SESSIONS[employeeId] ?? buildDefaultSessions(summary)
  const actionLogs: AdminActionLog[] = []

  return {
    employee: summary,
    trend7Days,
    timeSlotsToday,
    recentSessions,
    actionLogs,
  }
}
