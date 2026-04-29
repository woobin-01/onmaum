import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LivingOrb from '@/components/LivingOrb'
import { STAGE_KOREAN_NAMES } from '@/lib/stageLabels'

describe('LivingOrb', () => {
  it('Empty 단계는 stroke 만 (fill 없음)', () => {
    const { container } = render(
      <LivingOrb
        stage="empty"
        opacity={0.15}
        hue="rgb(107,171,154)"
        saturation={0.3}
        motion={0.3}
      />,
    )
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThan(0)
    const stroke = circles[0].getAttribute('stroke')
    expect(stroke).toContain('rgb')
    expect(circles[0].getAttribute('fill')).toBe('none')
  })

  it('Forming 단계는 fill 그라디언트 + blur 필터', () => {
    const { container } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const fill = container.querySelector('circle')?.getAttribute('fill') ?? ''
    expect(fill).toContain('url(#')
    expect(container.querySelector('filter')).toBeTruthy()
  })

  it('Living 단계는 blur 필터 없음', () => {
    const { container } = render(
      <LivingOrb
        stage="living"
        opacity={1}
        hue="rgb(107,171,154)"
        saturation={1}
        motion={1}
      />,
    )
    expect(container.querySelector('filter')).toBeFalsy()
  })

  it('opacity prop 이 svg style 에 반영', () => {
    const { container } = render(
      <LivingOrb
        stage="settled"
        opacity={0.7}
        hue="rgb(107,171,154)"
        saturation={0.6}
        motion={0.6}
      />,
    )
    expect(container.querySelector('svg')?.getAttribute('style')).toContain(
      'opacity: 0.7',
    )
  })

  it('motion 이 높을수록 breathe duration 짧음', () => {
    const { container: low } = render(
      <LivingOrb
        stage="settled"
        opacity={0.7}
        hue="rgb(107,171,154)"
        saturation={0.6}
        motion={0.3}
      />,
    )
    const { container: high } = render(
      <LivingOrb
        stage="settled"
        opacity={0.7}
        hue="rgb(107,171,154)"
        saturation={0.6}
        motion={1}
      />,
    )
    const lowStyle = low.querySelector('svg')?.getAttribute('style') ?? ''
    const highStyle = high.querySelector('svg')?.getAttribute('style') ?? ''
    const lowDur = parseFloat(lowStyle.match(/orbBreathe (\d+\.?\d*)s/)?.[1] ?? '0')
    const highDur = parseFloat(highStyle.match(/orbBreathe (\d+\.?\d*)s/)?.[1] ?? '0')
    expect(highDur).toBeLessThan(lowDur)
  })

  it('variant="decoration" (default) → role="presentation" + aria-hidden="true"', () => {
    const { container } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('presentation')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('aria-label')).toBeNull()
  })

  it('variant="primary" → role="img" + 한국어 aria-label', () => {
    const { container } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
        variant="primary"
      />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-hidden')).not.toBe('true')
    expect(svg?.getAttribute('aria-label')).toBe(
      `감정 오브 — ${STAGE_KOREAN_NAMES.forming}`,
    )
  })

  it('useId 사용 — 같은 instance 의 두 렌더에서 id 안정 (모듈 카운터가 아님을 검증)', () => {
    const { container, rerender } = render(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const fillBefore = container.querySelector('circle')?.getAttribute('fill')
    rerender(
      <LivingOrb
        stage="forming"
        opacity={0.6}
        hue="rgb(107,171,154)"
        saturation={0.5}
        motion={0.5}
      />,
    )
    const fillAfter = container.querySelector('circle')?.getAttribute('fill')
    expect(fillAfter).toBe(fillBefore)
  })

  it('variant="primary" + stage="empty" → aria-label 에 "비어있음" 노출', () => {
    const { container } = render(
      <LivingOrb
        stage="empty"
        opacity={0.15}
        hue="rgb(107,171,154)"
        saturation={0.3}
        motion={0.3}
        variant="primary"
      />,
    )
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      '감정 오브 — 비어있음',
    )
  })
})
