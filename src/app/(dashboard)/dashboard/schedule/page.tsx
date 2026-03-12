'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WeekGrid } from './components/WeekGrid'
import { SessionDetailSheet } from './components/SessionDetailSheet'
import { AddSessionSheet } from './components/AddSessionSheet'
import { ScheduleSettingsSheet } from './components/ScheduleSettingsSheet'
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar } from 'lucide-react'
import type { SessionType } from './components/SessionCard'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type ClassScheduleRow = Tables['class_schedules']['Row'] & {
  class?: Tables['classes']['Row']
}
type ChallengeScheduleRow = Tables['challenge_schedules']['Row'] & {
  challenge?: Tables['challenges']['Row']
}

// --- Types ---
interface Appointment {
  id: string
  client_name: string
  client_id?: string
  date?: string
  time?: string
  start_time: string
  duration?: number
  duration_minutes?: number
  type?: string
  location?: string
  notes?: string
  status?: string
  appointment_date?: string
  trainer_id?: string
}

interface Client {
  id: string
  name: string
}

interface Class {
  id: string
  trainer_id: string
  name: string
  description?: string
  duration_minutes: number
  max_capacity: number
  location?: string
  is_active: boolean
}

interface ClassSchedule {
  id: string
  class_id?: string
  class_name?: string
  scheduled_date: string
  start_time: string
  end_time?: string
  location?: string
  max_capacity?: number
  current_bookings?: number
  status?: string
  notes?: string
  time?: string
  trainer_id?: string
  class?: Class
}

interface Event {
  id: string
  name: string
  start_date: string
  end_date?: string
  start_time: string
  end_time?: string
  location?: string
  description?: string
  status?: string
  price?: number
  max_capacity?: number
  current_bookings?: number
  trainer_id?: string
}

interface Challenge {
  id: string
  trainer_id: string
  name: string
  description?: string
  duration_minutes?: number
  max_capacity?: number
  location?: string
  is_active?: boolean
}

interface ChallengeSchedule {
  id: string
  challenge_id?: string
  challenge_name?: string
  scheduled_date: string
  start_time: string
  end_time?: string
  location?: string
  max_capacity?: number
  current_bookings?: number
  status?: string
  challenge?: Challenge
}

interface AppointmentTemplate {
  id: string
  name: string
  duration_minutes: number
  description?: string
}

interface EventTemplate {
  id: string
  name: string
  duration_minutes?: number
  max_capacity?: number
  location?: string
  description?: string
}

const FILTERS = ['All', 'Appointments', 'Classes', 'Events', 'Challenges'] as const
type Filter = typeof FILTERS[number]

function getWeekDays(date: Date): Date[] {
  const week: Date[] = []
  const d = new Date(date)
  const day = d.getDay()
  // Start from Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  for (let i = 0; i < 7; i++) {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    week.push(dd)
  }
  return week
}

