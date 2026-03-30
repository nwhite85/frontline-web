'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { CalendarDays, Trophy, CheckCircle2, Users, Clock, MapPin } from 'lucide-react'
import ClientShell from '@/components/client/ClientShell'
import type { UserProfile, ClassSchedule, Appointment, ChallengeSchedule, ClientEvent } from '@/types/client'
import { formatDate, formatTime } from '@/lib/format'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'

type Tab = 'classes' | 'appointments' | 'checkpoints' | 'events'

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
    </div>
  )
}

const initials = (name: string) =>
  name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

interface Booking {
  id: string
  client_id: string
  booking_status: string
  booking_date: string
  user_profiles: { name: string; email: string }
}

function ParticipantRow({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-8 w-8 rounded-full bg-brand-blue/20 border border-brand-blue/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-brand-blue">
          {initials(booking.user_profiles.name)}
        </span>
      </div>
      <span className="text-sm text-white">{booking.user_profiles.name}</span>
    </div>
  )
}

// ─── Class Detail Sheet ───────────────────────────────────────────────────────

interface ClassDetailSheetProps {
  schedule: ClassSchedule | null
  open: boolean
  onClose: () => void
  onBooked: () => void
  onCancelled: () => void
  userId: string
  bookingStatus: string | undefined
}

