// components/LivingOrbProvider.tsx
'use client'

import { createContext, useCallback, useContext, useState } from 'react'
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

  return (
    <LivingOrbContext.Provider value={{ liveEmotion, active, setLive }}>
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
