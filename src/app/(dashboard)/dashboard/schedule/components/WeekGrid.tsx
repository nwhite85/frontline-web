// @ts-nocheck
'use client'

import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { SessionCard } from './SessionCard'
import type { SessionType } from './SessionCard'

interface Appointment {
  id: string
  client_name: string
  date?: string
  time?: string
  start_time: string
  duration?: number
  duration_minutes?: number
  status?: string
  appointment_date?: string
}

interface ClassSchedule {
  id: string
  class_name?: string
  scheduled_date: string
  start_time: string
  current_bookings?: number
  max_capacity?: number
  class?: { name?: string; duration_minutes?: number; max_capacity?: number }
}

interface Event {
  id: string
  name: string
  start_date: string
  start_time: string
  end_time?: string
  current_bookings?: number
  max_capacity?: number
}

interface ChallengeSchedule {
  id: string
  challenge_name?: string
  scheduled_date: string
  start_time: string
  end_time?: string
  current_bookings?: number
  max_capacity?: number
  challenge?: { name?: string; duration_minutes?: number }
}

interface WeekGridProps {
  weekDays: Date[]
  appointments: Appointment[]
  classSchedules: ClassSchedule[]
  events: Event[]
  challengeSchedules: ChallengeSchedule[]
  filter: string
  hasInitiallyScrolled: boolean
  setHasInitiallyScrolled: (v: boolean) => void
  isDragging: boolean
  dragOver: string | null
  setDragOver: (v: string | null) => void
  onSlotDoubleClick: (date: string, time: string) => void
  onSessionClick: (session: any, type: SessionType) => void
  onDragStart: (type: string, data: any) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, date: string, time: string) => void
  startHour?: number
  endHour?: number
  mobileDayIndex?: number
}

