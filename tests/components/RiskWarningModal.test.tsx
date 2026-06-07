import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RiskWarningModal from '@/components/RiskWarningModal'

describe('RiskWarningModal', () => {
  it('open=false → 렌더되지 않음 (null)', () => {
    const { container } = render(
      <RiskWarningModal open={false} onClose={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('open=true → 헤드/카피/연락처/버튼 모두 보임', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} />)
    expect(screen.getByText(/잠시 마음을 살펴요/)).toBeInTheDocument()
    expect(screen.getByText(/평소와 다릅니다/)).toBeInTheDocument()
    expect(screen.getByText(/1577-0199/)).toBeInTheDocument()
    expect(screen.getByText(/1393/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '알겠어요' })).toBeInTheDocument()
  })

  it('연락처 tel: 링크 attribute 정확', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} />)
    const link0199 = screen.getByText(/1577-0199/).closest('a')
    const link1393 = screen.getByText(/1393/).closest('a')
    expect(link0199?.getAttribute('href')).toBe('tel:1577-0199')
    expect(link1393?.getAttribute('href')).toBe('tel:1393')
  })

  it('"알겠어요" 클릭 → onClose 호출', () => {
    const onClose = vi.fn()
    render(<RiskWarningModal open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '알겠어요' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('배경 클릭 → onClose 호출', () => {
    const onClose = vi.fn()
    render(<RiskWarningModal open={true} onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('내부 컨텐츠 클릭은 onClose 호출 안 함 (stopPropagation)', () => {
    const onClose = vi.fn()
    render(<RiskWarningModal open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText(/잠시 마음을 살펴요/))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Escape 키 → onClose 호출', () => {
    const onClose = vi.fn()
    render(<RiskWarningModal open={true} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stressScore가 있으면 점수를 표시한다', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} stressScore={82} />)
    expect(screen.getByText(/82점/)).toBeInTheDocument()
  })

  it('stressScore가 없으면 점수를 표시하지 않는다', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} />)
    expect(screen.queryByText(/점$/)).not.toBeInTheDocument()
  })

  it('mode=realtime → "지금은 1분 휴식을 권장합니다." 표시', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} mode="realtime" />)
    expect(screen.getByText(/지금은 1분 휴식을 권장합니다/)).toBeInTheDocument()
  })

  it('mode=daily → "오늘은 평소보다 스트레스 신호가 많이 감지되었습니다." 표시', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} mode="daily" />)
    expect(
      screen.getByText(/오늘은 평소보다 스트레스 신호가 많이 감지되었습니다/),
    ).toBeInTheDocument()
  })

  it('mode=session-summary → "이번 통화/측정에서 스트레스 신호가 높게 유지되었습니다." 표시', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} mode="session-summary" />)
    expect(
      screen.getByText(/이번 통화\/측정에서 스트레스 신호가 높게 유지되었습니다/),
    ).toBeInTheDocument()
  })

  it('title/message/recommendation prop이 있으면 우선 사용한다', () => {
    render(
      <RiskWarningModal
        open={true}
        onClose={() => {}}
        title="커스텀 제목"
        message="커스텀 메시지"
        recommendation="커스텀 권장"
      />,
    )
    expect(screen.getByText('커스텀 제목')).toBeInTheDocument()
    expect(screen.getByText(/커스텀 메시지/)).toBeInTheDocument()
    expect(screen.getByText(/커스텀 권장/)).toBeInTheDocument()
  })

  it('진단처럼 보이는 표현을 사용하지 않는다', () => {
    render(<RiskWarningModal open={true} onClose={() => {}} mode="daily" stressScore={91} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/위기입니다|정신건강에 문제가 있습니다|치료를 받으세요|진단 결과/)
  })
})
