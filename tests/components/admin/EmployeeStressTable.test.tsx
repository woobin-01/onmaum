import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import EmployeeStressTable from '@/components/admin/EmployeeStressTable'
import type { EmployeeStressSummary } from '@/lib/adminTypes'

const employees: EmployeeStressSummary[] = [
  {
    employeeId: 'employee-1',
    displayName: '사원 1',
    teamName: '상담 A팀',
    todayAverageStressScore: 32,
    todayMaxStressScore: 48,
    currentStressLevel: 'good',
    cautionAlertCount: 0,
    dangerAlertCount: 0,
    lastMeasuredAt: '2026-06-07T09:40:00+09:00',
    measuredMinutesToday: 180,
    dataQuality: 'good',
    recommendedAction: 'none',
    careReasonCodes: [],
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
    lastMeasuredAt: '2026-06-07T14:05:00+09:00',
    measuredMinutesToday: 165,
    dataQuality: 'good',
    recommendedAction: 'manager_check',
    careReasonCodes: ['high_max_score', 'danger_alert_repeated'],
  },
]

describe('EmployeeStressTable', () => {
  it('직원 목록을 렌더링한다', () => {
    render(<EmployeeStressTable employees={employees} onSelectEmployee={() => {}} />)
    expect(screen.getAllByText('사원 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('사원 3').length).toBeGreaterThan(0)
  })

  it('상태 라벨을 표시한다', () => {
    render(<EmployeeStressTable employees={employees} onSelectEmployee={() => {}} />)
    expect(screen.getAllByText('양호').length).toBeGreaterThan(0)
    expect(screen.getAllByText('휴식 권장').length).toBeGreaterThan(0)
  })

  it('권장 조치 라벨을 표시한다', () => {
    render(<EmployeeStressTable employees={employees} onSelectEmployee={() => {}} />)
    expect(screen.getAllByText('조치 없음').length).toBeGreaterThan(0)
    expect(screen.getAllByText('관리자 상태 확인').length).toBeGreaterThan(0)
  })

  it('행 클릭 시 onSelectEmployee를 호출한다', () => {
    const onSelectEmployee = vi.fn()
    render(<EmployeeStressTable employees={employees} onSelectEmployee={onSelectEmployee} />)

    const [first] = screen.getAllByText('사원 3')
    fireEvent.click(first)

    expect(onSelectEmployee).toHaveBeenCalledWith('employee-3')
  })

  it('직원 목록이 비어 있으면 빈 결과 안내를 표시한다', () => {
    render(<EmployeeStressTable employees={[]} onSelectEmployee={() => {}} />)
    expect(screen.getByText(/조건에 맞는 직원이 없습니다/)).toBeInTheDocument()
  })

  it('카메라/이미지/원시 감정 확률 관련 텍스트를 표시하지 않는다', () => {
    const { container } = render(
      <EmployeeStressTable employees={employees} onSelectEmployee={() => {}} />,
    )
    expect(container.textContent).not.toMatch(/카메라|얼굴 이미지|녹화|happy|angry|sad|calm|확률/)
  })
})
