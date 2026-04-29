'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const TABS = [
  { href: '/measure', label: '측정' },
  { href: '/stats', label: '통계' },
] as const

export default function Navigation() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-base)]">
      <div className="mx-auto flex w-full max-w-md items-center">
        <div className="flex flex-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 py-4 text-center text-[12px] font-light uppercase tracking-[0.16em] transition-colors ${
                  active
                    ? 'border-b border-[var(--accent)] text-[var(--fg)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                — {tab.label}
              </Link>
            )
          })}
        </div>
        <div className="px-3">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
