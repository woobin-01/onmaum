// tests/integration/LivingOrbHost.integration.test.tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, renderHook, screen, act, waitFor } from '@testing-library/react'
import LivingOrbHost from '@/components/LivingOrbHost'
import {
  LivingOrbProvider,
  useLivingOrbInput,
} from '@/components/LivingOrbProvider'
import { db } from '@/lib/db'
import type { EmotionRecord } from '@/lib/db'

beforeEach(async () => {
  localStorage.clear()
  await db.delete()
  await db.open()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

async function seedRecords(count: number) {
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    await db.emotions.add({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000),
      duration: 60000,
      detectionRate: 1,
      happy: 0,
      calm: 1,
      sad: 0,
      angry: 0,
      dominantEmotion: 'calm',
      flatAffectScore: 0.5,
    } as EmotionRecord)
  }
}

describe('LivingOrbHost integration', () => {
  it('record 0개 → StageLabel 안 뜸 + LivingOrb 는 decoration role', async () => {
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    const orb = document.querySelector('svg[data-orb]')
    expect(orb?.getAttribute('role')).toBe('presentation')
    expect(orb?.getAttribute('aria-hidden')).toBe('true')
  })

  it('record 5개 → forming 도달 → StageLabel 등장 + 한국어 카피', async () => {
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    const label = await screen.findByRole('status')
    expect(label.textContent).toBe('결이 보이기 시작했어요')
    expect(label.getAttribute('data-visible')).toBe('true')
    expect(localStorage.getItem('onmaum_orb_stage_max')).toBe('forming')
  })

  it('3000ms 후 data-visible="false" 로 전환 (페이드아웃 시작)', async () => {
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    const label = await screen.findByRole('status')
    expect(label.getAttribute('data-visible')).toBe('true')
    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(label.getAttribute('data-visible')).toBe('false')
  })

  it('이미 forming 도달했으면 재렌더 시 StageLabel 미표시', async () => {
    localStorage.setItem('onmaum_orb_stage_max', 'forming')
    await seedRecords(5)
    render(
      <LivingOrbProvider>
        <LivingOrbHost />
      </LivingOrbProvider>,
    )
    // useLiveQuery 가 records 를 가져와 stage="forming" 으로 전환됐는지로 deterministic 대기.
    // (data-orb 속성이 'empty' → 'forming' 으로 바뀌는 시점까지 polling)
    await waitFor(() => {
      expect(document.querySelector('svg[data-orb]')?.getAttribute('data-orb')).toBe(
        'forming',
      )
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('useLivingOrbInput', () => {
  it('Provider 밖에서 호출 시 명확한 에러 throw', () => {
    expect(() => renderHook(() => useLivingOrbInput())).toThrow(
      'useLivingOrbInput must be used within <LivingOrbProvider>',
    )
  })
})
