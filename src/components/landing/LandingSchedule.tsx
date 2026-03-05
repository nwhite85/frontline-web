'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/container'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLandingTheme } from '@/contexts/LandingThemeContext'

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

export function LandingSchedule() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [scheduleMap, setScheduleMap] = useState<Map<string, ClassItem[]>>(new Map())
  const [useFallback, setUseFallback] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)
  const { isDark } = useLandingTheme()

  useEffect(() => {
    const fetch = async () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(start.getDate() - 7)
      const end = new Date(today)
      end.setDate(end.getDate() + 28)

      const { data, error } = await supabase
        .from('class_schedules')
        .select('*, class:classes(*)')
        .gte('scheduled_date', start.toISOString().split('T')[0])
        .lte('scheduled_date', end.toISOString().split('T')[0])
        .in('status', ['scheduled', 'active'])
        .order('scheduled_date')
        .order('start_time')

      if (!error && data && data.length > 0) {
        const map = new Map<string, ClassItem[]>()
        for (const s of data as unknown as Record<string, unknown>[]) {
          const cls = s.class as Record<string, unknown> | null
          const item: ClassItem = {
            name: (cls?.name as string) || 'Class',
            time: formatTime(s.start_time as string),
            location: (s.location as string) || (cls?.location as string) || '',
          }
          const existing = map.get(s.scheduled_date as string) ?? []
          map.set(s.scheduled_date as string, [...existing, item])
        }
        setScheduleMap(map)
        setUseFallback(false)
      }
    }
    fetch()
  }, [])

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
    <section id="schedule" className={`py-24 ${isDark ? 'bg-[#0b0e18]' : 'bg-[#eef2ff]'}`}>
      <Container>
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-60px' }}
        >
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">Schedule</p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase mb-4 ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>
            When we train
          </h2>
          <p className={`text-lg max-w-xl ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Regular weekly sessions for every fitness level — same times every week, so you can plan around your life.
          </p>
        </motion.div>

        {/* Week nav */}
        <div className="flex items-center justify-between mb-6">
          <span className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{weekLabel}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  : 'border-black/10 bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className={`text-xs px-2 transition-colors ${
                  isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Today
              </button>
            )}
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  : 'border-black/10 bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-900'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile day picker */}
        <motion.div
          className="flex gap-1.5 mb-4 md:hidden overflow-x-auto pb-1"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          viewport={{ once: true, margin: '-60px' }}
        >
          {days.map((day, i) => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedDay === i
                  ? 'bg-brand-blue text-white'
                  : day.isToday
                  ? 'border border-brand-blue/50 text-brand-blue'
                  : isDark
                  ? 'border border-white/10 text-white/50 hover:text-white'
                  : 'border border-black/10 text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>{SHORT_DAYS[day.dayOfWeek]}</span>
              <span className="opacity-70">{day.date.getDate()}</span>
            </button>
          ))}
        </motion.div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-6 gap-3">
          {days.map((day, i) => (
            <motion.div
              key={day.dateStr}
              className="flex flex-col gap-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
              viewport={{ once: true, margin: '-60px' }}
            >
              {/* Day header */}
              <div
                className={`rounded-xl overflow-hidden text-center ${
                  day.isToday
                    ? isDark ? 'bg-brand-blue/15' : 'bg-brand-blue/8'
                    : isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
                }`}
                style={{
                  border: day.isToday
                    ? '1px solid rgba(73,130,232,0.35)'
                    : isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.07)',
                }}
              >
                {/* Accent bar */}
                <div
                  className="h-[3px] w-full"
                  style={{
                    background: day.isToday
                      ? '#4982e8'
                      : isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.08)',
                  }}
                />
                <div className="py-3 px-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${
                    day.isToday ? 'text-brand-blue' : isDark ? 'text-white/35' : 'text-slate-400'
                  }`}>
                    {SHORT_DAYS[day.dayOfWeek]}
                  </p>
                  <p className={`text-xl font-bold leading-none mt-1 ${
                    day.isToday ? 'text-brand-blue' : isDark ? 'text-white/90' : 'text-slate-800'
                  }`}>
                    {day.date.getDate()}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${
                    day.isToday ? 'text-brand-blue/70' : isDark ? 'text-white/25' : 'text-slate-400'
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
                      isDark ? 'bg-white/[0.04] hover:bg-white/[0.07]' : 'bg-white hover:bg-slate-50'
                    }`}
                    style={{
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
                        : '0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05), inset 0 0 0 2px #ffffff',
                    }}
                  >
                    <p className={`text-sm font-medium leading-tight ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>
                      {cls.name}
                    </p>
                    <div className={`flex items-center gap-1 mt-1.5 text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                      <Clock size={10} />
                      <span>{cls.time}</span>
                    </div>
                    {cls.location && (
                      <div className={`flex items-center gap-1 mt-0.5 text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                        <MapPin size={10} />
                        <span>{cls.location}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={`rounded-xl border border-dashed p-3 text-center ${
                  isDark ? 'border-white/[0.05]' : 'border-black/10'
                }`}>
                  <p className={`text-xs ${isDark ? 'text-white/20' : 'text-slate-300'}`}>Rest</p>
                </div>
              )}
            </motion.div>
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
                    className={`rounded-xl p-5 ${isDark ? 'bg-white/[0.04]' : 'bg-white'}`}
                    style={{
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
                        : '0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05), inset 0 0 0 2px #ffffff',
                    }}
                  >
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>{cls.name}</p>
                    <div className={`flex items-center gap-3 mt-2 text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1"><Clock size={12} />{cls.time}</span>
                      {cls.location && <span className="flex items-center gap-1"><MapPin size={12} />{cls.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl border border-dashed p-8 text-center ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}>
                <p className={isDark ? 'text-white/30' : 'text-slate-400'}>No classes scheduled</p>
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
            className="shrink-0 inline-flex items-center gap-1.5 bg-brand-blue hover:bg-[#3b72d6] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Book a free trial <ChevronRight size={14} />
          </button>
        </div>
      </Container>
    </section>
  )
}
