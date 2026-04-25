'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import CameraView from '@/components/CameraView'
import EmotionDisplay from '@/components/EmotionDisplay'
import {
  analyzeEmotion,
  loadFaceApiModels,
  type EmotionResult,
} from '@/lib/emotionAnalysis'

type ModelStatus = 'loading' | 'ready' | 'error'

const ANALYSIS_INTERVAL_MS = 500

export default function Home() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [modelError, setModelError] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [emotion, setEmotion] = useState<EmotionResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const loopActiveRef = useRef(false)

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
    return () => {
      cancelled = true
    }
  }, [])

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return
    loopActiveRef.current = true

    const tick = async () => {
      if (!loopActiveRef.current) return
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        try {
          const result = await analyzeEmotion(video)
          if (!loopActiveRef.current) return
          setEmotion(result)
        } catch (err) {
          console.error('감정 분석 실패:', err)
        }
      }
      if (loopActiveRef.current) {
        setTimeout(tick, ANALYSIS_INTERVAL_MS)
      }
    }
    tick()
  }, [])

  const stopLoop = useCallback(() => {
    loopActiveRef.current = false
  }, [])

  const handleCameraReady = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video
      setCameraError(null)
      startLoop()
    },
    [startLoop],
  )

  const handleCameraError = useCallback((err: Error) => {
    setCameraError(err.message)
    setActive(false)
    setEmotion(null)
  }, [])

  useEffect(() => {
    if (!active) {
      stopLoop()
      videoRef.current = null
    }
  }, [active, stopLoop])

  const handleStart = () => {
    if (modelStatus !== 'ready') return
    setCameraError(null)
    setActive(true)
  }

  const handleStop = () => {
    setActive(false)
    setEmotion(null)
  }

  return (
    <main className="min-h-screen bg-ink-50 px-6 py-12">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">온마음</h1>
          <p className="mt-2 text-sm text-ink-500">
            Step 2 · 실시간 감정 분석
          </p>
        </header>

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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={active || modelStatus !== 'ready'}
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

        {active && <EmotionDisplay emotion={emotion} />}
      </section>
    </main>
  )
}
