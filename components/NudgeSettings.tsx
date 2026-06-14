'use client'

import { useState } from 'react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { loadSettings, saveSettings, type Settings } from '@/lib/settings'

export default function NudgeSettings() {
  const { supported, permission, request } = useNotificationPermission()
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  const update = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }

  const toggle = async () => {
    const enabling = !settings.nudge.enabled
    if (enabling && supported && permission === 'default') await request()
    update({ ...settings, nudge: { ...settings.nudge, enabled: enabling } })
  }

  return (
    <div className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-900">🌿 안전판 넛지</p>
          <p className="mt-1 text-xs text-ink-500">
            마음에 힘이 오래 들어가 있으면 살며시 쉬어가자고 알려드려요
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.nudge.enabled}
          aria-label="넛지 알림"
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            settings.nudge.enabled ? 'bg-risk-good' : 'bg-ink-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              settings.nudge.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {settings.nudge.enabled && (
        <label className="flex items-center justify-between text-xs text-ink-600">
          하루 최대 알림
          <select
            value={settings.nudge.maxPerDay}
            onChange={(e) =>
              update({
                ...settings,
                nudge: { ...settings.nudge, maxPerDay: Number(e.target.value) },
              })
            }
            className="rounded-lg border border-ink-300 px-2 py-1"
          >
            <option value={1}>1회</option>
            <option value={2}>2회</option>
            <option value={3}>3회</option>
          </select>
        </label>
      )}

      {supported && permission === 'denied' && (
        <p className="text-xs text-ink-400">브라우저 알림이 차단돼 앱 안에서만 알려드려요</p>
      )}
    </div>
  )
}
