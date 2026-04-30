'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import DailyRiskCard from '@/components/DailyRiskCard'
import NotificationToggle from '@/components/NotificationToggle'
import RecentRecords from '@/components/RecentRecords'
import RiskWarningModal from '@/components/RiskWarningModal'
import SelfCareTip from '@/components/SelfCareTip'
import TrendChart from '@/components/TrendChart'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { useRiskNotification } from '@/hooks/useRiskNotification'
import { useWarningDismissal } from '@/hooks/useWarningDismissal'
import { getEmotionsByDate } from '@/lib/emotionRepository'
import { aggregateDailyRisk } from '@/lib/riskCalculator'

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

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="mb-2 text-[10px] font-light uppercase tracking-[0.2em] text-[var(--accent)]">
            — 지난 시간
          </p>
          <h1 className="text-3xl font-thin tracking-[-0.02em] text-[var(--fg)]">
            이번 주의 마음
          </h1>
          <p className="mt-2 text-[12px] font-light text-[var(--fg-muted)]">
            오늘과 최근 기록
          </p>
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
