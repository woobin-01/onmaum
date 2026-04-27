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
})
