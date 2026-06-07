import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CarePriorityList from '@/components/admin/CarePriorityList'
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

const employees: EmployeeStressSummary[] = [
  makeEmployee({ employeeId: 'employee-1', displayName: '사원 1' }),
  makeEmployee({
    employeeId: 'employee-2',
    displayName: '사원 2',
    currentStressLevel: 'caution',
    todayMaxStressScore: 76,
    recommendedAction: 'short_break',
    careReasonCodes: ['caution_alert_repeated'],
  }),
  makeEmployee({
    employeeId: 'employee-3',
    displayName: '사원 3',
    currentStressLevel: 'danger',
    todayMaxStressScore: 93,
    dangerAlertCount: 4,
    recommendedAction: 'manager_check',
    careReasonCodes: ['high_max_score', 'danger_alert_repeated', 'stress_concentrated_afternoon'],
  }),
  makeEmployee({
    employeeId: 'employee-5',
    displayName: '사원 5',
    todayAverageStressScore: null,
    todayMaxStressScore: null,
    currentStressLevel: null,
    dataQuality: 'low-detection',
    measuredMinutesToday: 12,
    recommendedAction: 'data_check',
    careReasonCodes: ['low_detection', 'insufficient_measurement'],
  }),
]

describe('CarePriorityList', () => {
  it('관리 필요 사유가 있는 직원을 Top 3로 표시한다', () => {
    render(<CarePriorityList employees={employees} onSelectEmployee={() => {}} />)
    expect(screen.getByText('관리 필요 직원 Top 3')).toBeInTheDocument()
    expect(screen.getByText('사원 3')).toBeInTheDocument()
    expect(screen.getByText('사원 2')).toBeInTheDocument()
    expect(screen.getByText('사원 5')).toBeInTheDocument()
    expect(screen.queryByText('사원 1')).not.toBeInTheDocument()
  })

  it('danger 직원이 가장 먼저 표시된다', () => {
    render(<CarePriorityList employees={employees} onSelectEmployee={() => {}} />)
    const items = screen.getAllByRole('button')
    expect(items[0]).toHaveTextContent('사원 3')
  })

  it('데이터 확인 필요 직원도 표시할 수 있다', () => {
    render(<CarePriorityList employees={employees} onSelectEmployee={() => {}} />)
    expect(screen.getByText('사원 5')).toBeInTheDocument()
    expect(screen.getByText(/얼굴 감지율이 낮아 데이터 확인이 필요합니다/)).toBeInTheDocument()
  })

  it('직원 클릭 시 onSelectEmployee를 호출한다', () => {
    const onSelectEmployee = vi.fn()
    render(<CarePriorityList employees={employees} onSelectEmployee={onSelectEmployee} />)

    fireEvent.click(screen.getByText('사원 3'))
    expect(onSelectEmployee).toHaveBeenCalledWith('employee-3')
  })

  it('관리 필요 사유가 있는 직원이 없으면 안내 문구를 표시한다', () => {
    render(
      <CarePriorityList
        employees={[makeEmployee({ employeeId: 'employee-1', displayName: '사원 1' })]}
        onSelectEmployee={() => {}}
      />,
    )
    expect(screen.getByText('오늘은 우선적으로 살펴볼 직원이 없습니다.')).toBeInTheDocument()
  })
})
