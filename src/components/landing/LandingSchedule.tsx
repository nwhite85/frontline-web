'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'

interface ClassItem {
  name: string
  time: string
  location: string
}

interface DayData {
  date: Date
  dateStr: string
  dayOfWeek: number
  dayName: string
  shortDate: string
  classes: ClassItem[]
  isToday: boolean
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FALLBACK: { [key: number]: ClassItem[] } = {
  0: [],
  1: [{ name: 'Endurance', time: '6:30 PM', location: 'Academy' }],
  2: [{ name: 'Strength', time: '9:30 AM', location: 'Lydiard Park' }],
  3: [
    { name: 'Circuits', time: '6:00 PM', location: 'Academy' },
    { name: 'Circuits', time: '7:00 PM', location: 'Academy' },
  ],
  4: [
    { name: 'Intervals', time: '6:30 AM', location: 'Lydiard Park' },
    { name: 'Intervals', time: '9:30 AM', location: 'Lydiard Park' },
  ],
  5: [],
  6: [{ name: 'Endurance', time: '9:00 AM', location: 'Lydiard Park' }],
}

function formatTime(timeStr: string) {
  return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function buildWeek(weekOffset: number, scheduleMap: Map<string, ClassItem[]>, useFallback: boolean): DayData[] {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentDayOfWeek = today.getDay()
  const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const monday = new Date(today.getTime() - daysFromMonday * 86400000 + weekOffset * 7 * 86400000)

  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(monday.getTime() + i * 86400000)
    const dateStr = date.toISOString().split('T')[0]
    const dow = date.getDay()
    const classes = useFallback
      ? FALLBACK[dow] ?? []
      : scheduleMap.get(dateStr) ?? []
    return {
      date,
      dateStr,
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      shortDate: `${date.getDate()} ${date.toLocaleDateString('en-GB', { month: 'short' })}`,
      classes,
      isToday: dateStr === todayStr,
    }
  })
}

type RawSchedule = { scheduled_date: string; start_time: string; location?: string; class?: { name?: string; location?: string } }

function buildMapFromRaw(raw: RawSchedule[]): Map<string, ClassItem[]> {
  const map = new Map<string, ClassItem[]>()
  for (const s of raw) {
    const item: ClassItem = {
      name: s.class?.name || 'Class',
      time: formatTime(s.start_time),
      location: s.location || s.class?.location || '',
    }
    const existing = map.get(s.scheduled_date) ?? []
    map.set(s.scheduled_date, [...existing, item])
  }
  return map
}

