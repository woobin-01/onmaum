import { useState, type FormEvent } from 'react'
import { getCareReasonLabel, getRecommendedActionLabel, getStressLevelLabel } from '@/lib/adminMetrics'
import type { AdminActionType, EmployeeAdminDetail } from '@/lib/adminTypes'

interface Props {
  detail: EmployeeAdminDetail | null
  onAddActionLog: (employeeId: string, actionType: AdminActionType, memo?: string) => void
}

const ACTION_BUTTONS: { type: AdminActionType; label: string }[] = [
  { type: 'break_recommended', label: '짧은 휴식 권장 기록' },
  { type: 'checked', label: '상태 확인 완료' },
  { type: 'counseling_info_shared', label: '상담 정보 안내 기록' },
  { type: 'workload_review', label: '업무 배분 검토 기록' },
  { type: 'data_environment_checked', label: '측정 환경 확인 기록' },
  { type: 'memo', label: '메모 추가' },
]

const ACTION_TYPE_LABEL: Record<AdminActionType, string> = {
  break_recommended: '짧은 휴식 권장',
  checked: '상태 확인',
  counseling_info_shared: '상담 정보 안내',
  workload_review: '업무 배분 검토',
  data_environment_checked: '측정 환경 확인',
  memo: '메모',
}

function scoreText(score: number | null): string {
  return score !== null ? `${score}점` : '-'
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function TrendBars({ trend }: { trend: EmployeeAdminDetail['trend7Days'] }) {
  const max = Math.max(1, ...trend.map((p) => p.averageStressScore ?? 0))
  return (
    <div className="flex items-end gap-2" style={{ height: 96 }}>
      {trend.map((point) => {
        const score = point.averageStressScore
        const heightPct = score !== null ? Math.max(6, Math.round((score / max) * 100)) : 0
        return (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end">
              <div
                className={`w-full rounded-t-md ${score !== null ? 'bg-risk-good/60' : 'bg-ink-100'}`}
                style={{ height: `${heightPct}%` }}
                title={score !== null ? `평균 ${score}점` : '데이터 없음'}
              />
            </div>
            <span className="text-[10px] text-ink-400">{point.date.slice(5)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function EmployeeDetailPanel({ detail, onAddActionLog }: Props) {
  const [memoOpen, setMemoOpen] = useState(false)
  const [memoText, setMemoText] = useState('')

  if (!detail) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
        직원 목록에서 한 명을 선택하면 상세 정보를 확인할 수 있습니다.
      </div>
    )
  }

  const { employee, trend7Days, timeSlotsToday, recentSessions, actionLogs } = detail
  const trimmedMemo = memoText.trim()

  const handleActionClick = (actionType: AdminActionType) => {
    if (actionType === 'memo') {
      setMemoOpen((open) => !open)
      return
    }
    onAddActionLog(employee.employeeId, actionType)
  }

  const handleMemoSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmedMemo) return
    onAddActionLog(employee.employeeId, 'memo', trimmedMemo)
    setMemoText('')
    setMemoOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* 1. 기본 요약 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink-900">{employee.displayName}</p>
            <p className="text-xs text-ink-500">{employee.teamName ?? '-'}</p>
          </div>
          <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700">
            {getStressLevelLabel(employee.currentStressLevel)}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-500 sm:grid-cols-3">
          <div>
            <dt>오늘 평균 스트레스</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800 tabular-nums">{scoreText(employee.todayAverageStressScore)}</dd>
          </div>
          <div>
            <dt>오늘 최고 스트레스</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800 tabular-nums">{scoreText(employee.todayMaxStressScore)}</dd>
          </div>
          <div>
            <dt>주의 알림 횟수</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800 tabular-nums">{employee.cautionAlertCount}회</dd>
          </div>
          <div>
            <dt>휴식 권장 알림 횟수</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800 tabular-nums">{employee.dangerAlertCount}회</dd>
          </div>
          <div>
            <dt>마지막 측정 시간</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800">
              {employee.lastMeasuredAt ? formatDateTime(employee.lastMeasuredAt) : '측정 기록 없음'}
            </dd>
          </div>
          <div>
            <dt>권장 조치</dt>
            <dd className="mt-1 text-sm font-medium text-ink-800">{getRecommendedActionLabel(employee.recommendedAction)}</dd>
          </div>
        </dl>
      </div>

      {/* 2. 관리 필요 사유 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-medium text-ink-700">관리 필요 사유</p>
        {employee.careReasonCodes.length === 0 ? (
          <p className="mt-2 text-xs text-ink-400">현재 특별히 안내할 사유가 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {employee.careReasonCodes.map((reason) => (
              <li key={reason} className="text-xs text-ink-600">
                · {getCareReasonLabel(reason)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. 7일 추이 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-medium text-ink-700">최근 7일 스트레스 추이</p>
        <p className="mt-1 text-xs text-ink-400">하루 평균 스트레스 지수 기준</p>
        <div className="mt-4">
          <TrendBars trend={trend7Days} />
        </div>
      </div>

      {/* 4. 시간대별 요약 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-medium text-ink-700">오늘 시간대별 요약</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {timeSlotsToday.map((slot) => (
            <div key={slot.label} className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-xs text-ink-500">{slot.label}</p>
              <p className="mt-1 text-sm font-medium text-ink-800 tabular-nums">{scoreText(slot.averageStressScore)}</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                최고 {scoreText(slot.maxStressScore)} · 주의 {slot.cautionAlertCount}회 · 휴식 권장 {slot.dangerAlertCount}회
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{slot.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 최근 세션 요약 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-medium text-ink-700">최근 세션 요약</p>
        {recentSessions.length === 0 ? (
          <p className="mt-2 text-xs text-ink-400">최근 세션 기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentSessions.map((session) => (
              <li key={session.sessionId} className="rounded-xl border border-ink-100 p-3 text-xs text-ink-600">
                <p className="font-medium text-ink-800">
                  {formatTime(session.startedAt)} ~ {formatTime(session.endedAt)}
                </p>
                <p className="mt-1">
                  평균 {scoreText(session.averageStressScore)} · 최고 {scoreText(session.maxStressScore)} ·{' '}
                  최종 {getStressLevelLabel(session.finalStressLevel)} · 주의 알림 {session.cautionAlertCount}회 ·{' '}
                  휴식 권장 알림 {session.dangerAlertCount}회
                </p>
                <p className="mt-1 text-ink-500">
                  권장 {getRecommendedActionLabel(session.recommendedAction)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 6. 관리자 조치 기록 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-sm font-medium text-ink-700">관리자 조치 기록</p>
        <p className="mt-1 text-xs text-ink-400">
          버튼을 누르면 현재 브라우저 세션에 조치 기록이 남으며, 직원에게 실제 알림이 가지 않습니다.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACTION_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => handleActionClick(btn.type)}
              className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {memoOpen && (
          <form onSubmit={handleMemoSubmit} className="mt-3 rounded-xl bg-ink-50 p-3">
            <label className="block text-xs font-medium text-ink-700" htmlFor={`admin-memo-${employee.employeeId}`}>
              메모 내용
            </label>
            <textarea
              id={`admin-memo-${employee.employeeId}`}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-risk-good"
              placeholder="예: 오후 상담 일정 전 짧은 휴식을 안내함"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!trimmedMemo}
                className="rounded-full bg-risk-good px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                메모 기록
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemoText('')
                  setMemoOpen(false)
                }}
                className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {actionLogs.length === 0 ? (
          <p className="mt-3 text-xs text-ink-400">아직 기록된 조치가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {actionLogs.map((log) => (
              <li key={log.id} className="rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
                <span className="font-medium text-ink-800">{ACTION_TYPE_LABEL[log.actionType]}</span>
                {log.memo && <span> · {log.memo}</span>}
                <span className="ml-2 text-ink-400">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
