import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'
import { ThemeProvider } from '@/components/ThemeProvider'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('aria-label 형식: "테마 전환: 현재 X, 클릭하면 Y" (X/Y는 한국어 라벨)', () => {
    renderToggle()
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(
        /^테마 전환: 현재 (라이트|다크|자동), 클릭하면 (라이트|다크|자동)$/,
      ),
    )
  })

  it('클릭 시 테마 순환', () => {
    renderToggle()
    const button = screen.getByRole('button')
    const initialLabel = button.getAttribute('aria-label')
    fireEvent.click(button)
    expect(button.getAttribute('aria-label')).not.toBe(initialLabel)
  })

  it('3번 클릭하면 원래 테마로 복귀 (light→dark→auto→light 순환)', () => {
    localStorage.setItem('onmaum_theme', 'light')
    renderToggle()
    const button = screen.getByRole('button')
    const start = button.getAttribute('aria-label')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button.getAttribute('aria-label')).toBe(start)
  })
})
