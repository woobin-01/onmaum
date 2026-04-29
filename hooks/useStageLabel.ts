'use client'

import { useEffect, useRef, useState } from 'react'
import { isStageHigher, STAGE_ORDER, type OrbStage } from '@/lib/orbStages'
import { getStageLabelMessage } from '@/lib/stageLabels'

const STORAGE_KEY = 'onmaum_orb_stage_max'

const FADE_IN_MS = 300
const HOLD_MS = 2700
// 페이드아웃 600ms 는 CSS transition 이 처리 (JS 미사용). 트리거 시점 기준 총 3.6초에 완전 사라짐.
const VISIBLE_MS = FADE_IN_MS + HOLD_MS // 3000ms — visible=false 트리거 시점

export interface StageLabelOutput {
  visible: boolean
  message: string | null
}

function readMax(): OrbStage {
  if (typeof window === 'undefined') return 'empty'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && (STAGE_ORDER as readonly string[]).includes(v)) return v as OrbStage
  } catch {}
  return 'empty'
}

function writeMax(stage: OrbStage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, stage)
  } catch {}
}

export function useStageLabel(currentStage: OrbStage): StageLabelOutput {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prevMax = readMax()
    if (!isStageHigher(currentStage, prevMax)) return

    const msg = getStageLabelMessage(currentStage)
    if (msg === null) return

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    writeMax(currentStage)
    setMessage(msg)
    setVisible(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      timerRef.current = null
    }, VISIBLE_MS)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentStage])

  return { visible, message }
}
