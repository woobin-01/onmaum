'use client'

import { useEffect } from 'react'

/**
 * 페이지 내 모든 .r 요소를 IntersectionObserver로 감지해서
 * viewport에 진입하면 .in 클래스 추가 (CSS transition 트리거).
 *
 * globals.css의 `.r` / `html.js-reveal .r:not(.in)` / `.r.in` 정의와 한 쌍.
 *
 * 다중 안전망:
 *  1. 마운트 직후 viewport 안 .r를 즉시 .in 처리 → 그 다음에 html.js-reveal을 켬
 *     (켜는 순간 viewport에 보이던 요소가 깜빡 사라졌다 다시 나타나는 현상 방지)
 *  2. IntersectionObserver — 스크롤 진입 감지 (메인)
 *  3. scroll 이벤트 백업 — IO가 어떤 이유로 트리거 안 될 때 viewport 안 .r를 .in
 */
export function useScrollReveal() {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add('in')

    const revealInViewport = () => {
      document.querySelectorAll('.r:not(.in)').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          reveal(el)
        }
      })
    }

    // 1. js-reveal 켜기 전에 viewport 안 .r를 먼저 .in (전환 깜빡임 방지)
    revealInViewport()

    // 2. js-reveal 켜기 — 이때부터 .r:not(.in)이 opacity 0으로 숨겨짐
    document.documentElement.classList.add('js-reveal')

    // 3. IntersectionObserver
    let observer: IntersectionObserver | null = null
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target)
          })
        },
        { threshold: 0.05, rootMargin: '0px 0px -5% 0px' },
      )
      document.querySelectorAll('.r').forEach((el) => observer!.observe(el))
    } catch {
      // IO 미지원 환경 — scroll 백업이 처리
    }

    // 4. scroll 이벤트 백업 (rAF 스로틀)
    let scrollPending = false
    const onScroll = () => {
      if (scrollPending) return
      scrollPending = true
      window.requestAnimationFrame(() => {
        revealInViewport()
        scrollPending = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}
