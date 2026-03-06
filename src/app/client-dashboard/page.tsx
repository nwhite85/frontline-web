'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { CalendarDays, Trophy, ShoppingBag, CheckCircle2, User as UserIcon } from 'lucide-react'
import ClientShell from '@/components/client/ClientShell'
import type { UserProfile, ClassSchedule, Appointment, ChallengeSchedule, ClientEvent } from '@/types/client'
import { formatDate, formatTime } from '@/lib/format'

type Tab = 'classes' | 'appointments' | 'events'
function Spinner() { return <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" /></div> }

interface ClassBookingModalProps {
  schedule: ClassSchedule
  onClose: () => void
  onBooked: () => void
  userId: string
}
function ClassBookingModal({ schedule, onClose, onBooked, userId }: ClassBookingModalProps) {
  const [loading, setLoading] = useState(false)
  const booked = schedule.current_bookings ?? 0
  const cap = schedule.class?.max_capacity ?? 0
  const isFull = cap > 0 && booked >= cap

  const handleBook = async () => {
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('class_bookings')
        .select('id')
        .eq('client_id', userId)
        .eq('class_schedule_id', schedule.id)
        .eq('booking_status', 'cancelled')
        .maybeSingle()

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('class_bookings')
          .update({
            booking_status: isFull ? 'waitlist' : 'confirmed',
            booking_date: new Date().toISOString(),
          })
          .eq('id', (existing as { id: string }).id)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('class_bookings').insert({
          client_id: userId,
          class_schedule_id: schedule.id,
          trainer_id: schedule.trainer_id ?? null,
          booking_status: isFull ? 'waitlist' : 'confirmed',
          payment_status: 'pending',
          amount_paid: 0,
          booking_date: new Date().toISOString(),
        })
      }
      onBooked()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#0a0f1a] rounded-t-2xl sm:rounded-2xl border border-white/10 w-full sm:max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-1">{schedule.class?.name ?? 'Class'}</h2>
        <p className="text-sm text-white/50 mb-6">
          {formatDate(schedule.scheduled_date)} · {formatTime(schedule.start_time)} · {schedule.class?.location ?? '—'}
        </p>
        {isFull && <p className="text-xs text-yellow-400/80 mb-4">This class is full — you&apos;ll be added to the waitlist.</p>}
        <div className="flex flex-col gap-3">
          <Button size="xl" className="w-full" onClick={handleBook} disabled={loading}>
            {loading ? 'Booking…' : isFull ? 'Join Waitlist' : 'Book Now'}
          </Button>
          <Button size="xl" className="w-full bg-white/10 hover:bg-white/15 text-white" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ChallengeBookingModalProps {
  schedule: ChallengeSchedule
  onClose: () => void
  onBooked: () => void
  userId: string
}
function ChallengeBookingModal({ schedule, onClose, onBooked, userId }: ChallengeBookingModalProps) {
  const [loading, setLoading] = useState(false)

  const handleBook = async () => {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('challenge_bookings').insert({
        challenge_schedule_id: schedule.id,
        client_id: userId,
        trainer_id: schedule.trainer_id ?? null,
        booking_status: 'confirmed',
        booking_date: new Date().toISOString(),
      })
      onBooked()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#0a0f1a] rounded-t-2xl sm:rounded-2xl border border-white/10 w-full sm:max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-1">{schedule.challenge?.name ?? 'Challenge'}</h2>
        <p className="text-sm text-white/50 mb-6">{formatDate(schedule.scheduled_date)}</p>
        <div className="flex flex-col gap-3">
          <Button size="xl" className="w-full" onClick={handleBook} disabled={loading}>
            {loading ? 'Signing up…' : 'Sign Up'}
          </Button>
          <Button size="xl" className="w-full bg-white/10 hover:bg-white/15 text-white" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function ClassesTab({ userId }: { userId: string }) {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [bookedIds, setBookedIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClassSchedule | null>(null)
  const [justBooked, setJustBooked] = useState<Set<string>>(new Set())

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: schedData }, { data: bData }, { data: allBookings }] = await Promise.all([
      supabase.from('class_schedules')
        .select('*, trainer_id, class:class_id(name, description, location, duration_minutes, skill_level, max_capacity)')
        .eq('status', 'scheduled').gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true }).order('start_time', { ascending: true }),
      supabase.from('class_bookings')
        .select('class_schedule_id, booking_status')
        .eq('client_id', userId)
        .in('booking_status', ['confirmed', 'waitlist']),
      // Count actual confirmed/waitlist bookings per schedule (same as client app)
      supabase.from('class_bookings')
        .select('class_schedule_id')
        .in('booking_status', ['confirmed', 'waitlist']),
    ])

    // Build actual booking counts from class_bookings table
    const bookingCounts: Record<string, number> = {}
    for (const b of ((allBookings as { class_schedule_id: string }[]) ?? [])) {
      bookingCounts[b.class_schedule_id] = (bookingCounts[b.class_schedule_id] || 0) + 1
    }

    // Merge real counts into schedules
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

  useEffect(() => { load() }, [userId])

  const handleBooked = async (scheduleId: string) => {
    setSelected(null)
    setJustBooked(prev => new Set(prev).add(scheduleId))
    await load()
  }

  if (loading) return <Spinner />
  if (schedules.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CalendarDays className="w-10 h-10 text-white opacity-20" />
      <p className="text-white/40 text-sm">No classes scheduled</p>
    </div>
  )
  const grouped: Record<string, ClassSchedule[]> = {}
  for (const s of schedules) { if (!grouped[s.scheduled_date]) grouped[s.scheduled_date] = []; grouped[s.scheduled_date].push(s) }
  return (
    <>
      <div className="flex flex-col gap-6">
        {Object.keys(grouped).sort().map(date => (
          <div key={date}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{formatDate(date)}</p>
            <div className="flex flex-col gap-3">
              {grouped[date].map(s => {
                const booked = s.current_bookings ?? 0; const cap = s.class?.max_capacity ?? 0
                const isFull = cap > 0 && booked >= cap; const pct = cap > 0 ? Math.min((booked/cap)*100,100) : 0
                const isBooked = !!bookedIds[s.id]
                const wasJustBooked = justBooked.has(s.id)
                const bookingStatus = bookedIds[s.id]
                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border bg-[#0d1420] px-4 py-3.5 ${isBooked ? 'border-white/10' : 'border-white/10 cursor-pointer hover:border-white/20 transition-colors'}`}
                    onClick={() => { if (!isBooked) setSelected(s) }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{s.class?.name ?? 'Class'}</span>
                      {isBooked ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-brand-blue text-brand-blue">
                          {wasJustBooked && bookingStatus === 'waitlist' ? 'Waitlisted ✓' : wasJustBooked ? 'Booked ✓' : bookingStatus === 'waitlist' ? 'Waitlisted' : 'Booked'}
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${isFull ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>{isFull ? 'Full' : 'Available'}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mb-2">{formatDate(s.scheduled_date)} · {formatTime(s.start_time)} · {s.class?.location ?? '—'}</p>
                    <div className="flex items-center justify-between text-xs text-white/30 mb-1.5"><span>Bookings</span><span>{booked}/{cap}</span></div>
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <ClassBookingModal
          schedule={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onBooked={() => handleBooked(selected.id)}
        />
      )}
    </>
  )
}

function AppointmentsTab({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      const { data: tc } = await (supabase.from('trainer_client').select('appointment_status').eq('client_id', userId).maybeSingle() as unknown as Promise<{ data: { appointment_status: string } | null, error: unknown }>)
      if (tc && tc.appointment_status !== 'active') { setHasAccess(false); setLoading(false); return }
      setHasAccess(true)
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('appointments').select('*, appointment_type:appointment_type_id(name)').in('status', ['available','scheduled']).gte('appointment_date', today).order('appointment_date', { ascending: true })
      setAppointments((data as Appointment[]) ?? []); setLoading(false)
    }
    load()
  }, [userId])
  if (loading) return <Spinner />
  if (hasAccess === false) return <div className="flex flex-col items-center justify-center py-16 gap-3"><CalendarDays className="w-10 h-10 text-white opacity-20" /><p className="text-white/40 text-sm">Personal training not included in your plan</p><p className="text-white/30 text-xs">Contact us to upgrade</p></div>
  if (appointments.length === 0) return <div className="flex flex-col items-center justify-center py-16 gap-3"><CalendarDays className="w-10 h-10 text-white opacity-20" /><p className="text-white/40 text-sm">No appointments available</p></div>
  const grouped: Record<string, Appointment[]> = {}
  for (const a of appointments) { if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []; grouped[a.appointment_date].push(a) }
  return (
    <div className="flex flex-col gap-6">
      {Object.keys(grouped).sort().map(date => (
        <div key={date}>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{formatDate(date)}</p>
          <div className="flex flex-col gap-3">
            {grouped[date].map(appt => (
              <div key={appt.id} className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{appt.appointment_type?.name ?? 'Personal Training'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${appt.status === 'scheduled' ? 'border-brand-blue text-brand-blue' : 'border-green-500 text-green-400'}`}>{appt.status === 'scheduled' ? 'Booked' : 'Available'}</span>
                </div>
                <p className="text-xs text-white/40">{formatDate(appt.appointment_date)} · {formatTime(appt.start_time)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EventsTab({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<ChallengeSchedule[]>([])
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [bookedChallengeIds, setBookedChallengeIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChallengeSchedule | null>(null)
  const [justBooked, setJustBooked] = useState<Set<string>>(new Set())

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: cData }, { data: eData }, { data: bData }] = await Promise.all([
      supabase.from('challenge_schedules')
        .select('*, trainer_id, challenge:challenge_id(name, description)')
        .eq('status','scheduled').gte('scheduled_date', today).order('scheduled_date', { ascending: true }),
      supabase.from('events').select('*').gte('event_date', today).order('event_date', { ascending: true }),
      supabase.from('challenge_bookings')
        .select('challenge_schedule_id, booking_status')
        .eq('client_id', userId)
        .in('booking_status', ['confirmed', 'waitlist']),
    ])
    setChallenges((cData as ChallengeSchedule[]) ?? [])
    setEvents((eData as ClientEvent[]) ?? [])
    const ids = new Set<string>()
    for (const b of ((bData as { challenge_schedule_id: string; booking_status: string }[]) ?? [])) {
      ids.add(b.challenge_schedule_id)
    }
    setBookedChallengeIds(ids)
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  const handleBooked = async (scheduleId: string) => {
    setSelected(null)
    setJustBooked(prev => new Set(prev).add(scheduleId))
    await load()
  }

  if (loading) return <Spinner />
  if (challenges.length === 0 && events.length === 0) return <div className="flex flex-col items-center justify-center py-16 gap-3"><Trophy className="w-10 h-10 text-white opacity-20" /><p className="text-white/40 text-sm">Nothing coming up</p></div>
  return (
    <>
      <div className="flex flex-col gap-8">
        {challenges.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Challenges</p>
            <div className="flex flex-col gap-3">
              {challenges.map(c => {
                const isBooked = bookedChallengeIds.has(c.id)
                const wasJustBooked = justBooked.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5 ${isBooked ? '' : 'cursor-pointer hover:border-white/20 transition-colors'}`}
                    onClick={() => { if (!isBooked) setSelected(c) }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{c.challenge?.name ?? 'Challenge'}</span>
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
        )}
        {events.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Events</p>
            <div className="flex flex-col gap-3">
              {events.map(e => (
                <div key={e.id} className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5">
                  <span className="text-sm font-semibold text-white">{e.name}</span>
                  <p className="text-xs text-white/40 mt-1">{formatDate(e.event_date)}{e.location ? ` · ${e.location}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {selected && (
        <ChallengeBookingModal
          schedule={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onBooked={() => handleBooked(selected.id)}
        />
      )}
    </>
  )
}

function ClientDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('classes')
  const setupComplete = searchParams.get('setup') === 'complete'

  useEffect(() => {
    Promise.resolve(supabase.auth.getSession()).then(({ data: { session }, error }) => {
      if (error || !session) { router.push('/login'); return }
      setUser(session.user); setUserId(session.user.id)
      Promise.resolve(supabase.from('user_profiles').select('*').eq('id', session.user.id).single()).then(({ data }) => { if (data) setProfile(data) }).catch(() => {})
      setLoading(false)
    }).catch(() => { router.push('/login') })
  }, [router])

  const firstName = profile?.first_name || profile?.name?.split(' ')[0] || null
  const tabs: { id: Tab; label: string }[] = [{ id: 'classes', label: 'Classes' }, { id: 'appointments', label: 'Appointments' }, { id: 'events', label: 'Events & Challenges' }]

  if (loading) return <ClientShell user={user}><div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" /></div></ClientShell>

  if (setupComplete) return (
    <ClientShell user={user}>
      <div className="flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0f1a] p-8 flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20"><CheckCircle2 className="h-8 w-8 text-green-400" /></div>
          <div><h2 className="text-2xl font-semibold text-white">Account Setup Complete!</h2><p className="text-sm text-white/50 mt-2">Welcome to your fitness journey with Frontline</p></div>
          <div className="flex flex-col gap-3 w-full">
            <Button size="xl" className="w-full" onClick={() => window.open('https://apps.apple.com/app/frontline-client', '_blank')}>Download on App Store</Button>
            <Button size="xl" className="w-full bg-white/10 hover:bg-white/15 text-white border-white/10" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.frontline.client', '_blank')}>Get it on Google Play</Button>
          </div>
          <p className="text-xs text-white/30">Sign in with <span className="text-white/60">{user?.email}</span></p>
        </div>
      </div>
    </ClientShell>
  )

  return (
    <ClientShell user={user}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-brand-blue text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="text-4xl font-bold uppercase text-white tracking-tight">{firstName ?? 'Member'}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-full bg-brand-blue px-3 py-2">
              <CalendarDays className="h-4 w-4 text-white" />
              <span className="text-xs text-white font-medium">Schedule</span>
            </span>
            <a href="/client/results" className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors px-3 py-2">
              <Trophy className="h-4 w-4 text-white opacity-60" />
              <span className="text-xs text-white/60 font-medium">Results</span>
            </a>
            <a href="/shop" className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors px-3 py-2">
              <ShoppingBag className="h-4 w-4 text-white opacity-60" />
              <span className="text-xs text-white/60 font-medium">Shop</span>
            </a>
            <a href="/client/profile" className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors px-3 py-2">
              <UserIcon className="h-4 w-4 text-white opacity-60" />
              <span className="text-xs text-white/60 font-medium">Profile</span>
            </a>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand-blue text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'classes' && userId ? <ClassesTab userId={userId} /> : tab === 'classes' && <Spinner />}
        {tab === 'appointments' && userId ? <AppointmentsTab userId={userId} /> : tab === 'appointments' && <Spinner />}
        {tab === 'events' && userId ? <EventsTab userId={userId} /> : tab === 'events' && <Spinner />}
      </div>
    </ClientShell>
  )
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" /></div>}>
      <ClientDashboardContent />
    </Suspense>
  )
}
