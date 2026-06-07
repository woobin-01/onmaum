import { sortEmployeesByCarePriority } from '@/lib/adminMetrics'
import type { AdminRecommendedAction, EmployeeStressSummary } from '@/lib/adminTypes'

interface Props {
  employees: EmployeeStressSummary[]
  onSelectEmployee: (employeeId: string) => void
}

const MAX_ITEMS = 5

// "오늘의 관리자 액션" 한 줄에 자연스럽게 이어지도록 권장 조치를 짧은 구절로 표현한다.
// (조치 자체의 정의는 lib/adminActionMessages.ts를 따른다.)
const TODAY_ACTION_PHRASE: Partial<Record<AdminRecommendedAction, string>> = {
  monitor: '경과 확인 권장',
  short_break: '다음 업무 전 짧은 휴식 권장',
  manager_check: '상태 확인 필요',
  counseling_info: '상담 정보 안내 검토',
  workload_review: '업무 배분 검토 필요',
  data_check: '측정 환경 확인 필요',
}

export default function AdminTodayActions({ employees, onSelectEmployee }: Props) {
  const items = sortEmployeesByCarePriority(employees)
    .filter((employee) => employee.recommendedAction !== 'none')
    .slice(0, MAX_ITEMS)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
        오늘 추가로 안내할 관리자 액션이 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-ink-700">오늘의 관리자 액션</p>
      <ul className="space-y-2">
        {items.map((employee) => (
          <li key={employee.employeeId}>
            <button
              type="button"
              onClick={() => onSelectEmployee(employee.employeeId)}
              className="flex w-full items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-left text-sm transition-colors hover:bg-ink-50"
            >
              <span className="font-medium text-ink-900">{employee.displayName}</span>
              <span className="text-ink-500">
                {TODAY_ACTION_PHRASE[employee.recommendedAction]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
