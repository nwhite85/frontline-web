import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingWorkouts } from '@/components/landing/LandingWorkouts'
import { LandingSchedule } from '@/components/landing/LandingSchedule'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingBooking } from '@/components/landing/LandingBooking'
import { LandingLevels } from '@/components/landing/LandingLevels'
import { LandingFooter } from '@/components/landing/LandingFooter'
import {
  getCachedMembershipPlans,
  getCachedClasses,
  getCachedSchedule,
  getCachedBookingOptions,
} from '@/lib/landing-cache'

export default async function LandingPage() {
  // Date ranges for schedule and booking
  const today = new Date()
  const startDate = today.toISOString().split('T')[0]
  const scheduleEnd = new Date(today)
  scheduleEnd.setDate(today.getDate() + 6)
  const scheduleEndDate = scheduleEnd.toISOString().split('T')[0]
  const bookingEnd = new Date(today)
  bookingEnd.setDate(today.getDate() + 14)
  const bookingEndDate = bookingEnd.toISOString().split('T')[0]

  // Fetch all landing data server-side (cached)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, classes, schedules, bookingOptions] = await Promise.all([
    getCachedMembershipPlans(),
    getCachedClasses(),
    getCachedSchedule(startDate, scheduleEndDate),
    getCachedBookingOptions(startDate, bookingEndDate),
  ]) as [any[], any[], any[], any[]]

  return (
    <div id="main-content" className="bg-black text-white min-h-screen">
      {/* Container border rails */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="max-w-6xl mx-auto h-full sm:border-x border-[rgba(255,255,255,0.10)]" />
      </div>
      <LandingNav />
      <LandingHero />
      <LandingWorkouts initialClasses={classes} />
      <LandingSchedule initialSchedules={schedules} />
      <LandingLevels />
      <LandingPricing initialPlans={plans} />
      <LandingBooking initialOptions={bookingOptions} />
      {/* <LandingTestimonials /> — hidden until reviews come in */}
      <LandingFooter />
    </div>
  )
}
