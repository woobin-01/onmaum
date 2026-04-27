'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '#features', label: '기능' },
  { href: '#data', label: '데이터' },
  { href: '#risk', label: '위험도' },
] as const

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[52px] py-[26px] transition-all duration-400 ${
        scrolled
          ? 'border-b border-white/[0.06] bg-[rgba(5,5,3,0.75)] backdrop-blur-[20px]'
          : ''
      }`}
    >
      <div className="flex items-center gap-[10px]">
        <span
          aria-hidden="true"
          className="inline-block h-[22px] w-[22px] rounded-full bg-gradient-to-br from-[#6BAB9A] to-[#4E9080] shadow-[0_0_24px_rgba(107,171,154,0.4)]"
        />
        <span className="text-[13px] font-light uppercase tracking-[0.14em] text-[rgba(240,237,230,0.65)]">
          온마음
        </span>
      </div>

      <div className="hidden items-center gap-9 text-[11px] font-light uppercase tracking-[0.1em] text-[rgba(240,237,230,0.38)] md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-[#F0EDE6]"
          >
            {link.label}
          </a>
        ))}
      </div>

      <Link
        href="/measure"
        className="rounded-full border border-[rgba(107,171,154,0.3)] px-6 py-[9px] text-[11px] font-normal uppercase tracking-[0.1em] text-[rgba(107,171,154,0.85)] transition-all hover:border-[#6BAB9A] hover:bg-[rgba(107,171,154,0.06)] hover:text-[#6BAB9A]"
      >
        앱 시작하기
      </Link>
    </nav>
  )
}
