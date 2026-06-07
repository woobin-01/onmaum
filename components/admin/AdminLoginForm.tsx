'use client'

import { useState, type FormEvent } from 'react'

interface Props {
  onSuccess: (code: string) => boolean
}

export default function AdminLoginForm({ onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const ok = onSuccess(code)
    if (!ok) {
      setError('관리자 코드가 올바르지 않습니다.')
      return
    }
    setError(null)
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-ink-900">관리자 코드 입력</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          이 화면은 발표 시연을 위한 간이 접근 제어입니다.
          <br />
          실제 서비스에서는 서버 기반 인증과 권한 검증이 필요합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-ink-700" htmlFor="admin-code">
          관리자 코드
        </label>
        <div className="flex overflow-hidden rounded-xl border border-ink-300 bg-white focus-within:border-risk-good">
          <input
            id="admin-code"
            type={showCode ? 'text' : 'password'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="관리자 코드를 입력하세요"
            className="min-w-0 flex-1 px-4 py-3 text-sm text-ink-900 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCode((visible) => !visible)}
            className="shrink-0 border-l border-ink-200 px-3 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50"
            aria-label={showCode ? '관리자 코드 숨기기' : '관리자 코드 보기'}
          >
            {showCode ? '숨기기' : '보기'}
          </button>
        </div>

        {error && <p className="text-center text-xs text-risk-warning">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-full bg-risk-good px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          입장하기
        </button>
      </form>
    </div>
  )
}
