'use client'

import LandingHero from '@/components/LandingHero'
import LandingNav from '@/components/LandingNav'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function LandingPage() {
  useScrollReveal()

  return (
    <div
      data-theme="landing"
      className="min-h-screen bg-[#050503] text-[#F0EDE6]"
    >
      <LandingNav />
      <LandingHero />
      {/* TODO: Features / Data / Risk / CTA / Footer (다음 task) */}
    </div>
  )
}
