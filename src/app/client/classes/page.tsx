'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { CalendarDays, Trophy } from 'lucide-react'
import type { ClassSchedule, Appointment, ChallengeSchedule, ClientEvent } from '@/types/client'
import { formatDate, formatTime } from '@/lib/format'

// ─── Tab: Classes ─────────────────────────────────────────────────────────────

function ClassesTab() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('class_schedules')
        .select('*, class:class_id(name, description, location, duration_minutes, skill_level, max_capacity)')
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
      setSchedules((data as ClassSchedule[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/50 text-sm">No classes scheduled</p>
        <p className="text-white/30 text-xs">Check back soon</p>
      </div>
    )
  }

  const grouped: Record<string, ClassSchedule[]> = {}
  for (const s of schedules) {
    if (!grouped[s.scheduled_date]) grouped[s.scheduled_date] = []
    grouped[s.scheduled_date].push(s)
  }
  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex flex-col gap-6">
      {dates.map(date => (
        <div key={date}>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{formatDate(date)}</p>
          <div className="flex flex-col gap-3">
            {grouped[date].map(s => {
              const booked = s.current_bookings ?? 0
              const cap = s.class?.max_capacity ?? 0
              const isFull = cap > 0 && booked >= cap
              return (
                <a key={s.id} href="/client/classes" className="block rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{s.class?.name ?? 'Class'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isFull ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                      {isFull ? 'Full' : 'Available'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mb-2">
                    {formatDate(s.scheduled_date)} · {formatTime(s.start_time)} · {s.class?.location ?? '—'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                    <span>Bookings</span>
                    <span>{booked}/{cap}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-blue"
                      style={{ width: cap > 0 ? `${Math.min((booked / cap) * 100, 100)}%` : '0%' }}
                    />
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Appointments ────────────────────────────────────────────────────────

function AppointmentsTab({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: trainerClient } = await (supabase
        .from('trainer_client')
        .select('appointment_status')
        .eq('client_id', userId)
        .maybeSingle() as unknown as Promise<{ data: { appointment_status: string } | null, error: unknown }>)

      if (trainerClient && trainerClient.appointment_status !== 'active') {
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
        .order('start_time', { ascending: true })

      setAppointments((data as Appointment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/50 text-sm">Personal training not included in your plan.</p>
        <p className="text-white/30 text-xs">Contact us to upgrade.</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CalendarDays className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/50 text-sm">No appointments available</p>
        <p className="text-white/30 text-xs">Check back soon or contact your trainer</p>
      </div>
    )
  }

  const grouped: Record<string, Appointment[]> = {}
  for (const a of appointments) {
    if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []
    grouped[a.appointment_date].push(a)
  }
  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex flex-col gap-6">
      {dates.map(date => (
        <div key={date}>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{formatDate(date)}</p>
          <div className="flex flex-col gap-3">
            {grouped[date].map(appt => {
              const isBooked = appt.status === 'scheduled'
              return (
                <div key={appt.id} className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {appt.appointment_type?.name ?? 'Personal Training'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isBooked ? 'border-brand-blue text-brand-blue' : 'border-green-500 text-green-400'}`}>
                      {isBooked ? 'Booked' : 'Available'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {formatDate(appt.appointment_date)} · {formatTime(appt.start_time)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Events & Challenges ─────────────────────────────────────────────────

function EventsTab() {
  const [challenges, setChallenges] = useState<ChallengeSchedule[]>([])
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const [{ data: cData }, { data: eData }] = await Promise.all([
        supabase
          .from('challenge_schedules')
          .select('*, challenge:challenge_id(name, description)')
          .eq('status', 'scheduled')
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('events')
          .select('*')
          .gte('event_date', today)
          .order('event_date', { ascending: true }),
      ])
      setChallenges((cData as ChallengeSchedule[]) ?? [])
      setEvents((eData as ClientEvent[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    )
  }

  if (challenges.length === 0 && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Trophy className="w-10 h-10 text-white opacity-20" />
        <p className="text-white/50 text-sm">Nothing coming up</p>
        <p className="text-white/30 text-xs">Events and challenges will appear here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {challenges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Challenges</p>
          <div className="flex flex-col gap-3">
            {challenges.map(c => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-[#0d1420] px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{c.challenge?.name ?? 'Challenge'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-green-500 text-green-400">
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-white/40">{formatDate(c.scheduled_date)}</p>
              </div>
            ))}
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
                <p className="text-xs text-white/40 mt-1">
                  {formatDate(e.event_date)}{e.location ? ` · ${e.location}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'classes' | 'appointments' | 'events'

function SchedulePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'classes')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
    })
  }, [router])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'classes', label: 'Classes' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'events', label: 'Events & Challenges' },
  ]

  return (
    <ClientShell>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <h1 className="text-4xl font-bold uppercase text-white tracking-tight mb-5">Schedule</h1>

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

        {tab === 'classes' && <ClassesTab />}
        {tab === 'appointments' && userId && <AppointmentsTab userId={userId} />}
        {tab === 'appointments' && !userId && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        )}
        {tab === 'events' && <EventsTab />}
      </div>
    </ClientShell>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    }>
      <SchedulePageInner />
    </Suspense>
  )
}
