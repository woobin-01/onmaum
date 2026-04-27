'use client'

import LandingCTA from '@/components/LandingCTA'
import LandingData from '@/components/LandingData'
import LandingFeatures from '@/components/LandingFeatures'
import LandingFooter from '@/components/LandingFooter'
import LandingHero from '@/components/LandingHero'
import LandingNav from '@/components/LandingNav'
import LandingRisk from '@/components/LandingRisk'
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
      <LandingFeatures />
      <LandingData />
      <LandingRisk />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
