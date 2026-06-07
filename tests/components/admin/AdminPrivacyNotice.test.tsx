import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminPrivacyNotice from '@/components/admin/AdminPrivacyNotice'

describe('AdminPrivacyNotice', () => {
  it('얼굴 이미지와 원시 감정 로그를 보지 않는다는 문구를 표시한다', () => {
    render(<AdminPrivacyNotice />)
    expect(screen.getByText(/얼굴 이미지나 원시 감정 로그를 보지 않습니다/)).toBeInTheDocument()
  })

  it('의료 진단이나 인사 평가 목적이 아니라는 문구를 표시한다', () => {
    render(<AdminPrivacyNotice />)
    expect(screen.getByText(/의료 진단이나 인사 평가 목적이 아니라/)).toBeInTheDocument()
  })

  it('진단/치료/징계처럼 보이는 단어가 포함되지 않는다', () => {
    const { container } = render(<AdminPrivacyNotice />)
    expect(container.textContent).not.toMatch(/우울증|정신질환|치료|진단(?!이나)|징계|문제 직원|위험 직원/)
  })
})