const SLOT_HEIGHT = 60

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${period}`
}

function timeToMinutes(t: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTop(minutes: number, slotStartMinutes: number): number {
  return ((minutes - slotStartMinutes) / 60) * SLOT_HEIGHT
}

function durationToHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 0.45)
}

function startsInSlot(sessionTime: string, slotTime: string): boolean {
  if (!sessionTime || !slotTime) return false
  const sMin = timeToMinutes(sessionTime)
  const slotMin = timeToMinutes(slotTime)
  return sMin >= slotMin && sMin < slotMin + 60
}

function DayColumn({
  dateStr,
  isToday,
  slotTime,
  slotMinutes,
  appointments,
  classSchedules,
  events,
  challengeSchedules,
  filter,
  isDragging,
  dragOver,
  setDragOver,
  onSlotDoubleClick,
  onSessionClick,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  dateStr: string
  isToday: boolean
  slotTime: string
  slotMinutes: number
  appointments: Appointment[]
  classSchedules: ClassSchedule[]
  events: Event[]
  challengeSchedules: ChallengeSchedule[]
  filter: string
  isDragging: boolean
  dragOver: string | null
  setDragOver: (v: string | null) => void
  onSlotDoubleClick: (date: string, time: string) => void
  onSessionClick: (session: any, type: SessionType) => void
  onDragStart: (type: string, data: any) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, date: string, time: string) => void
}) {
  const slotId = `${dateStr}-${slotTime}`
  const isDropTarget = isDragging && dragOver === slotId

  const slotAppts = (filter === 'All' || filter === 'Appointments')
    ? appointments.filter(a => {
        const d = a.appointment_date || a.date || ''
        return d === dateStr && startsInSlot(a.start_time || a.time || '', slotTime)
      })
    : []

  const slotClass = (filter === 'All' || filter === 'Classes')
    ? classSchedules.find(c => c.scheduled_date === dateStr && startsInSlot(c.start_time, slotTime))
    : undefined

  const slotEvent = (filter === 'All' || filter === 'Events')
    ? events.find(e => e.start_date === dateStr && startsInSlot(e.start_time, slotTime))
    : undefined

  const slotChallenge = (filter === 'All' || filter === 'Challenges')
    ? challengeSchedules.find(c => c.scheduled_date === dateStr && startsInSlot(c.start_time, slotTime))
    : undefined

  const hasContent = slotAppts.length > 0 || slotClass || slotEvent || slotChallenge
  const totalCols = slotAppts.length + (slotClass ? 1 : 0) + (slotEvent ? 1 : 0) + (slotChallenge ? 1 : 0)
  const colWidth = totalCols > 1 ? `${100 / totalCols}%` : '100%'
  const getColLeft = (idx: number) => totalCols > 1 ? `${(idx / totalCols) * 100}%` : '0'

  return (
    <div
      className={cn(
        'relative border-r border-b border-border last:border-r-0',
        isToday && 'bg-primary/[0.02]',
        isDropTarget && 'bg-primary/10 border-primary border-dashed',
        !hasContent && !isDropTarget && 'hover:bg-muted/40 cursor-pointer',
      )}
      style={{ height: `${SLOT_HEIGHT}px` }}
      onDoubleClick={() => onSlotDoubleClick(dateStr, slotTime)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(slotId) }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => onDrop(e, dateStr, slotTime)}
    >
      {slotAppts.map((apt, idx) => {
        const startMin = timeToMinutes(apt.start_time || apt.time || slotTime)
        const topPx = ((startMin - slotMinutes) / 60) * SLOT_HEIGHT
        const dur = apt.duration_minutes || apt.duration || 60
        return (
          <SessionCard
            key={apt.id}
            type="appointment"
            title={apt.client_name}
            timeDisplay={formatTime(apt.start_time || apt.time || '')}
            subtitle={apt.status === 'available' ? 'Open slot' : undefined}
            durationMinutes={dur}
            onClick={() => onSessionClick(apt, 'appointment')}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'appointment', id: apt.id })); onDragStart('appointment', apt) }}
            onDragEnd={onDragEnd}
            style={{ position: 'absolute', top: `${topPx}px`, left: getColLeft(idx), width: colWidth, height: `${durationToHeight(dur)}px`, zIndex: 10 + idx }}
          />
        )
      })}

      {slotClass && (() => {
        const startMin = timeToMinutes(slotClass.start_time)
        const topPx = ((startMin - slotMinutes) / 60) * SLOT_HEIGHT
        const dur = slotClass.class?.duration_minutes || 60
        const colIndex = slotAppts.length
        return (
          <SessionCard
            key={slotClass.id}
            type="class"
            title={slotClass.class?.name || slotClass.class_name || 'Class'}
            timeDisplay={formatTime(slotClass.start_time)}
            subtitle={`${slotClass.current_bookings ?? 0}/${slotClass.max_capacity || slotClass.class?.max_capacity || '?'}`}
            durationMinutes={dur}
            onClick={() => onSessionClick(slotClass, 'class')}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'class', id: slotClass.id })); onDragStart('class', slotClass) }}
            onDragEnd={onDragEnd}
            style={{ position: 'absolute', top: `${topPx}px`, left: getColLeft(colIndex), width: colWidth, height: `${durationToHeight(dur)}px`, zIndex: 15 }}
          />
        )
      })()}

      {slotEvent && (() => {
        const startMin = timeToMinutes(slotEvent.start_time)
        const topPx = ((startMin - slotMinutes) / 60) * SLOT_HEIGHT
        const dur = (slotEvent.start_time && slotEvent.end_time)
          ? timeToMinutes(slotEvent.end_time) - timeToMinutes(slotEvent.start_time)
          : 60
        const colIndex = slotAppts.length + (slotClass ? 1 : 0)
        return (
          <SessionCard
            key={slotEvent.id}
            type="event"
            title={slotEvent.name}
            timeDisplay={formatTime(slotEvent.start_time)}
            subtitle={`${slotEvent.current_bookings ?? 0}/${slotEvent.max_capacity || '?'}`}
            durationMinutes={Math.max(dur, 30)}
            onClick={() => onSessionClick(slotEvent, 'event')}
            style={{ position: 'absolute', top: `${topPx}px`, left: getColLeft(colIndex), width: colWidth, height: `${durationToHeight(Math.max(dur, 30))}px`, zIndex: 15 }}
          />
        )
      })()}

      {slotChallenge && (() => {
        const startMin = timeToMinutes(slotChallenge.start_time)
        const topPx = ((startMin - slotMinutes) / 60) * SLOT_HEIGHT
        const dur = slotChallenge.challenge?.duration_minutes || 60
        const colIndex = slotAppts.length + (slotClass ? 1 : 0) + (slotEvent ? 1 : 0)
        return (
          <SessionCard
            key={slotChallenge.id}
            type="challenge"
            title={slotChallenge.challenge?.name || slotChallenge.challenge_name || 'Challenge'}
            timeDisplay={formatTime(slotChallenge.start_time)}
            durationMinutes={dur}
            onClick={() => onSessionClick(slotChallenge, 'challenge')}
            style={{ position: 'absolute', top: `${topPx}px`, left: getColLeft(colIndex), width: colWidth, height: `${durationToHeight(dur)}px`, zIndex: 15 }}
          />
        )
      })()}
    </div>
  )
}

export function WeekGrid({
  weekDays,
  appointments,
  classSchedules,
  events,
  challengeSchedules,
  filter,
  hasInitiallyScrolled,
  setHasInitiallyScrolled,
  isDragging,
  dragOver,
  setDragOver,
  onSlotDoubleClick,
  onSessionClick,
  onDragStart,
  onDragEnd,
  onDrop,
  startHour,
  endHour,
  mobileDayIndex = 0,
}: WeekGridProps) {
  const TIME_SLOTS = useMemo(() => {
    const slots: string[] = []
    const start = startHour ?? 5
    const end = endHour ?? 22
    for (let h = start; h <= end; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
    }
    return slots
  }, [startHour, endHour])

  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Detect mobile — starts false (SSR safe), updates after mount
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // On mobile show only the active day; on desktop show all 7
  const displayDays = isMobile ? [weekDays[Math.min(mobileDayIndex, weekDays.length - 1)]] : weekDays

  const timeColWidth = isMobile ? 48 : 64
  const gridTemplate = `${timeColWidth}px repeat(${displayDays.length}, 1fr)`

  const getCurrentSlot = () => {
    const now = new Date()
    const h = now.getHours()
    return `${String(h).padStart(2, '0')}:00`
  }

  const scrollToNow = useCallback(() => {
    const slot = getCurrentSlot()
    const el = slotRefs.current[slot]
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' })
  }, [])

  useEffect(() => {
    if (!hasInitiallyScrolled) {
      const t = setTimeout(() => {
        scrollToNow()
        setHasInitiallyScrolled(true)
        try { sessionStorage.setItem('schedule-has-scrolled', 'true') } catch {}
      }, 300)
      return () => clearTimeout(t)
    }
  }, [hasInitiallyScrolled, scrollToNow, setHasInitiallyScrolled])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const firstSlotMinutes = (startHour ?? 5) * 60
  const nowOffset = nowMinutes - firstSlotMinutes
  const nowTopPx = (nowOffset / 60) * SLOT_HEIGHT

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex flex-col h-full bg-card">
      <div ref={containerRef} className="overflow-y-auto flex-1 overscroll-contain">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="h-14 border-r border-border" />
            {displayDays.map((day, i) => {
              const dateStr = day.toISOString().split('T')[0]
              const isToday = dateStr === todayStr
              // On mobile displayDays has 1 entry; map back to the correct day name
              const dayNameIdx = isMobile ? mobileDayIndex : i
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'h-14 flex flex-col items-center justify-center border-r border-border last:border-r-0',
                    isToday && 'bg-primary/5',
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">{dayNames[dayNameIdx]}</span>
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center text-sm font-semibold',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}>
                    {day.getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4rem)' }}>
          {/* Current time indicator */}
          {nowOffset >= 0 && nowOffset < TIME_SLOTS.length * 30 && (
            <div
              className="absolute right-0 h-px bg-primary/50 z-10 pointer-events-none"
              style={{ top: `${nowTopPx}px`, left: `${timeColWidth}px` }}
            />
          )}

          {/* Grid rows */}
          {TIME_SLOTS.map((slotTime) => {
            const slotMinutes = timeToMinutes(slotTime)
            const isHour = slotTime.endsWith(':00')

            return (
              <div
                key={slotTime}
                ref={(el) => { slotRefs.current[slotTime] = el }}
                className="grid"
                style={{ gridTemplateColumns: gridTemplate, height: `${SLOT_HEIGHT}px` }}
              >
                {/* Time label */}
                <div className="border-r border-b border-border flex items-start justify-end pr-2 pt-1 sticky left-0 bg-muted/30 z-10">
                  {isHour && (
                    <span className="text-xs text-muted-foreground font-medium">{slotTime}</span>
                  )}
                </div>

                {/* Day columns */}
                {displayDays.map((day) => {
                  const dateStr = day.toISOString().split('T')[0]
                  const isToday = dateStr === todayStr
                  return (
                    <DayColumn
                      key={dateStr}
                      dateStr={dateStr}
                      isToday={isToday}
                      slotTime={slotTime}
                      slotMinutes={slotMinutes}
                      appointments={appointments}
                      classSchedules={classSchedules}
                      events={events}
                      challengeSchedules={challengeSchedules}
                      filter={filter}
                      isDragging={isDragging}
                      dragOver={dragOver}
                      setDragOver={setDragOver}
                      onSlotDoubleClick={onSlotDoubleClick}
                      onSessionClick={onSessionClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDrop={onDrop}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
