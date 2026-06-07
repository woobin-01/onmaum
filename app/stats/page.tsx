'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import DailyRiskCard from '@/components/DailyRiskCard'
import NotificationToggle from '@/components/NotificationToggle'
import RecentRecords from '@/components/RecentRecords'
import RiskWarningModal from '@/components/RiskWarningModal'
import SelfCareTip from '@/components/SelfCareTip'
import TrendChart from '@/components/TrendChart'
import { useDailyStressNotification } from '@/hooks/useDailyStressNotification'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { useRiskNotification } from '@/hooks/useRiskNotification'
import { useWarningDismissal } from '@/hooks/useWarningDismissal'
import { getEmotionsByDate } from '@/lib/emotionRepository'
import { aggregateDailyRisk } from '@/lib/riskCalculator'
import type { StressState } from '@/lib/stressTypes'

export default function StatsPage() {
  const today = new Date().toLocaleDateString('en-CA')
  const todayRecords = useLiveQuery(() => getEmotionsByDate(today), [today])
  const todayRisk = todayRecords
    ? aggregateDailyRisk(todayRecords, today)
    : null
  const { dismissed, dismiss } = useWarningDismissal(today)
  const showWarning = todayRisk?.riskLevel === 'warning' && !dismissed

  const { permission } = useNotificationPermission()
  useRiskNotification({
    riskLevel: todayRisk?.riskLevel ?? null,
    date: today,
    permission,
  })

  // TODO: 스트레스 판별 담당자가 일별 stressScore/stressLevel 집계를 제공하면 연결 예정.
  // 점수 계산은 이 페이지에서 하지 않는다.
  const dailyStressScore: StressState['stressScore'] = null
  const dailyStressLevel: StressState['stressLevel'] = null
  useDailyStressNotification({
    date: today,
    stressScore: dailyStressScore,
    stressLevel: dailyStressLevel,
    permission,
  })

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">통계</h1>
          <p className="mt-2 text-sm text-ink-500">오늘과 최근 기록</p>
        </header>

        <NotificationToggle />
        <DailyRiskCard />
        <TrendChart />
        <SelfCareTip />
        <RecentRecords />
      </section>

      <RiskWarningModal open={showWarning} onClose={dismiss} />
    </main>
  )
}
