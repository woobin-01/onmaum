import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminLoginForm from '@/components/admin/AdminLoginForm'

describe('AdminLoginForm', () => {
  it('입력창과 안내 문구를 렌더링한다', () => {
    render(<AdminLoginForm onSuccess={() => true} />)
    expect(screen.getByLabelText('관리자 코드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '관리자 코드 보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '입장하기' })).toBeInTheDocument()
    expect(screen.getByText(/발표 시연을 위한 간이 접근 제어/)).toBeInTheDocument()
  })

  it('관리자 코드 보기/숨기기를 전환한다', () => {
    render(<AdminLoginForm onSuccess={() => true} />)
    const input = screen.getByLabelText('관리자 코드')

    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: '관리자 코드 보기' }))
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: '관리자 코드 숨기기' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('잘못된 코드 입력 시 오류 메시지를 표시한다', () => {
    const onSuccess = vi.fn().mockReturnValue(false)
    render(<AdminLoginForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('관리자 코드'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(onSuccess).toHaveBeenCalledWith('wrong')
    expect(screen.getByText('관리자 코드가 올바르지 않습니다.')).toBeInTheDocument()
  })

  it('올바른 코드 입력 시 onSuccess를 호출하고 오류 메시지를 표시하지 않는다', () => {
    const onSuccess = vi.fn().mockReturnValue(true)
    render(<AdminLoginForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('관리자 코드'), { target: { value: 'onmaum-admin' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(onSuccess).toHaveBeenCalledWith('onmaum-admin')
    expect(screen.queryByText('관리자 코드가 올바르지 않습니다.')).not.toBeInTheDocument()
  })
})
