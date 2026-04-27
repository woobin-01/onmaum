'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div
      data-theme="landing"
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <h1 className="text-4xl font-thin tracking-tight">온마음</h1>
      <p className="text-sm opacity-60">랜딩페이지 placeholder — 다음 task에서 채움</p>
      <Link
        href="/measure"
        className="rounded-full bg-risk-good px-6 py-3 text-sm font-medium text-white"
      >
        앱 시작하기
      </Link>
    </div>
  )
}
