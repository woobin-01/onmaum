import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SelfCareTip from '@/components/SelfCareTip'
import { TIPS } from '@/lib/selfCareTips'

describe('SelfCareTip', () => {
  it('초기 렌더 시 TIPS 안의 팁 표시', () => {
    render(<SelfCareTip />)
    const matched = TIPS.find((t) => screen.queryByText(t.text))
    expect(matched).toBeDefined()
  })

  it('🔄 버튼 클릭 → 다른 팁으로 교체', () => {
    render(<SelfCareTip />)
    const initial = TIPS.find((t) => screen.queryByText(t.text))!
    const button = screen.getByLabelText('다른 팁 보기')
    fireEvent.click(button)
    expect(screen.queryByText(initial.text)).toBeNull()
  })

  it('여러 번 클릭해도 항상 TIPS 안의 팁 표시', () => {
    render(<SelfCareTip />)
    const button = screen.getByLabelText('다른 팁 보기')
    for (let i = 0; i < 5; i++) {
      fireEvent.click(button)
      const visible = TIPS.some((t) => screen.queryByText(t.text))
      expect(visible).toBe(true)
    }
  })
})
