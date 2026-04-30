'use client'

import { useCallback, useEffect, useState } from 'react'
import CameraView from '@/components/CameraView'
import EmotionDisplay from '@/components/EmotionDisplay'
import Onboarding from '@/components/Onboarding'
import { useLivingOrbInput } from '@/components/LivingOrbProvider'
import { useEmotionRecorder } from '@/hooks/useEmotionRecorder'
import { loadFaceApiModels } from '@/lib/emotionAnalysis'
import { db } from '@/lib/db'

type ModelStatus = 'loading' | 'ready' | 'error'

const ONBOARDED_KEY = 'onmaum_onboarded'

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

  useEffect(() => {
    let cancelled = false

    loadFaceApiModels()
      .then(() => {
        if (cancelled) return
        console.log('face-api 모델 로드 완료')
        setModelStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('face-api 모델 로드 실패:', err)
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
        console.error('IndexedDB open 실패:', err)
        setDbError(message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const { currentEmotion, saveError } = useEmotionRecorder({
    active,
    videoEl,
  })

  const { setLive } = useLivingOrbInput()

  useEffect(() => {
    // 측정 중일 때만 live emotion 을 Provider 에 전달.
    // 정지 시 setLive(null, false) 로 reset → orb 가 weekly aggregate 기반 hue 로 복귀.
    setLive(active ? currentEmotion : null, active)
    // unmount(다른 페이지로 navigate 등) 시 Provider 의 active=true 가 stale 로 남는 것 방지.
    return () => {
      setLive(null, false)
    }
  }, [setLive, active, currentEmotion])

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
    return <Onboarding onDone={handleOnboardingDone} />
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="mb-2 text-[10px] font-light uppercase tracking-[0.2em] text-[var(--accent)]">
            — 지금
          </p>
          <h1 className="text-3xl font-thin tracking-[-0.02em] text-[var(--fg)]">
            오늘의 마음 상태
          </h1>
          <p className="mt-2 text-[12px] font-light text-[var(--fg-muted)]">
            실시간 감정 분석
          </p>
        </header>

        {modelStatus === 'loading' && (
          <div className="rounded-2xl border border-[var(--border)] p-4 text-center text-[12px] font-light text-[var(--fg-muted)]">
            모델을 불러오고 있습니다
          </div>
        )}
        {modelStatus === 'error' && (
          <div className="rounded-2xl border border-[var(--warning)]/30 p-4 text-center text-[12px] font-light text-[var(--warning)]">
            모델을 불러오지 못했습니다 — {modelError}
          </div>
        )}
        {dbError && (
          <div className="rounded-2xl border border-[var(--warning)]/30 p-4 text-center text-[12px] font-light text-[var(--warning)]">
            데이터 저장이 어려운 환경입니다 — {dbError}
          </div>
        )}

        <CameraView
          active={active}
          onReady={handleCameraReady}
          onError={handleCameraError}
        />

        {cameraError && (
          <div className="rounded-2xl border border-[var(--warning)]/30 p-4 text-center text-[12px] font-light text-[var(--warning)]">
            카메라 오류 — {cameraError}
          </div>
        )}

        {saveError && (
          <div className="rounded-2xl border border-[var(--warning)]/30 p-4 text-center text-[12px] font-light text-[var(--warning)]">
            저장 실패 — {saveError.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={startDisabled}
            className="flex-1 rounded-full bg-[var(--accent)] px-6 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            측정 시작
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!active}
            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-6 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-[var(--fg)] transition-colors hover:bg-[var(--bg-tint)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            측정 정지
          </button>
        </div>

        {active && <EmotionDisplay emotion={currentEmotion} />}
      </section>
    </main>
  )
}
