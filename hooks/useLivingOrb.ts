'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
  hueFromWeeklyEmotion,
  motionFromFrequency,
  opacityFromCount,
  saturationFromIntensity,
} from '@/lib/orbAxes'
import { stageFromCount, type OrbStage } from '@/lib/orbStages'
import { aggregateWeeklyEmotion } from '@/lib/weeklyEmotion'
import type { EmotionResult } from '@/lib/emotionAnalysis'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
const NEUTRAL_HUE = 'rgb(107,171,154)'
const NEUTRAL_GRAY = 'rgb(163,163,163)'

export type OrbFallback = 'idle' | 'inactive2w' | 'error' | null

export interface OrbAxes {
  opacity: number
  hue: string
  saturation: number
  motion: number
}

export interface LivingOrbState {
  stage: OrbStage
  axes: OrbAxes
  fallback: OrbFallback
}

interface Options {
  liveEmotion?: EmotionResult | null
  active?: boolean
}

const NEUTRAL_AXES: OrbAxes = {
  opacity: 0.15,
  hue: NEUTRAL_HUE,
  saturation: 0.3,
  motion: 0.3,
}

const ERROR_AXES: OrbAxes = {
  opacity: 0.3,
  hue: NEUTRAL_GRAY,
  saturation: 0.3,
  motion: 0.3,
}

export function useLivingOrb(opts: Options = {}): LivingOrbState {
  const { liveEmotion = null, active = false } = opts

  const records = useLiveQuery(async () => {
    try {
      return await db.emotions.toArray()
    } catch (err) {
      console.error('Living Orb DB read failed:', err)
      return null
    }
  }, [])

  return useMemo<LivingOrbState>(() => {
    if (records === null) {
      return { stage: 'empty', axes: ERROR_AXES, fallback: 'error' }
    }
    if (records === undefined) {
      // 첫 마운트 직후 — 로딩 중
      return { stage: 'empty', axes: NEUTRAL_AXES, fallback: 'idle' }
    }
    if (records.length === 0) {
      return { stage: 'empty', axes: NEUTRAL_AXES, fallback: 'idle' }
    }

    const stage = stageFromCount(records.length)
    const now = new Date()
    const weekly = aggregateWeeklyEmotion(records, now)

    const lastRecord = records.reduce(
      (latest, r) =>
        r.timestamp.getTime() > latest.timestamp.getTime() ? r : latest,
      records[0],
    )
    const inactiveLong =
      now.getTime() - lastRecord.timestamp.getTime() > TWO_WEEKS_MS

    let opacity = opacityFromCount(records.length)
    if (inactiveLong) opacity *= 0.5

    let hue: string
    if (active && liveEmotion) {
      hue = hueFromWeeklyEmotion(liveEmotion)
    } else if (weekly) {
      hue = hueFromWeeklyEmotion(weekly.emotions)
    } else {
      hue = NEUTRAL_HUE
    }

    const saturation = weekly
      ? saturationFromIntensity(weekly.negativeRatio, weekly.flatAffectAvg)
      : 0.3

    const motion = weekly ? motionFromFrequency(weekly.daysOutOfSeven) : 0.3

    return {
      stage,
      axes: { opacity, hue, saturation, motion },
      fallback: inactiveLong ? 'inactive2w' : null,
    }
  }, [records, liveEmotion, active])
}
