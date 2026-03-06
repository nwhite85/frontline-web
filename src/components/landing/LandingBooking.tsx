'use client'

import { useState, FormEvent } from 'react'
import { Container } from '@/components/ui/container'
import { Input } from '@/components/ui/input'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ScheduleOption {
  value: string
  label: string
}

type RawBookingOption = { id: string; scheduled_date: string; start_time: string; class?: { name?: string } }

function mapToOptions(raw: RawBookingOption[]): ScheduleOption[] {
  return raw.map((s) => {
    const d = new Date(s.scheduled_date + 'T00:00:00')
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' })
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const className = s.class?.name || 'Class'
    const time = (s.start_time || '').substring(0, 5)
    return {
      value: s.id,
      label: `${dayName} ${dateStr} – ${className} at ${time}`,
    }
  })
}

export function LandingBooking({ initialOptions }: { initialOptions?: RawBookingOption[] }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [classScheduleId, setClassScheduleId] = useState('')
  const [options] = useState<ScheduleOption[]>(() => mapToOptions(initialOptions ?? []))
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !classScheduleId) {
        throw new Error('Please fill in all fields')
      }

      const response = await fetch('/api/bookings/trialist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          classScheduleId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book class')
      }

      setSuccess(true)
      setFirstName('')
      setLastName('')
      setEmail('')
      setClassScheduleId('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to book class. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Input class — adapts to theme
  const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-colors bg-white/5 border-white/10 text-white placeholder:text-white/30'

  const labelClass = `block text-sm font-medium mb-1.5 text-white/70`

  return (
    <section id="booking" className="relative py-24 overflow-hidden">
      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/photos/img_trial.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
        style={{ filter: 'brightness(0.22)' }}
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`} />
      {/* Desktop only: constrained width + side fades */}
      <div className="hidden sm:flex absolute inset-0 justify-center pointer-events-none">
        <div className="relative w-full h-full" style={{ maxWidth: '85rem' }}>
          <div className="absolute inset-y-0 left-0 w-56 xl:w-80 bg-gradient-to-r from-black to-transparent" />
          <div className="absolute inset-y-0 right-0 w-56 xl:w-80 bg-gradient-to-l from-black to-transparent" />
        </div>
      </div>
      {/* Desktop only: black sides outside 85rem */}
      <div className="hidden sm:block absolute inset-y-0 left-0 bg-black pointer-events-none" style={{ width: 'calc((100% - 85rem) / 2)' }} />
      <div className="hidden sm:block absolute inset-y-0 right-0 bg-black pointer-events-none" style={{ width: 'calc((100% - 85rem) / 2)' }} />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy (always white; it's over the dark photo) */}
          <div>
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
              Try a class
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold uppercase text-white mb-4 leading-tight">
              Fresh Air.<br />Fresh Start.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              It all begins with one session. The community and results keep people coming back.
            </p>
          </div>

          {/* Right — form card */}
          <div>
            <h3 className={`text-xl font-semibold mb-6 text-white`}>
              Book Your Free Class
            </h3>

            {success ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle className="text-emerald-400" size={48} />
                <p className={`text-base font-medium text-white`}>
                  Thanks for booking! We&apos;ll be in touch soon to confirm your free trial class.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="booking-first" className={labelClass}>First Name</label>
                    <Input
                      id="booking-first"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-brand-blue/50"
                      />
                  </div>
                  <div>
                    <label htmlFor="booking-last" className={labelClass}>Last Name</label>
                    <Input
                      id="booking-last"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-brand-blue/50"
                      />
                  </div>
                </div>

                <div>
                  <label htmlFor="booking-email" className={labelClass}>Email Address</label>
                  <Input
                    id="booking-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-brand-blue/50"
                    />
                </div>

                <div>
                  <label htmlFor="booking-class" className={labelClass}>Select a Class</label>
                  <select
                    id="booking-class"
                    value={classScheduleId}
                    onChange={(e) => setClassScheduleId(e.target.value)}
                    required
                    className={`${inputClass} appearance-none cursor-pointer`}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" disabled className={'bg-[#1a1a1a]'}>
                      Choose a class…
                    </option>
                    {options.length === 0 ? (
                      <option value="none" disabled className={'bg-[#1a1a1a]'}>
                        No upcoming classes available
                      </option>
                    ) : (
                      options.map((opt) => (
                        <option key={opt.value} value={opt.value} className={'bg-[#1a1a1a]'}>
                          {opt.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-full bg-brand-blue hover:bg-brand-blue/85 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {submitting ? 'Booking…' : 'Book your free class'}
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
