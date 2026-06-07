import {
  getCareReasonLabel,
  getRecommendedActionTitle,
  getStressLevelLabel,
  sortEmployeesByCarePriority,
} from '@/lib/adminMetrics'
import type { EmployeeStressSummary } from '@/lib/adminTypes'

interface Props {
  employees: EmployeeStressSummary[]
  onSelectEmployee: (employeeId: string) => void
}

const TOP_N = 3
const MAX_REASONS = 2

function scoreLabel(employee: EmployeeStressSummary): string {
  if (employee.todayMaxStressScore !== null) return `최고 ${employee.todayMaxStressScore}점`
  return '데이터 품질 낮음'
}

export default function CarePriorityList({ employees, onSelectEmployee }: Props) {
  // "관리 필요 사유"가 있는 직원을 케어 우선순위 순으로 보여준다.
  // (스트레스 신호로 인한 사유뿐 아니라 데이터 확인이 필요한 사유도 포함한다.)
  const priorityEmployees = sortEmployeesByCarePriority(
    employees.filter((employee) => employee.careReasonCodes.length > 0),
  ).slice(0, TOP_N)

  if (priorityEmployees.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
        오늘은 우선적으로 살펴볼 직원이 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-ink-700">관리 필요 직원 Top {TOP_N}</p>
      <ol className="space-y-2">
        {priorityEmployees.map((employee, index) => (
          <li key={employee.employeeId}>
            <button
              type="button"
              onClick={() => onSelectEmployee(employee.employeeId)}
              className="flex w-full flex-col gap-2 rounded-xl border border-ink-200 px-4 py-3 text-left text-sm transition-colors hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-risk-warning/15 text-xs font-medium text-risk-warning">
                  {index + 1}
                </span>
                <span>
                  <span className="font-medium text-ink-900">{employee.displayName}</span>
                  {employee.teamName && <span className="ml-2 text-xs text-ink-400">{employee.teamName}</span>}
                  <span className="ml-2 text-ink-500">{getStressLevelLabel(employee.currentStressLevel)}</span>
                </span>
              </span>
              <span className="pl-9 text-xs text-ink-500 sm:pl-0 sm:text-right">
                <span className="block">
                  {scoreLabel(employee)} · 휴식 권장 알림 {employee.dangerAlertCount}회
                </span>
                <span className="mt-1 block font-medium text-ink-700">
                  권장 조치 {getRecommendedActionTitle(employee.recommendedAction)}
                </span>
                <span className="mt-1 block text-ink-400">
                  사유 {employee.careReasonCodes.slice(0, MAX_REASONS).map(getCareReasonLabel).join(' · ')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
