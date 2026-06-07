'use client'

import { useCallback, useEffect, useState } from 'react'
import CameraView from '@/components/CameraView'
import EmotionDisplay from '@/components/EmotionDisplay'
import RiskWarningModal from '@/components/RiskWarningModal'
import SessionStressSummary from '@/components/SessionStressSummary'
import StressAlertBanner from '@/components/StressAlertBanner'
import StressAlertOrb from '@/components/StressAlertOrb'
import { useEmotionRecorder } from '@/hooks/useEmotionRecorder'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { useStressAlert } from '@/hooks/useStressAlert'
import { loadFaceApiModels } from '@/lib/emotionAnalysis'
import { db } from '@/lib/db'
import type { StressSessionSummary as StressSessionSummaryType, StressState } from '@/lib/stressTypes'

type ModelStatus = 'loading' | 'ready' | 'error'

export default function Home() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [modelError, setModelError] = useState<string | null>(null)
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showSessionSummary, setShowSessionSummary] = useState(false)

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

  const { currentEmotion, saveError } = useEmotionRecorder({
    active,
    videoEl,
  })

  // TODO: 스트레스 판별 담당자 구현 연결 예정.
  // 아래 둘 중 하나가 준비되면 연결한다.
  //   const { stressScore, stressLevel } = useCurrentStressState(currentEmotion)
  //   const stressState = getStressStateFromEmotion(currentEmotion)
  // 빌드가 깨지지 않도록 우선 null로 둔다.
  const stressState: StressState | null = null
  const stressScore = stressState?.stressScore ?? null
  const stressLevel = stressState?.stressLevel ?? null

  // TODO: 스트레스 판별 담당자가 세션 요약(StressSessionSummary)을 계산해 연결할 예정.
  // 계산 로직은 이 파일에서 만들지 않는다.
  const sessionSummary: StressSessionSummaryType | null = null

  const { permission } = useNotificationPermission()

  const {
    alertLevel,
    alertTitle,
    alertMessage,
    recommendation,
    shouldShowOrbBubble,
    shouldShowBanner,
    shouldShowModal,
    dismissAlert,
  } = useStressAlert({
    active,
    sessionId,
    stressScore,
    stressLevel,
    permission,
    mode: 'realtime',
  })

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
    setShowSessionSummary(false)
    setSessionId(`session-${Date.now()}`)
    setActive(true)
  }

  const handleStop = () => {
    setActive(false)
    setVideoEl(null)
    setShowSessionSummary(true)
  }

  const handleCloseSummary = () => {
    setShowSessionSummary(false)
    setSessionId(null)
  }

  const startDisabled = active || modelStatus !== 'ready' || !dbReady

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">측정</h1>
          <p className="mt-2 text-sm text-ink-500">실시간 감정 분석</p>
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

        <p className="text-center text-xs text-ink-400">
          발표 시연에서는 측정 시작을 통화 시작 상황으로 가정합니다.
          <br />
          측정을 종료하면 이번 세션의 피드백을 확인할 수 있습니다.
        </p>

        {active && <EmotionDisplay emotion={currentEmotion} />}

        {active && shouldShowBanner && (
          <StressAlertBanner
            open={shouldShowBanner}
            level={alertLevel}
            title={alertTitle}
            message={alertMessage}
            recommendation={recommendation}
            onClose={dismissAlert}
          />
        )}

        {showSessionSummary && (
          <SessionStressSummary summary={sessionSummary} onClose={handleCloseSummary} />
        )}
      </section>

      {active && (
        <StressAlertOrb
          stressScore={stressScore}
          stressLevel={stressLevel}
          bubbleMessage={alertMessage}
          showBubble={shouldShowOrbBubble}
        />
      )}

      <RiskWarningModal
        open={active && shouldShowModal}
        onClose={dismissAlert}
        stressScore={stressScore}
        title={alertTitle ?? undefined}
        message={alertMessage ?? undefined}
        recommendation={recommendation ?? undefined}
        mode="realtime"
      />
    </main>
  )
}
