import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StressAlertBanner from '@/components/StressAlertBanner'

describe('StressAlertBanner', () => {
  it('open=false → 렌더되지 않음 (null)', () => {
    const { container } = render(
      <StressAlertBanner
        open={false}
        level="caution"
        title="제목"
        message="메시지"
        recommendation="권장"
        onClose={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('level=null → 렌더되지 않음', () => {
    const { container } = render(
      <StressAlertBanner
        open={true}
        level={null}
        title={null}
        message={null}
        recommendation={null}
        onClose={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('caution → 문구 렌더링 + "나중에 볼게요" 버튼', () => {
    render(
      <StressAlertBanner
        open={true}
        level="caution"
        title="천천히 호흡해볼까요?"
        message="스트레스가 높아지고 있어요."
        recommendation="30초 동안 어깨와 목을 풀어보세요."
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('천천히 호흡해볼까요?')).toBeInTheDocument()
    expect(screen.getByText('스트레스가 높아지고 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '나중에 볼게요' })).toBeInTheDocument()
  })

  it('danger → 문구 렌더링 + "괜찮아요" 버튼', () => {
    render(
      <StressAlertBanner
        open={true}
        level="danger"
        title="잠시 쉬어갈 시간이에요"
        message="스트레스 지수가 높게 유지되고 있어요."
        recommendation="지금은 1분 휴식을 권장합니다."
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('잠시 쉬어갈 시간이에요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '괜찮아요' })).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 → onClose 호출', () => {
    const onClose = vi.fn()
    render(
      <StressAlertBanner
        open={true}
        level="caution"
        title="제목"
        message="메시지"
        recommendation="권장"
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '나중에 볼게요' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