function ClassDetailSheet({
  schedule,
  open,
  onClose,
  onBooked,
  onCancelled,
  userId,
  bookingStatus,
}: ClassDetailSheetProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !schedule) return
    setLoadingBookings(true)
    setError(null)
    fetch(`/api/class-bookings?classScheduleId=${schedule.id}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
  }, [open, schedule])

  if (!schedule) return null

  const confirmed = bookings.filter(b => b.booking_status === 'confirmed')
  const waitlist = bookings.filter(b => b.booking_status === 'waitlist')
  const booked = schedule.current_bookings ?? 0
  const cap = schedule.class?.max_capacity ?? 0
  const isFull = cap > 0 && booked >= cap
  const isBooked = !!bookingStatus
  const isWaitlisted = bookingStatus === 'waitlist'

  const handleBook = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/book-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: schedule.id, clientId: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to book class')
        return
      }
      onBooked()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cancel-class-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: schedule.id, clientId: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to cancel booking')
        return
      }
      onCancelled()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0f1a] border-white/10 text-white max-h-[85vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-2 shrink-0">
          <SheetTitle className="text-white text-lg font-semibold">
            {schedule.class?.name ?? 'Class'}
          </SheetTitle>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(schedule.scheduled_date)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(schedule.start_time)}
            </span>
            {schedule.class?.location && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin className="h-3.5 w-3.5" />
                {schedule.class.location}
              </span>
            )}
          </div>
          {schedule.class?.description && (
            <p className="text-sm text-white/40 mt-2 whitespace-pre-line">{schedule.class.description}</p>
          )}
        </SheetHeader>

        <SheetBody className="gap-0 overflow-y-auto flex-1">
          {/* Confirmed participants */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-white/40" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Participants ({confirmed.length}{cap > 0 ? `/${cap}` : ''})
              </span>
            </div>
            {loadingBookings ? (
              <div className="py-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
              </div>
            ) : confirmed.length === 0 ? (
              <p className="text-sm text-white/30 py-3">No confirmed bookings yet</p>
            ) : (
              <div className="divide-y divide-white/5">
                {confirmed.map(b => (
                  <ParticipantRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          {/* Waitlist */}
          {waitlist.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">
                Waitlist ({waitlist.length})
              </span>
              <div className="divide-y divide-white/5 mt-1">
                {waitlist.map(b => (
                  <ParticipantRow key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 pt-2">{error}</p>}
        </SheetBody>

        <SheetFooter className="flex-col gap-2 shrink-0 !flex-col sm:max-w-sm sm:mx-auto w-full">
          {isBooked ? (
            <Button
              size="xl"
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling…' : isWaitlisted ? 'Leave Waitlist' : 'Cancel Booking'}
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={handleBook}
              disabled={actionLoading || !!error}
            >
              {actionLoading ? 'Booking…' : isFull ? 'Join Waitlist' : 'Book Now'}
            </Button>
          )}
          <Button
            size="xl"
            className="w-full bg-white/10 hover:bg-white/15 text-white"
            onClick={onClose}
            disabled={actionLoading}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Challenge Detail Sheet ───────────────────────────────────────────────────

interface ChallengeDetailSheetProps {
  schedule: ChallengeSchedule | null
  open: boolean
  onClose: () => void
  onBooked: () => void
  onCancelled: () => void
  userId: string
  isBooked: boolean
}

function ChallengeDetailSheet({
  schedule,
  open,
  onClose,
  onBooked,
  onCancelled,
  userId,
  isBooked,
}: ChallengeDetailSheetProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !schedule) return
    setLoadingBookings(true)
    setError(null)
    fetch(`/api/challenge-bookings?scheduleId=${schedule.id}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
  }, [open, schedule])

  if (!schedule) return null

  const handleBook = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cancel-challenge-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeScheduleId: schedule.id,
          clientId: userId,
          action: 'book',
          trainerId: schedule.trainer_id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to sign up')
        return
      }
      onBooked()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cancel-challenge-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeScheduleId: schedule.id,
          clientId: userId,
          action: 'cancel',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to cancel')
        return
      }
      onCancelled()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0f1a] border-white/10 text-white max-h-[85vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-2 shrink-0">
          <SheetTitle className="text-white text-lg font-semibold">
            {schedule.challenge?.name ?? 'Challenge'}
          </SheetTitle>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(schedule.scheduled_date)}
            </span>
          </div>
          {schedule.challenge?.description && (
            <p className="text-sm text-white/40 mt-2 whitespace-pre-line">{schedule.challenge.description}</p>
          )}
        </SheetHeader>

        <SheetBody className="gap-0 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-white/40" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Participants ({bookings.length})
              </span>
            </div>
            {loadingBookings ? (
              <div className="py-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-white/30 py-3">No sign-ups yet</p>
            ) : (
              <div className="divide-y divide-white/5">
                {bookings.map(b => (
                  <ParticipantRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400 pt-2">{error}</p>}
        </SheetBody>

        <SheetFooter className="flex-col gap-2 shrink-0 !flex-col sm:max-w-sm sm:mx-auto w-full">
          {isBooked ? (
            <Button
              size="xl"
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling…' : 'Cancel Sign Up'}
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={handleBook}
              disabled={actionLoading}
            >
              {actionLoading ? 'Signing up…' : 'Sign Up'}
            </Button>
          )}
          <Button
            size="xl"
            className="w-full bg-white/10 hover:bg-white/15 text-white"
            onClick={onClose}
            disabled={actionLoading}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Event Detail Sheet ───────────────────────────────────────────────────────

interface EventDetailSheetProps {
  event: ClientEvent | null
  open: boolean
  onClose: () => void
  onBooked: () => void
  onCancelled: () => void
  userId: string
  isBooked: boolean
}

function EventDetailSheet({
  event,
  open,
  onClose,
  onBooked,
  onCancelled,
  userId,
  isBooked,
}: EventDetailSheetProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !event) return
    setLoadingBookings(true)
    setError(null)
    fetch(`/api/event-bookings?eventId=${event.id}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
  }, [open, event])

  if (!event) return null

  const handleBook = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/book-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, clientId: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to book event')
        return
      }
      onBooked()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cancel-event-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, clientId: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to cancel booking')
        return
      }
      onCancelled()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0f1a] border-white/10 text-white max-h-[85vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-2 shrink-0">
          <SheetTitle className="text-white text-lg font-semibold">{event.name}</SheetTitle>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(event.start_date)}
            </span>
            {event.start_time && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(event.start_time)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-white/40 mt-2 whitespace-pre-line">{event.description}</p>
          )}
        </SheetHeader>

        <SheetBody className="gap-0 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-white/40" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Attendees ({bookings.length})
              </span>
            </div>
            {loadingBookings ? (
              <div className="py-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-white/30 py-3">No bookings yet</p>
            ) : (
              <div className="divide-y divide-white/5">
                {bookings.map(b => (
                  <ParticipantRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400 pt-2">{error}</p>}
        </SheetBody>

        <SheetFooter className="flex-col gap-2 shrink-0 !flex-col sm:max-w-sm sm:mx-auto w-full">
          {isBooked ? (
            <Button
              size="xl"
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling…' : 'Cancel Booking'}
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={handleBook}
              disabled={actionLoading}
            >
              {actionLoading ? 'Booking…' : 'Book Now'}
            </Button>
          )}
          <Button
            size="xl"
            className="w-full bg-white/10 hover:bg-white/15 text-white"
            onClick={onClose}
            disabled={actionLoading}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────

function ClassesTab({ userId }: { userId: string }) {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [bookedIds, setBookedIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClassSchedule | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [justBooked, setJustBooked] = useState<Set<string>>(new Set())

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: schedData }, { data: bData }, { data: allBookings }] = await Promise.all([
      supabase
        .from('class_schedules')
        .select(
          'id, scheduled_date, start_time, end_time, location, max_capacity, current_bookings, status, trainer_id, class:class_id(name, description, location, duration_minutes, skill_level, max_capacity)'
        )
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase
        .from('class_bookings')
        .select('class_schedule_id, booking_status')
        .eq('client_id', userId)
        .in('booking_status', ['confirmed', 'waitlist']),
      supabase
        .from('class_bookings')
        .select('class_schedule_id')
        .in('booking_status', ['confirmed', 'waitlist']),
    ])

    const bookingCounts: Record<string, number> = {}
    for (const b of ((allBookings as { class_schedule_id: string }[]) ?? [])) {
      bookingCounts[b.class_schedule_id] = (bookingCounts[b.class_schedule_id] || 0) + 1
    }

    const enriched = ((schedData as ClassSchedule[]) ?? []).map(s => ({
      ...s,
      current_bookings: bookingCounts[s.id] ?? 0,
    }))

    setSchedules(enriched)
    const map: Record<string, string> = {}
    for (const b of ((bData as { class_schedule_id: string; booking_status: string }[]) ?? [])) {
      map[b.class_schedule_id] = b.booking_status
    }
    setBookedIds(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const handleBooked = async (scheduleId: string) => {
    setSheetOpen(false)
    setSelected(null)
    setJustBooked(prev => new Set(prev).add(scheduleId))
    await load()
  }

  const handleCancelled = async () => {
    setSheetOpen(false)
    setSelected(null)
    await load()
  }

  if (loading) return <Spinner />
  if (schedules.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/40 text-sm">No classes scheduled</p>
      </div>
    )

  const grouped: Record<string, ClassSchedule[]> = {}
  for (const s of schedules) {
    if (!grouped[s.scheduled_date]) grouped[s.scheduled_date] = []
    grouped[s.scheduled_date].push(s)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {Object.keys(grouped)
          .sort()
          .map(date => (
            <div key={date}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                {formatDate(date)}
              </p>
              <div className="flex flex-col gap-3">
                {grouped[date].map(s => {
                  const booked = s.current_bookings ?? 0
                  const cap = s.class?.max_capacity ?? 0
                  const isFull = cap > 0 && booked >= cap
                  const pct = cap > 0 ? Math.min((booked / cap) * 100, 100) : 0
                  const isBooked = !!bookedIds[s.id]
                  const wasJustBooked = justBooked.has(s.id)
                  const bookingStatus = bookedIds[s.id]
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5 cursor-pointer hover:border-white/20 transition-colors"
                      onClick={() => {
                        setSelected(s)
                        setSheetOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          {s.class?.name ?? 'Class'}
                        </span>
                        {isBooked ? (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-brand-blue text-brand-blue">
                            {wasJustBooked && bookingStatus === 'waitlist'
                              ? 'Waitlisted ✓'
                              : wasJustBooked
                              ? 'Booked ✓'
                              : bookingStatus === 'waitlist'
                              ? 'Waitlisted'
                              : 'Booked'}
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              isFull
                                ? 'border-red-500 text-red-400'
                                : 'border-green-500 text-green-400'
                            }`}
                          >
                            {isFull ? 'Full' : 'Available'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mb-2">
                        {formatDate(s.scheduled_date)} · {formatTime(s.start_time)} ·{' '}
                        {s.class?.location ?? '—'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/30 mb-1.5">
                        <span>Bookings</span>
                        <span>
                          {booked}/{cap}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-blue"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      <ClassDetailSheet
        schedule={selected}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setSelected(null)
        }}
        onBooked={() => handleBooked(selected!.id)}
        onCancelled={handleCancelled}
        userId={userId}
        bookingStatus={selected ? bookedIds[selected.id] : undefined}
      />
    </>
  )
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────

function AppointmentsTab({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      const { data: tc } = await (
        supabase
          .from('trainer_client')
          .select('appointment_status')
          .eq('client_id', userId)
          .maybeSingle() as unknown as Promise<{
          data: { appointment_status: string } | null
          error: unknown
        }>
      )
      if (tc && tc.appointment_status !== 'active') {
        setHasAccess(false)
        setLoading(false)
        return
      }
      setHasAccess(true)
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('appointments')
        .select('*, appointment_type:appointment_type_id(name)')
        .in('status', ['available', 'scheduled'])
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .limit(20)
      setAppointments((data as Appointment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId])
  if (loading) return <Spinner />
  if (hasAccess === false)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/40 text-sm">Personal training not included in your plan</p>
        <p className="text-white/30 text-xs">Contact us to upgrade</p>
      </div>
    )
  if (appointments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/40 text-sm">No appointments available</p>
      </div>
    )
  const grouped: Record<string, Appointment[]> = {}
  for (const a of appointments) {
    if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []
    grouped[a.appointment_date].push(a)
  }
  return (
    <div className="flex flex-col gap-6">
      {Object.keys(grouped)
        .sort()
        .map(date => (
          <div key={date}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              {formatDate(date)}
            </p>
            <div className="flex flex-col gap-3">
              {grouped[date].map(appt => (
                <div
                  key={appt.id}
                  className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {appt.appointment_type?.name ?? 'Personal Training'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        appt.status === 'scheduled'
                          ? 'border-brand-blue text-brand-blue'
                          : 'border-green-500 text-green-400'
                      }`}
                    >
                      {appt.status === 'scheduled' ? 'Booked' : 'Available'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {formatDate(appt.appointment_date)} · {formatTime(appt.start_time)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

// ─── Checkpoints Tab ──────────────────────────────────────────────────────────

function CheckpointsTab({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<ChallengeSchedule[]>([])
  const [bookedChallengeIds, setBookedChallengeIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChallengeSchedule | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [justBooked, setJustBooked] = useState<Set<string>>(new Set())

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: cData }, { data: bData }] = await Promise.all([
      supabase
        .from('challenge_schedules')
        .select('*, trainer_id, challenge:challenge_id(name, description)')
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true }),
      supabase
        .from('challenge_bookings')
        .select('challenge_schedule_id, booking_status')
        .eq('client_id', userId)
        .in('booking_status', ['confirmed', 'waitlist']),
    ])
    setChallenges((cData as ChallengeSchedule[]) ?? [])
    const ids = new Set<string>()
    for (const b of ((bData as {
      challenge_schedule_id: string
      booking_status: string
    }[]) ?? [])) {
      ids.add(b.challenge_schedule_id)
    }
    setBookedChallengeIds(ids)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const handleBooked = async (scheduleId: string) => {
    setSheetOpen(false)
    setSelected(null)
    setJustBooked(prev => new Set(prev).add(scheduleId))
    await load()
  }

  const handleCancelled = async () => {
    setSheetOpen(false)
    setSelected(null)
    await load()
  }

  if (loading) return <Spinner />
  if (challenges.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Trophy className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/40 text-sm">No checkpoints coming up</p>
      </div>
    )

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Checkpoints
          </p>
          <div className="flex flex-col gap-3">
            {challenges.map(c => {
              const isBooked = bookedChallengeIds.has(c.id)
              const wasJustBooked = justBooked.has(c.id)
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5 cursor-pointer hover:border-white/20 transition-colors"
                  onClick={() => {
                    setSelected(c)
                    setSheetOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {c.challenge?.name ?? 'Challenge'}
                    </span>
                    {isBooked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-brand-blue text-brand-blue">
                        {wasJustBooked ? 'Signed Up ✓' : 'Signed Up'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-green-500 text-green-400">
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">{formatDate(c.scheduled_date)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ChallengeDetailSheet
        schedule={selected}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setSelected(null)
        }}
        onBooked={() => handleBooked(selected!.id)}
        onCancelled={handleCancelled}
        userId={userId}
        isBooked={selected ? bookedChallengeIds.has(selected.id) : false}
      />
    </>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab({ userId }: { userId: string }) {
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [bookedEventIds, setBookedEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClientEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [justBooked, setJustBooked] = useState<Set<string>>(new Set())

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: eData }, { data: bData }] = await Promise.all([
      supabase
        .from('events')
        .select('id, name, start_date, start_time, end_time, location, description')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(10),
      supabase
        .from('event_bookings')
        .select('event_id, booking_status')
        .eq('client_id', userId)
        .eq('booking_status', 'confirmed'),
    ])
    setEvents((eData as ClientEvent[]) ?? [])
    const ids = new Set<string>()
    for (const b of ((bData as { event_id: string; booking_status: string }[]) ?? [])) {
      ids.add(b.event_id)
    }
    setBookedEventIds(ids)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const handleBooked = async (eventId: string) => {
    setSheetOpen(false)
    setSelected(null)
    setJustBooked(prev => new Set(prev).add(eventId))
    await load()
  }

  const handleCancelled = async () => {
    setSheetOpen(false)
    setSelected(null)
    await load()
  }

  if (loading) return <Spinner />
  if (events.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Trophy className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/40 text-sm">No events coming up</p>
      </div>
    )

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Events</p>
          <div className="flex flex-col gap-3">
            {events.map(e => {
              const isBooked = bookedEventIds.has(e.id)
              const wasJustBooked = justBooked.has(e.id)
              return (
                <div
                  key={e.id}
                  className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5 cursor-pointer hover:border-white/20 transition-colors"
                  onClick={() => {
                    setSelected(e)
                    setSheetOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{e.name}</span>
                    {isBooked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-brand-blue text-brand-blue">
                        {wasJustBooked ? 'Booked ✓' : 'Booked'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-green-500 text-green-400">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {formatDate(e.start_date)}
                    {e.start_time ? ` · ${formatTime(e.start_time)}` : ''}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <EventDetailSheet
        event={selected}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setSelected(null)
        }}
        onBooked={() => handleBooked(selected!.id)}
        onCancelled={handleCancelled}
        userId={userId}
        isBooked={selected ? bookedEventIds.has(selected.id) : false}
      />
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ClientDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('classes')
  const [hasPT, setHasPT] = useState(false)
  const setupComplete = searchParams.get('setup') === 'complete'

  useEffect(() => {
    Promise.resolve(supabase.auth.getSession())
      .then(({ data: { session }, error }) => {
        if (error || !session) {
          router.push('/login')
          return
        }
        setUser(session.user)
        setUserId(session.user.id)
        Promise.all([
          supabase
            .from('user_profiles')
            .select(
              'id, first_name, last_name, name, email, phone, avatar_url, status, client_type'
            )
            .eq('id', session.user.id)
            .single(),
          supabase
            .from('trainer_client')
            .select('appointment_status')
            .eq('client_id', session.user.id)
            .maybeSingle(),
        ])
          .then(([{ data: profileData }, { data: tcData }]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (profileData) setProfile(profileData as any)
            setHasPT(
              (tcData as { appointment_status: string } | null)?.appointment_status === 'active'
            )
          })
          .catch(() => {})
          .finally(() => setLoading(false))
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'classes', label: 'Classes' },
    ...(hasPT ? [{ id: 'appointments' as Tab, label: 'PT' }] : []),
    { id: 'checkpoints', label: 'Checkpoints' },
    { id: 'events', label: 'Events' },
  ]

  if (loading)
    return (
      <ClientShell user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
        </div>
      </ClientShell>
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAny = profile as any
  const firstName =
    profileAny?.first_name ||
    profileAny?.name?.split(' ')[0] ||
    profileAny?.email?.split('@')[0] ||
    user?.email?.split('@')[0] ||
    null

  if (setupComplete)
    return (
      <ClientShell user={user}>
        <div className="flex items-center justify-center py-20 px-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0f1a] p-8 flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Account Setup Complete!</h2>
              <p className="text-sm text-white/50 mt-2">
                Welcome to your fitness journey with Frontline
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                size="xl"
                className="w-full"
                onClick={() =>
                  window.open('https://apps.apple.com/app/frontline-client', '_blank')
                }
              >
                Download on App Store
              </Button>
              <Button
                size="xl"
                className="w-full bg-white/10 hover:bg-white/15 text-white border-white/10"
                onClick={() =>
                  window.open(
                    'https://play.google.com/store/apps/details?id=com.frontline.client',
                    '_blank'
                  )
                }
              >
                Get it on Google Play
              </Button>
            </div>
            <p className="text-xs text-white/30">
              Sign in with <span className="text-white/60">{user?.email}</span>
            </p>
          </div>
        </div>
      </ClientShell>
    )

  return (
    <ClientShell user={user}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
        <div className="mb-8">
          <p className="text-brand-blue text-xs font-semibold uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-4xl font-bold uppercase text-white tracking-tight">
            {firstName ?? 'Member'}
          </h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand-blue text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/15'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'classes' && userId ? (
          <ClassesTab userId={userId} />
        ) : (
          tab === 'classes' && <Spinner />
        )}
        {hasPT && tab === 'appointments' && userId ? (
          <AppointmentsTab userId={userId} />
        ) : (
          hasPT && tab === 'appointments' && <Spinner />
        )}
        {tab === 'checkpoints' && userId ? (
          <CheckpointsTab userId={userId} />
        ) : (
          tab === 'checkpoints' && <Spinner />
        )}
        {tab === 'events' && userId ? (
          <EventsTab userId={userId} />
        ) : (
          tab === 'events' && <Spinner />
        )}
      </div>
    </ClientShell>
  )
}

export default function ClientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
        </div>
      }
    >
      <ClientDashboardContent />
    </Suspense>
  )
}
