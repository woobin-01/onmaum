import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StageLabel from '@/components/StageLabel'

describe('StageLabel', () => {
  it('message=null → 렌더 X (null 반환)', () => {
    const { container } = render(<StageLabel visible={true} message={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('message 있으면 텍스트 + role="status" + aria-live="polite"', () => {
    const { getByRole } = render(
      <StageLabel visible={true} message="결이 보이기 시작했어요" />,
    )
    const span = getByRole('status')
    expect(span.textContent).toBe('결이 보이기 시작했어요')
    expect(span.getAttribute('aria-live')).toBe('polite')
  })

  it('visible=true → data-visible="true"', () => {
    const { getByRole } = render(
      <StageLabel visible={true} message="감정 오브가 깨어났어요" />,
    )
    expect(getByRole('status').getAttribute('data-visible')).toBe('true')
  })

  it('visible=false 이지만 message 있으면 여전히 렌더 (페이드아웃 중)', () => {
    const { getByRole } = render(
      <StageLabel visible={false} message="감정 오브가 깨어났어요" />,
    )
    const span = getByRole('status')
    expect(span.getAttribute('data-visible')).toBe('false')
    expect(span.textContent).toBe('감정 오브가 깨어났어요')
  })

  it('className prop 이 적용', () => {
    const { getByRole } = render(
      <StageLabel
        visible={true}
        message="결이 보이기 시작했어요"
        className="custom-class"
      />,
    )
    expect(getByRole('status').className).toContain('custom-class')
    // 기본 stage-label 클래스도 함께 적용되어야 함
    expect(getByRole('status').className).toContain('stage-label')
  })
})
