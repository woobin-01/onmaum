import type { AdminDashboardSummary } from '@/lib/adminTypes'

interface Props {
  summary: AdminDashboardSummary
}

interface CardSpec {
  label: string
  value: string
  hint?: string
}

export default function AdminSummaryCards({ summary }: Props) {
  const cards: CardSpec[] = [
    { label: '전체 직원', value: `${summary.totalEmployees}명` },
    {
      label: '관리 필요',
      value: `${summary.needCareEmployees}명`,
      hint: '직원 상태를 낙인찍는 표현이 아니라, 오늘 먼저 살펴보면 좋을 케어 우선순위입니다.',
    },
    {
      label: '휴식 권장 단계',
      value: `${summary.dangerEmployees}명`,
      hint: '의료적 위험이 아니라, 스트레스 신호 기준으로 휴식을 권장하는 단계입니다.',
    },
    { label: '주의 단계', value: `${summary.cautionEmployees}명` },
    { label: '데이터 확인 필요', value: `${summary.dataCheckEmployees}명` },
    {
      label: '오늘 평균 스트레스',
      value: summary.averageStressScore !== null ? `${summary.averageStressScore}점` : '집계 전',
    },
    { label: '휴식 권장 알림', value: `${summary.totalDangerAlertsToday}회` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-ink-200 bg-white p-4 text-center"
        >
          <p className="text-xs text-ink-500">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-ink-900">{card.value}</p>
          {card.hint && <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{card.hint}</p>}
        </div>
      ))}
    </div>
  )
}
