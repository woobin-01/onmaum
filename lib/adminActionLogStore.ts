import type { AdminActionLog } from '@/lib/adminTypes'

export type AdminActionLogsByEmployee = Record<string, AdminActionLog[]>

const ACTION_LOGS_KEY = 'onmaum-admin-action-logs'

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, value)
  } catch (err) {
    console.error('관리자 조치 기록 저장 실패:', err)
  }
}

function isAdminActionLog(value: unknown): value is AdminActionLog {
  if (!value || typeof value !== 'object') return false
  const log = value as Partial<AdminActionLog>
  return (
    typeof log.id === 'string' &&
    typeof log.employeeId === 'string' &&
    typeof log.actionType === 'string' &&
    typeof log.createdAt === 'string' &&
    (log.memo === undefined || typeof log.memo === 'string')
  )
}

export function getSavedAdminActionLogs(): AdminActionLogsByEmployee {
  const raw = safeGetItem(ACTION_LOGS_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.entries(parsed).reduce<AdminActionLogsByEmployee>((acc, [employeeId, logs]) => {
      if (!Array.isArray(logs)) return acc
      const validLogs = logs.filter(isAdminActionLog)
      if (validLogs.length > 0) acc[employeeId] = validLogs
      return acc
    }, {})
  } catch {
    return {}
  }
}

export function saveAdminActionLogs(logsByEmployee: AdminActionLogsByEmployee): void {
  safeSetItem(ACTION_LOGS_KEY, JSON.stringify(logsByEmployee))
}
