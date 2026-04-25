'use client'

import { useEffect, useState } from 'react'
import { loadFaceApiModels } from '@/lib/emotionAnalysis'

type Status = 'loading' | 'loaded' | 'error'

export default function Home() {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadFaceApiModels()
      .then(() => {
        if (cancelled) return
        console.log('✅ face-api 모델 로드 완료')
        setStatus('loaded')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('❌ face-api 모델 로드 실패:', err)
        setErrorMessage(message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-ink-900">온마음</h1>
        <p className="mt-2 text-sm text-ink-500">
          Step 1 · face-api.js 모델 로드 테스트
        </p>

        <div className="mt-8">
          {status === 'loading' && (
            <p className="text-ink-600">⏳ 모델 로딩 중...</p>
          )}
          {status === 'loaded' && (
            <p className="font-medium text-risk-good">
              ✅ face-api 모델 로드 완료
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-risk-warning">
              ❌ 로드 실패: {errorMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
