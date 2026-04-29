// components/LivingOrbProvider.tsx
'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { EmotionResult } from '@/lib/emotionAnalysis'

interface Value {
  liveEmotion: EmotionResult | null
  active: boolean
  setLive: (emotion: EmotionResult | null, active: boolean) => void
}

const LivingOrbContext = createContext<Value | null>(null)

export function LivingOrbProvider({ children }: { children: React.ReactNode }) {
  const [liveEmotion, setLiveEmotion] = useState<EmotionResult | null>(null)
  const [active, setActive] = useState(false)

  const setLive = useCallback(
    (emotion: EmotionResult | null, isActive: boolean) => {
      setLiveEmotion(emotion)
      setActive(isActive)
    },
    [],
  )

  // ThemeProvider 와 동일 패턴 — value 객체 안정화로 consumer 리렌더 최소화.
  const value = useMemo(
    () => ({ liveEmotion, active, setLive }),
    [liveEmotion, active, setLive],
  )

  return (
    <LivingOrbContext.Provider value={value}>
      {children}
    </LivingOrbContext.Provider>
  )
}

export function useLivingOrbInput(): Value {
  const ctx = useContext(LivingOrbContext)
  if (!ctx) {
    throw new Error('useLivingOrbInput must be used within <LivingOrbProvider>')
  }
  return ctx
}
