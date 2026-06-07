import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeeDetailPanel from '@/components/admin/EmployeeDetailPanel'
import type { EmployeeAdminDetail } from '@/lib/adminTypes'

const detail: EmployeeAdminDetail = {
  employee: {
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
    careReasonCodes: ['high_max_score', 'danger_alert_repeated', 'stress_concentrated_afternoon'],
  },
  trend7Days: [
    { date: '2026-06-01', averageStressScore: 60, maxStressScore: 70, dangerAlertCount: 0 },
    { date: '2026-06-07', averageStressScore: 82, maxStressScore: 93, dangerAlertCount: 4 },
  ],
  timeSlotsToday: [
    {
      label: '오전',
      averageStressScore: 64,
      maxStressScore: 75,
      cautionAlertCount: 1,
      dangerAlertCount: 0,
      summary: '오전에는 비교적 안정적인 흐름을 보였습니다.',
    },
    {
      label: '오후',
      averageStressScore: 88,
      maxStressScore: 93,
      cautionAlertCount: 1,
      dangerAlertCount: 2,
      summary: '오후 시간대에 스트레스 신호가 집중되었습니다.',
    },
  ],
  recentSessions: [
    {
      sessionId: 'session-1',
      startedAt: '2026-06-07T13:30:00+09:00',
      endedAt: '2026-06-07T13:52:00+09:00',
      averageStressScore: 84,
      maxStressScore: 93,
      finalStressLevel: 'danger',
      cautionAlertCount: 1,
      dangerAlertCount: 2,
      recommendedAction: 'manager_check',
    },
  ],
  actionLogs: [
    {
      id: 'log-1',
      employeeId: 'employee-3',
      actionType: 'checked',
      memo: '확인 완료',
      createdAt: '2026-06-07T15:00:00+09:00',
    },
  ],
}

describe('EmployeeDetailPanel', () => {
  it('detail이 null이면 안내 문구를 표시한다', () => {
    render(<EmployeeDetailPanel detail={null} onAddActionLog={() => {}} />)
    expect(screen.getByText(/한 명을 선택하면/)).toBeInTheDocument()
  })

  it('관리 필요 사유를 표시한다', () => {
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={() => {}} />)
    expect(screen.getByText('관리 필요 사유')).toBeInTheDocument()
    expect(screen.getByText(/오늘 최고 스트레스 지수가 높습니다/)).toBeInTheDocument()
    expect(screen.getByText(/휴식 권장 알림이 반복 발생했습니다/)).toBeInTheDocument()
    // 같은 문장이 시간대별 요약에도 등장할 수 있으므로 복수 매칭을 허용한다.
    expect(screen.getAllByText(/오후 시간대에 스트레스 신호가 집중되었습니다/).length).toBeGreaterThan(0)
  })

  it('선택된 직원의 7일 추이를 표시한다', () => {
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={() => {}} />)
    expect(screen.getByText('최근 7일 스트레스 추이')).toBeInTheDocument()
    expect(screen.getByTitle('평균 82점')).toBeInTheDocument()
  })

  it('시간대별 요약을 표시한다', () => {
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={() => {}} />)
    expect(screen.getByText('오전')).toBeInTheDocument()
    expect(screen.getByText('오후')).toBeInTheDocument()
  })

  it('최근 세션 요약을 표시한다', () => {
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={() => {}} />)
    expect(screen.getByText('최근 세션 요약')).toBeInTheDocument()
    expect(screen.getByText(/평균 84점/)).toBeInTheDocument()
  })

  it('조치 버튼 클릭 시 onAddActionLog를 호출한다', () => {
    const onAddActionLog = vi.fn()
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={onAddActionLog} />)

    fireEvent.click(screen.getByRole('button', { name: '짧은 휴식 권장 기록' }))
    expect(onAddActionLog).toHaveBeenCalledWith('employee-3', 'break_recommended')

    fireEvent.click(screen.getByRole('button', { name: '메모 추가' }))
    expect(onAddActionLog).toHaveBeenCalledTimes(1)
  })

  it('메모 내용을 입력한 뒤 조치 기록을 호출한다', () => {
    const onAddActionLog = vi.fn()
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={onAddActionLog} />)

    fireEvent.click(screen.getByRole('button', { name: '메모 추가' }))
    fireEvent.change(screen.getByLabelText('메모 내용'), {
      target: { value: '오후 상담 전 휴식 안내' },
    })
    fireEvent.click(screen.getByRole('button', { name: '메모 기록' }))

    expect(onAddActionLog).toHaveBeenCalledWith('employee-3', 'memo', '오후 상담 전 휴식 안내')
  })

  it('기존 조치 기록을 표시한다', () => {
    render(<EmployeeDetailPanel detail={detail} onAddActionLog={() => {}} />)
    // 버튼 라벨("상태 확인 완료")과 겹치지 않도록 기록 항목(li)만 한정해서 확인한다.
    const logItem = screen.getByText(
      (_, element) =>
        element?.tagName === 'LI' && (element.textContent ?? '').includes('확인 완료'),
    )
    expect(logItem).toBeInTheDocument()
    expect(logItem.textContent).toContain('상태 확인')
  })
})
