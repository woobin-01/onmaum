'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const TABS = [
  { href: '/', label: '측정' },
  { href: '/stats', label: '통계' },
  { href: '/admin', label: '관리자' },
] as const

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAdminAuth()

  return (
    <nav className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex w-full max-w-md items-center">
        <div className="flex flex-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                  active
                    ? 'border-b-2 border-risk-good text-ink-900'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={logout}
            className="mr-3 shrink-0 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100"
          >
            관리자 모드 · 로그아웃
          </button>
        )}
      </div>
    </nav>
  )
}
