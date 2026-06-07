import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSavedAdminActionLogs,
  saveAdminActionLogs,
  type AdminActionLogsByEmployee,
} from '@/lib/adminActionLogStore'

const logsByEmployee: AdminActionLogsByEmployee = {
  'employee-3': [
    {
      id: 'log-1',
      employeeId: 'employee-3',
      actionType: 'memo',
      memo: '오후 상담 전 휴식 안내',
      createdAt: '2026-06-07T15:00:00+09:00',
    },
  ],
}

describe('adminActionLogStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('관리자 조치 기록을 sessionStorage에 저장하고 다시 읽는다', () => {
    saveAdminActionLogs(logsByEmployee)
    expect(getSavedAdminActionLogs()).toEqual(logsByEmployee)
  })

  it('저장된 값이 깨져 있으면 빈 객체를 반환한다', () => {
    sessionStorage.setItem('onmaum-admin-action-logs', '{broken')
    expect(getSavedAdminActionLogs()).toEqual({})
  })

  it('조치 기록 형식이 아닌 값은 버린다', () => {
    sessionStorage.setItem(
      'onmaum-admin-action-logs',
      JSON.stringify({
        'employee-3': [{ id: 'log-1' }],
        'employee-4': logsByEmployee['employee-3'],
      }),
    )

    expect(getSavedAdminActionLogs()).toEqual({
      'employee-4': logsByEmployee['employee-3'],
    })
  })
})
