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

  // Start from Monday of the current week so the full week shows
  const monday = new Date(today)
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + daysToMonday)
  const startDate = monday.toISOString().split('T')[0]

  // Schedule: current week Mon → next week Sun (13 days)
  const scheduleEnd = new Date(monday)
  scheduleEnd.setDate(monday.getDate() + 13)
  const scheduleEndDate = scheduleEnd.toISOString().split('T')[0]

  // Booking dropdown: today → 3 weeks out
  const bookingEnd = new Date(today)
  bookingEnd.setDate(today.getDate() + 21)
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
      {/* Container border rails — disabled for A/B test */}
      {/* <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="max-w-6xl mx-auto h-full sm:border-x border-[rgba(255,255,255,0.10)]" />
      </div> */}
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
