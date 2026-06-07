'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminPrivacyNotice from '@/components/admin/AdminPrivacyNotice'
import AdminSummaryCards from '@/components/admin/AdminSummaryCards'
import AdminTodayActions from '@/components/admin/AdminTodayActions'
import CarePriorityList from '@/components/admin/CarePriorityList'
import EmployeeDetailPanel from '@/components/admin/EmployeeDetailPanel'
import EmployeeStressTable from '@/components/admin/EmployeeStressTable'
import {
  getSavedAdminActionLogs,
  saveAdminActionLogs,
} from '@/lib/adminActionLogStore'
import { getAdminEmployeeDetail } from '@/lib/adminDataAdapter'
import {
  filterEmployees,
  getAdminDashboardSummary,
  sortEmployeesByCarePriority,
  type AdminEmployeeFilter,
} from '@/lib/adminMetrics'
import type {
  AdminActionLog,
  AdminActionType,
  EmployeeAdminDetail,
  EmployeeStressSummary,
} from '@/lib/adminTypes'

interface Props {
  employees: EmployeeStressSummary[]
}

type Sort = 'care-priority' | 'score-desc' | 'alert-desc' | 'recent-measured'

const FILTER_OPTIONS: { value: AdminEmployeeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'needs-care', label: '관리 필요' },
  { value: 'danger', label: '휴식 권장' },
  { value: 'caution', label: '주의' },
  { value: 'watch', label: '관심' },
  { value: 'data-check', label: '데이터 확인 필요' },
]

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'care-priority', label: '관리 필요 우선' },
  { value: 'score-desc', label: '스트레스 높은 순' },
  { value: 'alert-desc', label: '휴식 권장 알림 많은 순' },
  { value: 'recent-measured', label: '최근 측정 순' },
]

function sortEmployees(employees: EmployeeStressSummary[], sort: Sort): EmployeeStressSummary[] {
  const list = [...employees]
  switch (sort) {
    case 'care-priority':
      // 관리 필요 직원을 우선 노출 (휴식 권장 > 그 외 관리 필요 > 일반)
      return sortEmployeesByCarePriority(list)
    case 'score-desc':
      return list.sort((a, b) => (b.todayMaxStressScore ?? -1) - (a.todayMaxStressScore ?? -1))
    case 'alert-desc':
      return list.sort((a, b) => b.dangerAlertCount - a.dangerAlertCount)
    case 'recent-measured':
      return list.sort((a, b) => {
        const ta = a.lastMeasuredAt ? new Date(a.lastMeasuredAt).getTime() : 0
        const tb = b.lastMeasuredAt ? new Date(b.lastMeasuredAt).getTime() : 0
        return tb - ta
      })
  }
}

let actionLogIdCounter = 0
function nextActionLogId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `action-log-${crypto.randomUUID()}`
  }
  actionLogIdCounter += 1
  return `action-log-${actionLogIdCounter}`
}

export default function AdminDashboard({ employees }: Props) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [filter, setFilter] = useState<AdminEmployeeFilter>('all')
  const [sort, setSort] = useState<Sort>('care-priority')
  const [selectedDetailBase, setSelectedDetailBase] = useState<EmployeeAdminDetail | null>(null)
  // 조치 기록은 시연 동안만 유지되는 화면 상태이다.
  // TODO: 서버/조직 DB가 생기면 이 상태 대신 API로 조회·저장하도록 교체한다.
  const [actionLogsByEmployee, setActionLogsByEmployee] = useState<Record<string, AdminActionLog[]>>(
    () => getSavedAdminActionLogs(),
  )

  const summary = useMemo(() => getAdminDashboardSummary(employees), [employees])

  const visibleEmployees = useMemo(() => {
    return sortEmployees(filterEmployees(employees, filter), sort)
  }, [employees, filter, sort])

  useEffect(() => {
    let cancelled = false

    if (!selectedEmployeeId) {
      return () => {
        cancelled = true
      }
    }

    getAdminEmployeeDetail(selectedEmployeeId).then((detail) => {
      if (!cancelled) setSelectedDetailBase(detail)
    })

    return () => {
      cancelled = true
    }
  }, [selectedEmployeeId])

  useEffect(() => {
    saveAdminActionLogs(actionLogsByEmployee)
  }, [actionLogsByEmployee])

  const selectedDetail = useMemo(() => {
    if (!selectedDetailBase) return null
    if (selectedDetailBase.employee.employeeId !== selectedEmployeeId) return null
    const extraLogs = actionLogsByEmployee[selectedDetailBase.employee.employeeId] ?? []
    return {
      ...selectedDetailBase,
      actionLogs: [...extraLogs, ...selectedDetailBase.actionLogs],
    }
  }, [selectedDetailBase, selectedEmployeeId, actionLogsByEmployee])

  const handleAddActionLog = (employeeId: string, actionType: AdminActionType, memo?: string) => {
    const log: AdminActionLog = {
      id: nextActionLogId(),
      employeeId,
      actionType,
      memo,
      createdAt: new Date().toISOString(),
    }
    setActionLogsByEmployee((prev) => ({
      ...prev,
      [employeeId]: [log, ...(prev[employeeId] ?? [])],
    }))
  }

  return (
    <div className="space-y-6">
      <AdminSummaryCards summary={summary} />

      <CarePriorityList employees={employees} onSelectEmployee={setSelectedEmployeeId} />

      <AdminTodayActions employees={employees} onSelectEmployee={setSelectedEmployeeId} />

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="mb-1 text-xs text-ink-500">필터</p>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === opt.value
                      ? 'bg-risk-good text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-ink-500">정렬</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-full border border-ink-300 px-3 py-1.5 text-xs text-ink-700 outline-none focus:border-risk-good"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <EmployeeStressTable
        employees={visibleEmployees}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={setSelectedEmployeeId}
      />

      <EmployeeDetailPanel
        key={selectedDetail?.employee.employeeId ?? 'empty-detail'}
        detail={selectedDetail}
        onAddActionLog={handleAddActionLog}
      />

      <AdminPrivacyNotice />
    </div>
  )
}
