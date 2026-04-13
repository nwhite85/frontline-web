import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingWorkouts } from '@/components/landing/LandingWorkouts'
import { LandingSchedule } from '@/components/landing/LandingSchedule'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingBooking } from '@/components/landing/LandingBooking'
import { LandingLevels } from '@/components/landing/LandingLevels'
import { LandingLocation } from '@/components/landing/LandingLocation'
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

  // Sample week for pre-launch display (w/c Mon 13 Apr 2026)
  const sampleWeekStart = '2026-04-13'
  const sampleWeekEnd = '2026-04-19'

  // Fetch all landing data server-side (cached)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, classes, schedules, bookingOptions, sampleSchedules] = await Promise.all([
    getCachedMembershipPlans(),
    getCachedClasses(),
    getCachedSchedule(startDate, scheduleEndDate),
    getCachedBookingOptions(startDate, bookingEndDate),
    getCachedSchedule(sampleWeekStart, sampleWeekEnd),
  ]) as [any[], any[], any[], any[], any[]]

  return (
    <div id="main-content" className="bg-black text-white min-h-screen">
      {/* Container border rails — desktop only, start below the nav bar */}
      <div className="fixed inset-0 sm:top-16 pointer-events-none z-[60]">
        <div className="max-w-6xl mx-auto h-full sm:border-x border-[rgba(255,255,255,0.10)]" />
      </div>
      <LandingNav />
      <LandingHero />
      <LandingWorkouts initialClasses={classes} />
      <LandingSchedule initialSchedules={schedules} sampleSchedules={sampleSchedules} />
      <LandingLevels />
      <LandingPricing initialPlans={plans} />
      <LandingBooking initialOptions={bookingOptions} />
      <LandingLocation />
      {/* <LandingTestimonials /> — hidden until reviews come in */}
      <LandingFooter />
    </div>
  )
}
