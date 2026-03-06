'use client'

import { LandingThemeProvider, useLandingTheme } from '@/contexts/LandingThemeContext'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingWorkouts } from '@/components/landing/LandingWorkouts'
import { LandingSchedule } from '@/components/landing/LandingSchedule'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingBooking } from '@/components/landing/LandingBooking'
import { LandingMarquee } from '@/components/landing/LandingMarquee'
import { LandingLevels } from '@/components/landing/LandingLevels'
import { LandingFooter } from '@/components/landing/LandingFooter'

function LandingPageInner() {
  const { isDark } = useLandingTheme()
  return (
    <div id="main-content" className={isDark ? 'bg-black text-white min-h-screen' : 'bg-[#f8f9fa] text-[#0f0f0f] min-h-screen'}>
      {/* Container border rails */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <div
          className={`max-w-6xl mx-auto h-full sm:border-x ${
            isDark ? 'border-[rgba(255,255,255,0.10)]' : 'border-[rgba(0,0,0,0.12)]'
          }`}
        />
      </div>
      <LandingNav />
      <LandingHero />
      <LandingWorkouts />
      <LandingSchedule />
      <LandingLevels />
      <LandingPricing />
      <LandingBooking />
      {/* <LandingTestimonials /> — hidden until reviews come in */}
      <LandingFooter />
    </div>
  )
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingPageInner />
    </LandingThemeProvider>
  )
}
