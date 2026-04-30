'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getEmotionsByDateRange } from '@/lib/emotionRepository'
import {
  aggregateDailyRisk,
  type DailyRisk,
  type RiskLevel,
} from '@/lib/riskCalculator'
import type { EmotionRecord } from '@/lib/db'

const DAYS = 7

// risk 토큰의 실제 hex (Tailwind v4 @theme에 정의된 값)
const RISK_HEX: Record<RiskLevel, string> = {
  good: '#6BAB9A',
  caution: '#D4A84B',
  warning: '#E8806A',
}

const RISK_LABEL: Record<RiskLevel, string> = {
  good: '양호',
  caution: '주의',
  warning: '위험',
}

const EMPTY_HEX = '#E5E5E5' // ink-200

interface ChartPoint {
  date: string // 2026-04-26
  label: string // 04/26
  negativeRatio: number
  flatAffectAvg: number
  riskLevel: RiskLevel | null
  recordCount: number
  hasData: boolean
}

function formatDateLabel(date: string): string {
  // "2026-04-26" → "04/26"
  return date.slice(5).replace('-', '/')
}

function localDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD 로컬
}

function buildLast7Dates(): string[] {
  // 오래된 → 오늘 순서 (왼→오 차트 자연스러움)
  return Array.from({ length: DAYS }, (_, i) => localDate(DAYS - 1 - i))
}

function recordsByDate(
  records: EmotionRecord[],
  dates: string[],
): Map<string, EmotionRecord[]> {
  const buckets = new Map<string, EmotionRecord[]>()
  for (const date of dates) buckets.set(date, [])
  for (const r of records) {
    const key = r.timestamp.toLocaleDateString('en-CA')
    const bucket = buckets.get(key)
    if (bucket) bucket.push(r)
  }
  return buckets
}

function buildChartData(records: EmotionRecord[]): ChartPoint[] {
  const dates = buildLast7Dates()
  const buckets = recordsByDate(records, dates)
  return dates.map((date) => {
    const dailyRecords = buckets.get(date) ?? []
    const risk: DailyRisk | null = aggregateDailyRisk(dailyRecords, date)
    return {
      date,
      label: formatDateLabel(date),
      negativeRatio: risk ? risk.negativeRatio : 0,
      flatAffectAvg: risk ? risk.flatAffectAvg : 0,
      riskLevel: risk?.riskLevel ?? null,
      recordCount: risk?.recordCount ?? 0,
      hasData: risk !== null,
    }
  })
}

interface TooltipPayload {
  payload: ChartPoint
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-xs shadow-sm">
      <p className="font-light text-[var(--fg)]">{p.label}</p>
      {p.hasData && p.riskLevel ? (
        <>
          <p className="mt-1 text-[var(--fg-muted)]">
            상태: <span className="font-light">{RISK_LABEL[p.riskLevel]}</span>
          </p>
          <p className="text-[var(--fg-muted)]">
            부정 {Math.round(p.negativeRatio * 100)}% · 평탄{' '}
            {p.flatAffectAvg.toFixed(2)}
          </p>
          <p className="text-[var(--fg-faint)]">기록 {p.recordCount}개</p>
        </>
      ) : (
        <p className="mt-1 text-[var(--fg-faint)]">데이터 없음</p>
      )}
    </div>
  )
}

export default function TrendChart() {
  const today = new Date().toLocaleDateString('en-CA')
  const records = useLiveQuery(async () => {
    const start = new Date()
    start.setDate(start.getDate() - (DAYS - 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return getEmotionsByDateRange(start, end)
  }, [today])

  if (records === undefined) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center text-sm text-[var(--fg-muted)]">
        ⏳ 추세 불러오는 중...
      </div>
    )
  }

  const data = buildChartData(records)
  const hasAnyData = data.some((d) => d.hasData)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-light text-[var(--fg)]">최근 7일 추세</p>
        <p className="text-xs text-[var(--fg-muted)]">부정 비율 (%)</p>
      </div>

      {!hasAnyData && (
        <p className="mb-3 text-center text-xs text-[var(--fg-faint)]">
          7일 내 집계 데이터가 없습니다
        </p>
      )}

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#737373' }}
              axisLine={{ stroke: '#E5E5E5' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}`}
              tick={{ fontSize: 11, fill: '#737373' }}
              axisLine={{ stroke: '#E5E5E5' }}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: '#FAFAFA' }}
            />
            <Bar dataKey="negativeRatio" radius={[4, 4, 0, 0]}>
              {data.map((d, idx) => (
                <Cell
                  key={d.date}
                  fill={d.hasData && d.riskLevel ? RISK_HEX[d.riskLevel] : EMPTY_HEX}
                  data-index={idx}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
