import {
  getDataQualityLabel,
  getRecommendedActionLabel,
  getStressLevelLabel,
} from '@/lib/adminMetrics'
import type { KeyboardEvent } from 'react'
import type { EmployeeStressSummary, StressLevel } from '@/lib/adminTypes'

interface Props {
  employees: EmployeeStressSummary[]
  selectedEmployeeId?: string | null
  onSelectEmployee: (employeeId: string) => void
}

const LEVEL_TEXT: Record<StressLevel, string> = {
  good: 'text-risk-good',
  watch: 'text-ink-600',
  caution: 'text-risk-caution',
  danger: 'text-risk-warning',
}

function levelTextClass(level: StressLevel | null): string {
  if (level === null) return 'text-ink-400'
  return LEVEL_TEXT[level]
}

function scoreText(score: number | null): string {
  return score !== null ? `${score}점` : '-'
}

function formatLastMeasured(iso: string | null): string {
  if (!iso) return '측정 기록 없음'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '측정 기록 없음'
  return date.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function Row({
  employee,
  selected,
  onSelect,
}: {
  employee: EmployeeStressSummary
  selected: boolean
  onSelect: () => void
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onSelect()
  }

  return (
    <tr
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`${employee.displayName} 상세 보기`}
      data-selected={selected}
      className={`cursor-pointer border-b border-ink-100 text-sm transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-risk-good ${
        selected ? 'bg-risk-good/5' : ''
      }`}
    >
      <td className="px-3 py-3 font-medium text-ink-900">{employee.displayName}</td>
      <td className="px-3 py-3 text-ink-500">{employee.teamName ?? '-'}</td>
      <td className={`px-3 py-3 font-medium ${levelTextClass(employee.currentStressLevel)}`}>
        {getStressLevelLabel(employee.currentStressLevel)}
      </td>
      <td className="px-3 py-3 text-ink-700 tabular-nums">{scoreText(employee.todayAverageStressScore)}</td>
      <td className="px-3 py-3 text-ink-700 tabular-nums">{scoreText(employee.todayMaxStressScore)}</td>
      <td className="px-3 py-3 text-ink-700 tabular-nums">{employee.cautionAlertCount}회</td>
      <td className="px-3 py-3 text-ink-700 tabular-nums">{employee.dangerAlertCount}회</td>
      <td className="px-3 py-3 text-ink-700 tabular-nums">{employee.measuredMinutesToday}분</td>
      <td className="px-3 py-3 text-ink-500">{formatLastMeasured(employee.lastMeasuredAt)}</td>
      <td className="px-3 py-3 text-ink-500">{getDataQualityLabel(employee.dataQuality)}</td>
      <td className="px-3 py-3 text-ink-700">{getRecommendedActionLabel(employee.recommendedAction)}</td>
    </tr>
  )
}

function Card({
  employee,
  selected,
  onSelect,
}: {
  employee: EmployeeStressSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected}
      className={`w-full rounded-2xl border p-4 text-left text-sm transition-colors ${
        selected ? 'border-risk-good bg-risk-good/5' : 'border-ink-200 bg-white hover:bg-ink-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink-900">
          {employee.displayName} <span className="text-xs text-ink-400">· {employee.teamName ?? '-'}</span>
        </span>
        <span className={`text-xs font-medium ${levelTextClass(employee.currentStressLevel)}`}>
          {getStressLevelLabel(employee.currentStressLevel)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-500">
        <div>
          <dt>오늘 평균</dt>
          <dd className="mt-0.5 font-medium text-ink-800 tabular-nums">{scoreText(employee.todayAverageStressScore)}</dd>
        </div>
        <div>
          <dt>오늘 최고</dt>
          <dd className="mt-0.5 font-medium text-ink-800 tabular-nums">{scoreText(employee.todayMaxStressScore)}</dd>
        </div>
        <div>
          <dt>주의 알림</dt>
          <dd className="mt-0.5 font-medium text-ink-800 tabular-nums">{employee.cautionAlertCount}회</dd>
        </div>
        <div>
          <dt>휴식 권장 알림</dt>
          <dd className="mt-0.5 font-medium text-ink-800 tabular-nums">{employee.dangerAlertCount}회</dd>
        </div>
        <div>
          <dt>측정 시간</dt>
          <dd className="mt-0.5 font-medium text-ink-800 tabular-nums">{employee.measuredMinutesToday}분</dd>
        </div>
        <div>
          <dt>마지막 측정</dt>
          <dd className="mt-0.5 font-medium text-ink-800">{formatLastMeasured(employee.lastMeasuredAt)}</dd>
        </div>
        <div>
          <dt>데이터 품질</dt>
          <dd className="mt-0.5 font-medium text-ink-800">{getDataQualityLabel(employee.dataQuality)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink-600">
        권장 조치 <span className="font-medium text-ink-900">{getRecommendedActionLabel(employee.recommendedAction)}</span>
      </p>
    </button>
  )
}

export default function EmployeeStressTable({ employees, selectedEmployeeId, onSelectEmployee }: Props) {
  const isEmpty = employees.length === 0

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-ink-700">직원별 오늘 요약</p>

      {isEmpty && (
        <div className="rounded-xl bg-ink-50 px-4 py-5 text-center text-sm text-ink-500">
          조건에 맞는 직원이 없습니다. 필터를 바꾸거나 전체 목록을 확인하세요.
        </div>
      )}

      {/* 모바일: 카드형 */}
      {!isEmpty && (
        <div className="space-y-2 md:hidden">
          {employees.map((employee) => (
            <Card
              key={employee.employeeId}
              employee={employee}
              selected={employee.employeeId === selectedEmployeeId}
              onSelect={() => onSelectEmployee(employee.employeeId)}
            />
          ))}
        </div>
      )}

      {/* 데스크톱: 테이블형 */}
      {!isEmpty && (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-200 text-xs text-ink-500">
                <th className="px-3 py-2 font-medium">직원</th>
                <th className="px-3 py-2 font-medium">팀</th>
                <th className="px-3 py-2 font-medium">현재 상태</th>
                <th className="px-3 py-2 font-medium">오늘 평균</th>
                <th className="px-3 py-2 font-medium">오늘 최고</th>
                <th className="px-3 py-2 font-medium">주의 알림</th>
                <th className="px-3 py-2 font-medium">휴식 권장 알림</th>
                <th className="px-3 py-2 font-medium">측정 시간</th>
                <th className="px-3 py-2 font-medium">마지막 측정</th>
                <th className="px-3 py-2 font-medium">데이터 품질</th>
                <th className="px-3 py-2 font-medium">권장 조치</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <Row
                  key={employee.employeeId}
                  employee={employee}
                  selected={employee.employeeId === selectedEmployeeId}
                  onSelect={() => onSelectEmployee(employee.employeeId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
