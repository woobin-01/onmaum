'use client'

import { createPortal } from 'react-dom'
import EmotionOrb from './EmotionOrb'
import { useOrbPip } from '@/hooks/useOrbPip'
import type { EmotionResult } from '@/lib/emotionAnalysis'

interface Props {
  emotions: EmotionResult
  recordCount: number
}

/** 오브를 Document PiP 창으로 띄우는 버튼. 미지원 브라우저면 렌더하지 않음. */
export default function OrbPipButton({ emotions, recordCount }: Props) {
  const pip = useOrbPip()
  if (!pip.supported) return null

  return (
    <>
      <button
        type="button"
        onClick={() => (pip.isOpen ? pip.close() : void pip.open())}
        className="w-full rounded-full border border-ink-300 bg-white px-6 py-3 font-medium text-ink-700 transition-colors hover:bg-ink-100"
      >
        {pip.isOpen ? '오브 창 닫기' : '🫧 오브 띄우기 (항상 위에)'}
      </button>
      {pip.container &&
        createPortal(
          <EmotionOrb emotions={emotions} recordCount={recordCount} size={180} />,
          pip.container,
        )}
    </>
  )
}