function formatWeekRange(days: Date[]): string {
  if (!days.length) return ''
  const start = days[0]
  const end = days[6]
  const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export default function SchedulePage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [filter, setFilter] = useState<Filter>('All')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [detailSheet, setDetailSheet] = useState<{ session: any; type: SessionType } | null>(null)
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)

  // Time range state with localStorage persistence
  // Initialise with defaults so SSR and client first-render match, then apply saved values
  const [viewStartHour, setViewStartHour] = useState(5)
  const [viewEndHour, setViewEndHour] = useState(22)
  useEffect(() => {
    const savedStart = localStorage.getItem('schedule-view-start')
    const savedEnd = localStorage.getItem('schedule-view-end')
    if (savedStart) setViewStartHour(Number(savedStart))
    if (savedEnd) setViewEndHour(Number(savedEnd))
  }, [])
  const handleTimeRangeChange = (start: number, end: number) => {
    setViewStartHour(start)
    setViewEndHour(end)
    localStorage.setItem('schedule-view-start', String(start))
    localStorage.setItem('schedule-view-end', String(end))
  }

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [challengeSchedules, setChallengeSchedules] = useState<ChallengeSchedule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [appointmentTemplates, setAppointmentTemplates] = useState<AppointmentTemplate[]>([])
  const [eventTemplates, setEventTemplates] = useState<EventTemplate[]>([])

  // Scroll
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('schedule-has-scrolled') === 'true'
    }
    return false
  })

  // Drag
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{ type: string; data: any } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const weekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek])

  // Data fetching
  const refreshData = useCallback(async () => {
    if (!user) return
    try {
      const startDate = weekDays[0].toISOString().split('T')[0]
      const endDate = weekDays[6].toISOString().split('T')[0]

      const [
        appointmentResult,
        classResult,
        eventsResult,
        challengeResult,
        clientsResult,
        appointmentTemplatesResult,
        eventTemplatesResult,
        classesResult,
        challengesResult,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('trainer_id', user.id)
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate),
        supabase
          .from('class_schedules')
          .select('*, class:classes(*)')
          .eq('trainer_id', user.id)
          .gte('scheduled_date', startDate)
          .lte('scheduled_date', endDate),
        supabase
          .from('events')
          .select('*')
          .eq('trainer_id', user.id)
          .gte('start_date', startDate)
          .lte('end_date', endDate),
        supabase
          .from('challenge_schedules')
          .select('*, challenge:challenges(*)')
          .eq('trainer_id', user.id)
          .gte('scheduled_date', startDate)
          .lte('scheduled_date', endDate),
        supabase
          .from('user_profiles')
          .select('id, name')
          .eq('user_type', 'client')
          .order('name'),
        supabase
          .from('appointment_templates')
          .select('*')
          .eq('trainer_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('event_templates')
          .select('*')
          .eq('trainer_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('challenges')
          .select('*')
          .eq('trainer_id', user.id)
          .eq('is_active', true)
          .order('name'),
      ])

      // Transform appointments
      if (appointmentResult.data) {
        type AptRow = Tables['appointments']['Row']
        type ProfileRow = { id: string; name: string | null }
        const clientMap = new Map((clientsResult.data as unknown as ProfileRow[])?.map(c => [c.id, c.name]) || [])
        setAppointments(
          (appointmentResult.data as unknown as AptRow[]).map(apt => ({
            id: apt.id,
            client_name: apt.status === 'available' ? 'Available' : (clientMap.get(apt.client_id ?? '') || 'Client'),
            client_id: apt.client_id ?? undefined,
            date: apt.appointment_date,
            time: apt.start_time || '',
            start_time: apt.start_time || '',
            duration: apt.duration_minutes ?? undefined,
            duration_minutes: apt.duration_minutes ?? undefined,
            type: apt.appointment_type ?? 'personal_training',
            location: apt.location ?? undefined,
            notes: apt.notes ?? undefined,
            status: apt.status ?? undefined,
            appointment_date: apt.appointment_date,
            trainer_id: apt.trainer_id,
          }))
        )
      }

      // Transform class schedules
      if (classResult.data) {
        setClassSchedules(
          classResult.data.map(cls => {
            const cs = cls as ClassScheduleRow
            return {
              id: cs.id,
              class_id: cs.class_id,
              class_name: cs.class?.name || 'Class',
              scheduled_date: cs.scheduled_date,
              start_time: cs.start_time || '',
              time: cs.start_time || '',
              location: cs.location ?? cs.class?.location ?? undefined,
              max_capacity: cs.max_capacity ?? cs.class?.max_capacity ?? undefined,
              current_bookings: cs.current_bookings || 0,
              status: cs.status || 'scheduled',
              trainer_id: cs.trainer_id,
              class: cs.class as unknown as Class | undefined,
            } as ClassSchedule
          })
        )
      }

      setEvents(eventsResult.data || [])
      setClients(clientsResult.data || [])
      setAppointmentTemplates(appointmentTemplatesResult.data || [])
      setEventTemplates(eventTemplatesResult.data || [])
      setClasses(classesResult.data || [])
      setChallenges(challengesResult.data || [])

      // Transform challenge schedules
      if (challengeResult.data) {
        setChallengeSchedules(
          challengeResult.data.map(ch => {
            const cs = ch as ChallengeScheduleRow
            return {
              id: cs.id,
              challenge_id: cs.challenge_id,
              challenge_name: cs.challenge?.name || 'Challenge',
              scheduled_date: cs.scheduled_date,
              start_time: cs.start_time || '',
              end_time: cs.end_time || '',
              location: cs.location ?? undefined,
              max_capacity: cs.max_capacity ?? undefined,
              current_bookings: cs.current_bookings || 0,
              status: cs.status || 'scheduled',
              challenge: cs.challenge as unknown as Challenge | undefined,
            } as ChallengeSchedule
          })
        )
      }
    } catch (err: any) {
      toast.error('Failed to load schedule')
    }
  }, [user, weekDays])

  useEffect(() => {
    if (user) refreshData()
  }, [user, selectedWeek])


  // Inject top bar controls
  useEffect(() => {
    const weekRange = formatWeekRange(weekDays)
    setHeaderSearch(
      <div className="flex items-center gap-2">
        {/* Week navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedWeek(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">{weekRange}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedWeek(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
         
          className="h-8 text-xs bg-card"
          onClick={() => setSelectedWeek(new Date())}
        >
          Today
        </Button>
        {/* Filter */}
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="h-8 w-32 text-xs bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map(f => (
              <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
    setActions(
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="bg-card"
          onClick={() => setShowSettingsSheet(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="bg-card"
          onClick={() => {
            setSelectedSlot({
              date: new Date().toISOString().split('T')[0],
              time: '09:00',
            })
            setShowAddSheet(true)
          }}
        >
          <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
          Add Session
        </Button>
      </div>
    )
    return () => {
      setHeaderSearch(null)
      setActions(null)
    }
  }, [weekDays, filter, setActions, setHeaderSearch])

  // Drag handlers
  const handleDragStart = (type: string, data: any) => {
    setIsDragging(true)
    setDraggedItem({ type, data })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedItem(null)
    setDragOver(null)
  }

  const handleDrop = async (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault()
    setDragOver(null)
    if (!draggedItem) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    try {
      if (draggedItem.type === 'appointment') {
        const apt = draggedItem.data as Appointment
        await db
          .from('appointments')
          .update({ appointment_date: date, start_time: time })
          .eq('id', apt.id)
        toast.success('Appointment moved')
      } else if (draggedItem.type === 'class') {
        const cls = draggedItem.data as ClassSchedule
        await db
          .from('class_schedules')
          .update({ scheduled_date: date, start_time: time })
          .eq('id', cls.id)
        toast.success('Class rescheduled')
      } else if (draggedItem.type === 'event') {
        const evt = draggedItem.data as Event
        await db
          .from('events')
          .update({ start_date: date, start_time: time })
          .eq('id', evt.id)
        toast.success('Event rescheduled')
      } else if (draggedItem.type === 'challenge') {
        const ch = draggedItem.data as ChallengeSchedule
        await db
          .from('challenge_schedules')
          .update({ scheduled_date: date, start_time: time })
          .eq('id', ch.id)
        toast.success('Challenge rescheduled')
      }
      refreshData()
    } catch (err: unknown) {
      toast.error('Failed to move session')
    } finally {
      setIsDragging(false)
      setDraggedItem(null)
    }
  }

  const handleSlotDoubleClick = (date: string, time: string) => {
    setSelectedSlot({ date, time })
    setShowAddSheet(true)
  }

  const handleSessionClick = (session: any, type: SessionType) => {
    setDetailSheet({ session, type })
  }

  return (
    <div className="flex flex-col h-full">
      <WeekGrid
        weekDays={weekDays}
        appointments={appointments}
        classSchedules={classSchedules}
        events={events}
        challengeSchedules={challengeSchedules}
        filter={filter}
        hasInitiallyScrolled={hasInitiallyScrolled}
        setHasInitiallyScrolled={setHasInitiallyScrolled}
        isDragging={isDragging}
        dragOver={dragOver}
        setDragOver={setDragOver}
        onSlotDoubleClick={handleSlotDoubleClick}
        onSessionClick={handleSessionClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        startHour={viewStartHour}
        endHour={viewEndHour}
      />

      {/* Session detail / edit sheet */}
      <SessionDetailSheet
        open={!!detailSheet}
        onClose={() => setDetailSheet(null)}
        session={detailSheet?.session ?? null}
        type={detailSheet?.type ?? null}
        onRefresh={refreshData}
      />

      {/* Add session sheet */}
      <AddSessionSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        selectedSlot={selectedSlot}
        trainerId={user?.id || ''}
        appointmentTemplates={appointmentTemplates}
        classes={classes}
        eventTemplates={eventTemplates}
        challenges={challenges}
        clients={clients}
        onRefresh={refreshData}
      />

      {/* Schedule settings sheet */}
      <ScheduleSettingsSheet
        open={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        userId={user?.id || ''}
        startHour={viewStartHour}
        endHour={viewEndHour}
        onTimeRangeChange={handleTimeRangeChange}
      />
    </div>
  )
}
