import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { getDemoEmployeeSummaries } from '@/lib/adminDemoData'

const employees = getDemoEmployeeSummaries()

describe('AdminDashboard', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('요약 카드, 관리 필요 목록, 직원 테이블을 렌더링한다', () => {
    render(<AdminDashboard employees={employees} />)
    expect(screen.getByText('전체 직원')).toBeInTheDocument()
    expect(screen.getByText(`관리 필요 직원 Top 3`)).toBeInTheDocument()
    expect(screen.getByText('직원별 오늘 요약')).toBeInTheDocument()
  })

  it('직원을 선택하면 상세 패널이 표시된다', async () => {
    render(<AdminDashboard employees={employees} />)

    fireEvent.click(screen.getAllByText('사원 3')[0])

    expect(await screen.findByText('최근 7일 스트레스 추이')).toBeInTheDocument()
    expect(screen.getByText('관리자 조치 기록')).toBeInTheDocument()
  })

  it('필터를 "휴식 권장"으로 바꾸면 휴식 권장 단계 직원만 테이블에 남는다', () => {
    render(<AdminDashboard employees={employees} />)

    fireEvent.click(screen.getByRole('button', { name: '휴식 권장' }))

    const table = screen.getByText('직원별 오늘 요약').closest('div') as HTMLElement
    expect(within(table).getAllByText('사원 3').length).toBeGreaterThan(0)
    expect(within(table).queryByText('사원 1')).not.toBeInTheDocument()
  })

  it('조치 버튼을 누르면 조치 기록이 상세 패널에 추가된다', async () => {
    render(<AdminDashboard employees={employees} />)

    fireEvent.click(screen.getAllByText('사원 3')[0])
    await screen.findByText('관리자 조치 기록')
    fireEvent.click(screen.getByRole('button', { name: '상태 확인 완료' }))

    // 버튼 라벨("상태 확인 완료")과 구분되는, 기록된 조치 항목의 정확한 라벨("상태 확인")을 확인한다.
    expect(screen.getByText('상태 확인', { exact: true })).toBeInTheDocument()
  })
})
