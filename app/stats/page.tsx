'use client'

import DailyRiskCard from '@/components/DailyRiskCard'
import RecentRecords from '@/components/RecentRecords'
import TrendChart from '@/components/TrendChart'

export default function StatsPage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">통계</h1>
          <p className="mt-2 text-sm text-ink-500">오늘과 최근 기록</p>
        </header>

        <DailyRiskCard />
        <TrendChart />
        <RecentRecords />
      </section>
    </main>
  )
}
