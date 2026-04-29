// components/LivingOrbHost.tsx
'use client'

import { useLivingOrb } from '@/hooks/useLivingOrb'
import { useStageLabel } from '@/hooks/useStageLabel'
import LivingOrb from './LivingOrb'
import { useLivingOrbInput } from './LivingOrbProvider'
import StageLabel from './StageLabel'

export default function LivingOrbHost() {
  const { liveEmotion, active } = useLivingOrbInput()
  const { stage, axes } = useLivingOrb({ liveEmotion, active })
  const { visible, message } = useStageLabel(stage)

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-40 inline-flex items-center gap-2.5 md:right-8 md:top-8">
      <StageLabel visible={visible} message={message} />
      <LivingOrb
        stage={stage}
        opacity={axes.opacity}
        hue={axes.hue}
        saturation={axes.saturation}
        motion={axes.motion}
        size={56}
        variant="decoration"
      />
    </div>
  )
}