export function LandingSchedule({ initialSchedules }: { initialSchedules?: RawSchedule[] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [scheduleMap, setScheduleMap] = useState<Map<string, ClassItem[]>>(() => {
    if (initialSchedules && initialSchedules.length > 0) return buildMapFromRaw(initialSchedules)
    return new Map()
  })
  const [useFallback, setUseFallback] = useState(!initialSchedules || initialSchedules.length === 0)
  const [selectedDay, setSelectedDay] = useState(0)

  // Only fetch from client when navigating to a week not covered by server data
  const fetchWeek = async (offset: number) => {
    if (offset === 0 && initialSchedules && initialSchedules.length > 0) return // already have it
    const start = new Date()
    start.setDate(start.getDate() + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const { data, error } = await import('@/lib/supabase').then(m => 
      m.supabase.from('class_schedules')
        .select('scheduled_date, start_time, location, class:class_id(name, location)')
        .gte('scheduled_date', start.toISOString().split('T')[0])
        .lte('scheduled_date', end.toISOString().split('T')[0])
        .in('status', ['scheduled', 'active'])
        .order('scheduled_date').order('start_time').limit(50)
    )
    if (!error && data && data.length > 0) {
      setScheduleMap(prev => {
        const next = new Map(prev)
        const newEntries = buildMapFromRaw(data as unknown as RawSchedule[])
        newEntries.forEach((v, k) => next.set(k, v))
        return next
      })
      setUseFallback(false)
    }
  }

  const days = buildWeek(weekOffset, scheduleMap, useFallback)

  const todayIdx = days.findIndex((d) => d.isToday)

  const weekLabel = (() => {
    const first = days[0]
    const last = days[5]
    if (first.date.getMonth() === last.date.getMonth()) {
      return `${first.date.getDate()}–${last.shortDate}`
    }
    return `${first.shortDate} – ${last.shortDate}`
  })()

  return (
    <section id="schedule" className={`py-24 bg-[#0b0e18]`}>
      <Container>
        {/* Header */}
        <div className="mb-10">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">Schedule</p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase mb-4 text-white`}>
            When we train
          </h2>
          <p className={`text-lg max-w-xl text-white/60`}>
            Regular weekly sessions for every fitness level — same times every week, so you can plan around your life.
          </p>
        </div>

        {/* Week nav */}
        <div className="flex items-center justify-between mb-6">
          <span className={`text-sm text-white/50`}>{weekLabel}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = weekOffset - 1; setWeekOffset(next); fetchWeek(next) }}
              aria-label="Previous week"
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => { setWeekOffset(0) }}
                className={`text-xs px-2 transition-colors ${
                  'text-white/50 hover:text-white/70'
                }`}
              >
                Today
              </button>
            )}
            <button
              onClick={() => { const next = weekOffset + 1; setWeekOffset(next); fetchWeek(next) }}
              aria-label="Next week"
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile day picker */}
        <div className="flex gap-1.5 mb-4 md:hidden overflow-x-auto pb-1">
          {days.map((day, i) => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedDay === i
                  ? 'bg-brand-blue text-white'
                  : day.isToday
                  ? 'border border-brand-blue/50 text-brand-blue'
                  :'border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              <span>{SHORT_DAYS[day.dayOfWeek]}</span>
              <span className="opacity-70">{day.date.getDate()}</span>
            </button>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-6 gap-3">
          {days.map((day, i) => (
            <div>
              {/* Day header */}
              <div
                className={`rounded-xl overflow-hidden text-center ${
                  day.isToday
                    ? 'bg-brand-blue/15'
                    : 'bg-white/[0.04]'
                }`}
                style={{
                  border: day.isToday
                    ? '1px solid rgba(73,130,232,0.35)'
                    :'1px solid rgba(255,255,255,0.08)'
                }}
              >
                {/* Accent bar */}
                <div
                  className="h-[3px] w-full"
                  style={{
                    background: day.isToday
                      ? '#4982e8'
                      :'rgba(255,255,255,0.12)'
                  }}
                />
                <div className="py-3 px-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${
                    day.isToday ? 'text-brand-blue' : 'text-white/35'
                  }`}>
                    {SHORT_DAYS[day.dayOfWeek]}
                  </p>
                  <p className={`text-xl font-bold leading-none mt-1 ${
                    day.isToday ? 'text-brand-blue' : 'text-white/90'
                  }`}>
                    {day.date.getDate()}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${
                    day.isToday ? 'text-brand-blue/70' : 'text-white/25'
                  }`}>
                    {day.date.toLocaleDateString('en-GB', { month: 'short' })}
                  </p>
                </div>
              </div>

              {/* Class pills */}
              {day.classes.length > 0 ? (
                day.classes.map((cls, i) => (
                  <div
                    key={i}
                    className={`rounded-xl transition-colors p-5 cursor-pointer ${
                      'bg-white/[0.04] hover:bg-white/[0.07]'
                    }`}
                    style={{
                      boxShadow:'0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
                    }}
                  >
                    <p className={`text-sm font-medium leading-tight text-white`}>
                      {cls.name}
                    </p>
                    <div className={`flex items-center gap-1 mt-1.5 text-xs text-white/50`}>
                      <Clock size={10} />
                      <span>{cls.time}</span>
                    </div>
                    {cls.location && (
                      <div className={`flex items-center gap-1 mt-0.5 text-xs text-white/30`}>
                        <MapPin size={10} />
                        <span>{cls.location}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={`rounded-xl border border-dashed p-3 text-center ${
                  'border-white/[0.05]'
                }`}>
                  <p className={`text-xs text-white/20`}>Rest</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile single-day view */}
        <div className="md:hidden">
          {(() => {
            const day = days[selectedDay === -1 ? (todayIdx >= 0 ? todayIdx : 0) : selectedDay]
            if (!day) return null
            return day.classes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {day.classes.map((cls, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-5 bg-white/[0.04]`}
                    style={{
                      boxShadow:'0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
                    }}
                  >
                    <p className={`font-medium text-white`}>{cls.name}</p>
                    <div className={`flex items-center gap-3 mt-2 text-sm text-white/50`}>
                      <span className="flex items-center gap-1"><Clock size={12} />{cls.time}</span>
                      {cls.location && <span className="flex items-center gap-1"><MapPin size={12} />{cls.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl border border-dashed p-8 text-center ${
                'border-white/10'
              }`}>
                <p className={'text-white/30'}>No classes scheduled</p>
              </div>
            )
          })()}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Ready to give it a go?</p>
            <p className="text-white/50 text-sm mt-0.5">Your first class is on us — no commitment, just show up.</p>
          </div>
          <button
            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Book a free trial <ChevronRight size={14} />
          </button>
        </div>
      </Container>
    </section>
  )
}
