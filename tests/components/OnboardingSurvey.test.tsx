import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingSurvey from '@/components/OnboardingSurvey'
import { loadProfile } from '@/lib/profile'

describe('OnboardingSurvey (wizard)', () => {
  beforeEach(() => localStorage.clear())

  it('첫 화면에 step1 질문이 보인다', () => {
    render(<OnboardingSurvey />)
    expect(screen.getByText(/마시면/)).toBeTruthy()
  })

  it('선택 후 끝까지 진행하면 reliefs 저장 + onDone 호출', () => {
    const onDone = vi.fn()
    render(<OnboardingSurvey onDone={onDone} />)
    // step1 선택
    fireEvent.click(screen.getByRole('button', { name: /커피 한 잔/ }))
    // 다음 → 다음 → 시작하기 (버튼 이름은 구현에 맞게: '다음' 2번 후 마지막 '시작하기'/'시작')
    fireEvent.click(screen.getByRole('button', { name: /다음/ }))
    fireEvent.click(screen.getByRole('button', { name: /다음/ }))
    fireEvent.click(screen.getByRole('button', { name: /시작/ }))
    expect(onDone).toHaveBeenCalled()
    expect(loadProfile()?.reliefs).toContain('커피 한 잔')
  })
})
