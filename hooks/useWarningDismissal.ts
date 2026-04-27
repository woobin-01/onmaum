'use client'

import { useCallback, useEffect, useState } from 'react'

interface Result {
  dismissed: boolean
  dismiss: () => void
}

function storageKey(date: string): string {
  return `onmaum-warning-dismissed-${date}`
}

function readDismissed(date: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(date)) === 'true'
  } catch {
    return false
  }
}

export function useWarningDismissal(date: string): Result {
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(date))

  // date prop 변경 시 새 key로 다시 읽음. cascading render 아님 (date 변경 시만).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(readDismissed(date))
  }, [date])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(storageKey(date), 'true')
    } catch (err) {
      console.error('sessionStorage 쓰기 실패:', err)
    }
    setDismissed(true)
  }, [date])

  return { dismissed, dismiss }
}
