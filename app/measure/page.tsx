'use client'

import { useCallback, useEffect, useState } from 'react'
import CameraView from '@/components/CameraView'
import EmotionDisplay from '@/components/EmotionDisplay'
import EmotionOrb from '@/components/EmotionOrb'
import OrbPipButton from '@/components/OrbPipButton'
import OnboardingSurvey from '@/components/OnboardingSurvey'
import { useEmotionRecorder } from '@/hooks/useEmotionRecorder'
import { loadFaceApiModels, type EmotionResult } from '@/lib/emotionAnalysis'
import { db } from '@/lib/db'

type ModelStatus = 'loading' | 'ready' | 'error'

const ONBOARDED_KEY = 'onmaum_onboarded'

const CALM_FALLBACK: EmotionResult = { happy: 0.1, calm: 0.7, sad: 0.1, angry: 0.1 }

function readOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true'
  } catch {
    return true
  }
}

export default function Home() {
  const [onboarded, setOnboarded] = useState<boolean>(readOnboarded)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [modelError, setModelError] = useState<string | null>(null)
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    loadFaceApiModels()
      .then(() => {
        if (cancelled) return
        console.log('✅ face-api 모델 로드 완료')
        setModelStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('❌ face-api 모델 로드 실패:', err)
        setModelError(message)
        setModelStatus('error')
      })

    db.open()
      .then(() => {
        if (cancelled) return
        setDbReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('❌ IndexedDB open 실패:', err)
        setDbError(message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    db.emotions
      .count()
      .then((c) => {
        if (!cancelled) setRecordCount(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [active])

  const { currentEmotion, saveError } = useEmotionRecorder({
    active,
    videoEl,
  })

  const handleOnboardingDone = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDED_KEY, 'true')
    } catch (err) {
      console.error('localStorage 쓰기 실패:', err)
    }
    setOnboarded(true)
  }, [])

  const handleCameraReady = useCallback((video: HTMLVideoElement) => {
    setVideoEl(video)
    setCameraError(null)
  }, [])

  const handleCameraError = useCallback((err: Error) => {
    setCameraError(err.message)
    setActive(false)
    setVideoEl(null)
  }, [])

  const handleStart = () => {
    if (modelStatus !== 'ready' || !dbReady) return
    setCameraError(null)
    setActive(true)
  }

  const handleStop = () => {
    setActive(false)
    setVideoEl(null)
  }

  const startDisabled = active || modelStatus !== 'ready' || !dbReady

  if (!onboarded) {
    return <OnboardingSurvey onDone={handleOnboardingDone} />
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">측정</h1>
          <p className="mt-2 text-sm text-ink-500">실시간 감정 분석</p>
        </header>

        <div className="flex flex-col items-center gap-4">
          <EmotionOrb
            emotions={currentEmotion ?? CALM_FALLBACK}
            recordCount={recordCount}
            size={150}
          />
          <OrbPipButton emotions={currentEmotion ?? CALM_FALLBACK} recordCount={recordCount} />
        </div>

        {modelStatus === 'loading' && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-sm text-ink-600">
            ⏳ face-api 모델 로딩 중...
          </div>
        )}
        {modelStatus === 'error' && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-sm text-risk-warning">
            ❌ 모델 로드 실패: {modelError}
          </div>
        )}
        {dbError && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-sm text-risk-warning">
            ❌ 데이터 저장 불가 환경입니다: {dbError}
          </div>
        )}

        <CameraView
          active={active}
          onReady={handleCameraReady}
          onError={handleCameraError}
        />

        {cameraError && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-sm text-risk-warning">
            ❌ 카메라 오류: {cameraError}
          </div>
        )}

        {saveError && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-sm text-risk-warning">
            ❌ 데이터 저장 실패: {saveError.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={startDisabled}
            className="flex-1 rounded-full bg-risk-good px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            측정 시작
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!active}
            className="flex-1 rounded-full border border-ink-300 bg-white px-6 py-3 font-medium text-ink-700 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            측정 정지
          </button>
        </div>

        {active && <EmotionDisplay emotion={currentEmotion} />}
      </section>
    </main>
  )
}
