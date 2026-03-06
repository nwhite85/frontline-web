import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingWorkouts } from '@/components/landing/LandingWorkouts'
import { LandingSchedule } from '@/components/landing/LandingSchedule'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingBooking } from '@/components/landing/LandingBooking'
import { LandingLevels } from '@/components/landing/LandingLevels'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div id="main-content" className="bg-black text-white min-h-screen">
      {/* Container border rails */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="max-w-6xl mx-auto h-full sm:border-x border-[rgba(255,255,255,0.10)]" />
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
