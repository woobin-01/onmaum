import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StressAlertOrb from '@/components/StressAlertOrb'

describe('StressAlertOrb', () => {
  it('stressScore=null → "분석 대기" 표시', () => {
    render(<StressAlertOrb stressScore={null} stressLevel={null} />)
    expect(screen.getByText('분석 대기')).toBeInTheDocument()
  })

  it('good → "양호" 표시', () => {
    render(<StressAlertOrb stressScore={20} stressLevel="good" />)
    expect(screen.getByText('양호')).toBeInTheDocument()
  })

  it('watch → "관심" 표시', () => {
    render(<StressAlertOrb stressScore={40} stressLevel="watch" />)
    expect(screen.getByText('관심')).toBeInTheDocument()
  })

  it('caution → "주의" 표시', () => {
    render(<StressAlertOrb stressScore={60} stressLevel="caution" />)
    expect(screen.getByText('주의')).toBeInTheDocument()
  })

  it('danger → "휴식 권장" 표시', () => {
    render(<StressAlertOrb stressScore={85} stressLevel="danger" />)
    expect(screen.getByText('휴식 권장')).toBeInTheDocument()
  })

  it('showBubble=true + bubbleMessage → 말풍선 텍스트 표시', () => {
    render(
      <StressAlertOrb
        stressScore={60}
        stressLevel="caution"
        showBubble={true}
        bubbleMessage="스트레스가 높아지고 있어요."
      />,
    )
    expect(screen.getByText('스트레스가 높아지고 있어요.')).toBeInTheDocument()
  })

  it('showBubble=false → 말풍선 텍스트 표시 안 함', () => {
    render(
      <StressAlertOrb
        stressScore={60}
        stressLevel="caution"
        showBubble={false}
        bubbleMessage="스트레스가 높아지고 있어요."
      />,
    )
    expect(screen.queryByText('스트레스가 높아지고 있어요.')).not.toBeInTheDocument()
  })
})
