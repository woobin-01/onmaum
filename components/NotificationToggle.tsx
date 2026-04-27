'use client'

import { useNotificationPermission } from '@/hooks/useNotificationPermission'

export default function NotificationToggle() {
  const { supported, permission, request } = useNotificationPermission()

  if (!supported) return null

  const handleEnable = () => {
    if (permission === 'default') {
      void request()
    }
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-900">🔔 위험 신호 알림</p>
          <p className="mt-1 text-xs text-ink-500">
            마음 상태가 위험할 때 브라우저 알림으로 알려드릴게요
          </p>
        </div>
        {permission === 'default' && (
          <button
            type="button"
            onClick={handleEnable}
            className="rounded-full bg-risk-good px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            알림 받기
          </button>
        )}
        {permission === 'granted' && (
          <span className="rounded-full bg-risk-good/10 px-3 py-1 text-xs font-medium text-risk-good">
            ✓ 켜짐
          </span>
        )}
        {permission === 'denied' && (
          <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
            ✗ 차단됨
          </span>
        )}
      </div>
      {permission === 'denied' && (
        <p className="mt-2 text-xs text-ink-400">
          브라우저 설정에서 알림 권한을 허용해 주세요
        </p>
      )}
    </div>
  )
}
