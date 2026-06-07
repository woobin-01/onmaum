import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminSummaryCards from '@/components/admin/AdminSummaryCards'
import type { AdminDashboardSummary } from '@/lib/adminTypes'

const summary: AdminDashboardSummary = {
  totalEmployees: 5,
  needCareEmployees: 2,
  dangerEmployees: 1,
  cautionEmployees: 1,
  watchEmployees: 1,
  goodEmployees: 1,
  dataCheckEmployees: 1,
  averageStressScore: 62,
  totalDangerAlertsToday: 4,
}

describe('AdminSummaryCards', () => {
  it('전체 직원, 관리 필요, 휴식 권장·주의 단계, 데이터 확인 필요, 평균 스트레스, 휴식 권장 알림을 표시한다', () => {
    render(<AdminSummaryCards summary={summary} />)
    expect(screen.getByText('전체 직원')).toBeInTheDocument()
    expect(screen.getByText('관리 필요')).toBeInTheDocument()
    expect(screen.getByText('휴식 권장 단계')).toBeInTheDocument()
    expect(screen.getByText('주의 단계')).toBeInTheDocument()
    expect(screen.getByText('데이터 확인 필요')).toBeInTheDocument()
    expect(screen.getAllByText('5명').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1명').length).toBeGreaterThan(0)
    expect(screen.getByText('62점')).toBeInTheDocument()
    expect(screen.getByText('4회')).toBeInTheDocument()
  })

  it('"관리 필요"와 "휴식 권장 단계"에 보조 설명을 함께 표시한다', () => {
    render(<AdminSummaryCards summary={summary} />)
    expect(screen.getByText(/낙인찍는 표현이 아니라/)).toBeInTheDocument()
    expect(screen.getByText(/의료적 위험이 아니라/)).toBeInTheDocument()
  })

  it('평균 스트레스가 null이면 "집계 전"으로 표시한다', () => {
    render(<AdminSummaryCards summary={{ ...summary, averageStressScore: null }} />)
    expect(screen.getByText('집계 전')).toBeInTheDocument()
  })
})
