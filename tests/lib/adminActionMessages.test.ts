import { describe, it, expect } from 'vitest'
import { getAdminActionMessage } from '@/lib/adminActionMessages'
import type { AdminRecommendedAction } from '@/lib/adminTypes'

const ACTIONS: AdminRecommendedAction[] = [
  'none',
  'monitor',
  'short_break',
  'manager_check',
  'counseling_info',
  'workload_review',
  'data_check',
]

describe('getAdminActionMessage', () => {
  it.each(ACTIONS)('%s에 대해 title/description을 반환한다', (action) => {
    const message = getAdminActionMessage(action)
    expect(message.title.length).toBeGreaterThan(0)
    expect(message.description.length).toBeGreaterThan(0)
  })

  it('진단/치료/징계처럼 보이는 단어가 포함되지 않는다', () => {
    for (const action of ACTIONS) {
      const { title, description } = getAdminActionMessage(action)
      const text = `${title} ${description}`
      expect(text).not.toMatch(/우울증|정신질환|치료|진단|징계|문제 직원|위험 직원/)
    }
  })
})
