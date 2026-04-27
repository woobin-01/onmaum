'use client'

import { useEffect } from 'react'

/**
 * 페이지 내 모든 .r 요소를 IntersectionObserver로 감지해서
 * viewport에 진입하면 .in 클래스 추가 (CSS transition 트리거).
 *
 * globals.css의 .r / .r.in 정의와 한 쌍으로 동작.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll('.r')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
