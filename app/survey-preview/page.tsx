'use client'

import SurveyVariantKit from '@/components/survey-variants/SurveyVariantKit'
import SurveyVariantWizard from '@/components/survey-variants/SurveyVariantWizard'
import SurveyVariantGrid from '@/components/survey-variants/SurveyVariantGrid'

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-medium text-white">{label}</span>
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

export default function SurveyPreviewPage() {
  return (
    <main className="min-h-screen bg-ink-50 px-6 py-10">
      <h1 className="mb-8 text-center text-xl font-semibold text-ink-900">설문 재설계 시안</h1>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
        <Frame label="A · 회복 키트"><SurveyVariantKit /></Frame>
        <Frame label="B · 한 번에 하나씩"><SurveyVariantWizard /></Frame>
        <Frame label="C · 비주얼 그리드"><SurveyVariantGrid /></Frame>
      </div>
    </main>
  )
}
