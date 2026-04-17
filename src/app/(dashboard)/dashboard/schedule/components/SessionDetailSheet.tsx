// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Users, Trash2, Edit2, X, UserPlus, ArrowLeft, Search } from 'lucide-react'
import type { SessionType } from './SessionCard'
import { BookingsSheet } from './BookingsSheet'

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
  class?: {
    name?: string
    duration_minutes?: number
    location?: string
    max_capacity?: number
  }
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
  challenge?: {
    name?: string
    duration_minutes?: number
    description?: string
  }
}

type SessionData = Appointment | ClassSchedule | Event | ChallengeSchedule

interface SessionDetailSheetProps {
  open: boolean
  onClose: () => void
  session: SessionData | null
  type: SessionType | null
  onRefresh: () => void
}

const typeLabels: Record<SessionType, string> = {
  appointment: 'Appointment',
  class: 'Class',
  event: 'Event',
  challenge: 'Challenge',
}

const typeVariants: Record<SessionType, 'default' | 'secondary' | 'outline'> = {
  appointment: 'default',
  class: 'secondary',
  event: 'outline',
  challenge: 'secondary',
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${period}`
}

export function SessionDetailSheet({
  open,
  onClose,
  session,
  type,
  onRefresh,
}: SessionDetailSheetProps) {
  const { user } = useSimpleAuth()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'future'>('single')
  const [showBookings, setShowBookings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inlineBookings, setInlineBookings] = useState<{ id: string; client_id?: string; client_name: string; booking_status: string; ability_tier?: string | null; is_birthday?: boolean }[]>([])
  const [kbSummary, setKbSummary] = useState<{ weight: string; needed: number; available: number }[] | null>(null)
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Book client state
  const [showBookClient, setShowBookClient] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [bookTier, setBookTier] = useState('')
  const [bookBypass, setBookBypass] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)
  const [bookBypassable, setBookBypassable] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [bookClientIds, setBookClientIds] = useState<Set<string>>(new Set())
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  const handleTierChange = async (bookingId: string, newTier: string | null) => {
    setEditingTierId(null)
    setInlineBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ability_tier: newTier } : b))
    await supabase.from('challenge_bookings').update({ ability_tier: newTier }).eq('id', bookingId)
  }

  // Check if a date_of_birth (YYYY-MM-DD) falls on the same month/day as sessionDate (YYYY-MM-DD)
  const isBirthday = (dob: string | null, sessionDate: string): boolean => {
    if (!dob || !sessionDate) return false
    return dob.slice(5) === sessionDate.slice(5) // MM-DD comparison
  }

  useEffect(() => {
    if (!open || !session || type === 'appointment') { setInlineBookings([]); setKbSummary(null); return }
    setLoadingBookings(true)
    const s = session as any
    const sessionDate: string = s.scheduled_date || s.start_date || ''
    let endpoint = ''
    if (type === 'class') endpoint = `/api/class-bookings?classScheduleId=${s.id}`
    else if (type === 'event') endpoint = `/api/event-bookings?eventId=${s.id}`
    else if (type === 'challenge') endpoint = `/api/challenge-bookings?scheduleId=${s.id}`
    if (!endpoint) { setLoadingBookings(false); return }
    const trialistPromise = type === 'class'
      ? fetch(`/api/trialist-bookings?scheduleId=${s.id}`).then(r => r.ok ? r.json() : []).catch(() => [])
      : Promise.resolve([])
    Promise.all([fetch(endpoint).then(r => r.json()), trialistPromise])
      .then(async ([data, trialists]) => {
        const bookings = (data.bookings || []).filter((b: any) => b.booking_status !== 'cancelled')
        const mapped = bookings.map((b: any) => ({
          id: b.id,
          client_id: b.client_id ?? undefined,
          client_name: b.user_profiles?.name || 'Unknown',
          booking_status: b.booking_status,
          ability_tier: b.ability_tier ?? null,
          is_birthday: false,
        }))
        const trialMapped = (trialists as any[]).map(t => ({
          id: t.id,
          client_name: `${t.first_name} ${t.last_name} (Trial)`,
          booking_status: 'confirmed',
          ability_tier: null,
          is_birthday: false,
        }))

        // Fetch DOBs for real clients and flag birthdays
        const clientIds = mapped.map((b: any) => b.client_id).filter(Boolean)
        if (clientIds.length > 0 && sessionDate) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, date_of_birth')
            .in('id', clientIds)
          const dobMap: Record<string, string | null> = {}
          for (const p of (profiles || []) as { id: string; date_of_birth: string | null }[]) {
            dobMap[p.id] = p.date_of_birth
          }
          for (const b of mapped) {
            if (b.client_id) b.is_birthday = isBirthday(dobMap[b.client_id] ?? null, sessionDate)
          }
        }

        setInlineBookings([...mapped, ...trialMapped])
        setKbSummary(data.kb_summary ?? null)
      })
      .catch(() => { setInlineBookings([]); setKbSummary(null) })
      .finally(() => setLoadingBookings(false))
  }, [open, session, type])

  useEffect(() => {
    if (!showBookClient || clients.length > 0) return
    setLoadingClients(true)
    supabase
      .from('user_profiles')
      .select('id, name')
      .eq('user_type', 'client')
      .order('name')
      .then(({ data }) => {
        setClients((data || []).map((c: any) => ({ id: c.id, name: c.name || 'Unknown' })))
      })
      .finally(() => setLoadingClients(false))
  }, [showBookClient])

  const refreshBookings = () => {
    const s = session as any
    const sessionDate: string = s.scheduled_date || s.start_date || ''
    let endpoint = ''
    if (type === 'class') endpoint = `/api/class-bookings?classScheduleId=${s.id}`
    else if (type === 'event') endpoint = `/api/event-bookings?eventId=${s.id}`
    else if (type === 'challenge') endpoint = `/api/challenge-bookings?scheduleId=${s.id}`
    if (!endpoint) return
    const trialistPromise = type === 'class'
      ? fetch(`/api/trialist-bookings?scheduleId=${s.id}`).then(r => r.ok ? r.json() : []).catch(() => [])
      : Promise.resolve([])
    Promise.all([fetch(endpoint).then(r => r.json()), trialistPromise])
      .then(async ([d, trialists]) => {
        const bookings = (d.bookings || []).filter((b: any) => b.booking_status !== 'cancelled')
        const mapped = bookings.map((b: any) => ({
          id: b.id,
          client_id: b.client_id ?? undefined,
          client_name: b.user_profiles?.name || 'Unknown',
          booking_status: b.booking_status,
          ability_tier: b.ability_tier ?? null,
          is_birthday: false,
        }))
        const trialMapped = (trialists as any[]).map(t => ({
          id: t.id,
          client_name: `${t.first_name} ${t.last_name} (Trial)`,
          booking_status: 'confirmed',
          ability_tier: null,
          is_birthday: false,
        }))

        const clientIds = mapped.map((b: any) => b.client_id).filter(Boolean)
        if (clientIds.length > 0 && sessionDate) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, date_of_birth')
            .in('id', clientIds)
          const dobMap: Record<string, string | null> = {}
          for (const p of (profiles || []) as { id: string; date_of_birth: string | null }[]) {
            dobMap[p.id] = p.date_of_birth
          }
          for (const b of mapped) {
            if (b.client_id) b.is_birthday = isBirthday(dobMap[b.client_id] ?? null, sessionDate)
          }
        }

        setInlineBookings([...mapped, ...trialMapped])
        setKbSummary(d.kb_summary ?? null)
      }).catch(() => {})
  }

  const handleBookClient = async () => {
    if (bookClientIds.size === 0) return
    setBooking(true)
    setBookError(null)
    setBookBypassable(false)
    const ids = Array.from(bookClientIds)
    const errors: string[] = []
    let anyBypassable = false

    for (const clientId of ids) {
      const body: any = { type, scheduleId: session?.id, clientId, bypass: bookBypass }
      if (type === 'challenge' && bookTier) body.abilityTier = bookTier
      const res = await fetch('/api/trainer-book-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        const name = clients.find(c => c.id === clientId)?.name ?? clientId
        errors.push(`${name}: ${data.error || 'Failed'}`)
        if (data.bypassable) anyBypassable = true
      }
    }

    setBooking(false)

    if (errors.length === 0) {
      toast.success(ids.length === 1 ? 'Client booked' : `${ids.length} clients booked`)
      setShowBookClient(false)
      setBookClientIds(new Set())
      setBookTier('')
      setBookBypass(false)
      setBookError(null)
      refreshBookings()
      onRefresh()
    } else {
      setBookError(errors.join('\n'))
      setBookBypassable(anyBypassable)
      // Still refresh to show any that did succeed
      refreshBookings()
      onRefresh()
    }
  }

  // Edit form state
  const [editTime, setEditTime] = useState('')
  const [editDuration, setEditDuration] = useState(60)
  const [editLocation, setEditLocation] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editMaxCapacity, setEditMaxCapacity] = useState(20)

  if (!session || !type) return null

  const handleStartEdit = () => {
    if (type === 'appointment') {
      const apt = session as Appointment
      setEditTime(apt.start_time || apt.time || '')
      setEditDuration(apt.duration_minutes || apt.duration || 60)
      setEditLocation(apt.location || '')
      setEditNotes(apt.notes || '')
    } else if (type === 'class') {
      const cls = session as ClassSchedule
      setEditTime(cls.start_time || '')
      setEditLocation(cls.location || cls.class?.location || '')
      setEditNotes(cls.notes || '')
      setEditMaxCapacity(cls.max_capacity || cls.class?.max_capacity || 20)
      setEditDuration(cls.class?.duration_minutes || 60)
    } else if (type === 'event') {
      const evt = session as Event
      setEditTime(evt.start_time || '')
      setEditEndTime(evt.end_time || '')
      setEditLocation(evt.location || '')
      setEditNotes(evt.description || '')
      setEditMaxCapacity(evt.max_capacity || 50)
    } else if (type === 'challenge') {
      const ch = session as ChallengeSchedule
      setEditTime(ch.start_time || '')
      setEditEndTime(ch.end_time || '')
      setEditLocation(ch.location || '')
      setEditMaxCapacity(ch.max_capacity || 20)
    }
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (type === 'appointment') {
        const { error } = await supabase
          .from('appointments')
          .update({
            start_time: editTime,
            duration_minutes: editDuration,
            location: editLocation || null,
            notes: editNotes || null,
          })
          .eq('id', session.id)
        if (error) throw error
      } else if (type === 'class') {
        const calcEndTime = (start: string, mins: number) => {
          const [h, m] = start.split(':').map(Number)
          const total = h * 60 + m + mins
          return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
        }
        const cls = session as ClassSchedule
        const oldCap = cls.max_capacity ?? cls.class?.max_capacity ?? 0
        const { error } = await supabase
          .from('class_schedules')
          .update({
            start_time: editTime,
            end_time: calcEndTime(editTime, editDuration),
            location: editLocation || null,
            max_capacity: editMaxCapacity || null,
          })
          .eq('id', session.id)
        if (error) throw error
        // If cap increased, promote waitlisted clients into the new spots
        if (editMaxCapacity > oldCap && user?.id) {
          const currentConfirmed = cls.current_bookings ?? 0
          const availableSpots = editMaxCapacity - currentConfirmed
          if (availableSpots > 0) {
            const { data: waitlisted } = await supabase
              .from('class_bookings')
              .select('id')
              .eq('class_schedule_id', session.id)
              .eq('booking_status', 'waitlist')
              .order('created_at', { ascending: true })
              .limit(availableSpots)
            for (const booking of (waitlisted ?? [])) {
              await supabase.rpc('promote_specific_waitlist_client', {
                booking_id: booking.id,
                trainer_id_param: user.id,
              })
            }
          }
        }
      } else if (type === 'event') {
        const { error } = await supabase
          .from('events')
          .update({
            start_time: editTime,
            end_time: editEndTime || null,
            location: editLocation || null,
            description: editNotes || null,
            max_capacity: editMaxCapacity || null,
          })
          .eq('id', session.id)
        if (error) throw error
      } else if (type === 'challenge') {
        const { error } = await supabase
          .from('challenge_schedules')
          .update({
            start_time: editTime,
            end_time: editEndTime || null,
            location: editLocation || null,
            max_capacity: editMaxCapacity || null,
          })
          .eq('id', session.id)
        if (error) throw error
      }
      toast.success('Session updated')
      setEditing(false)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (mode: 'single' | 'future' = 'single') => {
    setDeleting(true)
    try {
      let error = null
      const repeatGroupId = (session as any).repeat_group_id
      const scheduledDate = (session as any).scheduled_date

      if (mode === 'future' && type === 'class') {
        if (repeatGroupId) {
          // Delete by repeat group ID (new sessions)
          ;({ error } = await (supabase as any).from('class_schedules').delete()
            .eq('repeat_group_id', repeatGroupId)
            .gte('scheduled_date', scheduledDate))
        } else {
          // Fall back: delete by matching class_id + start_time (old sessions without group ID)
          const classId = (session as any).class_id
          const startTime = (session as any).start_time
          ;({ error } = await (supabase as any).from('class_schedules').delete()
            .eq('class_id', classId)
            .eq('start_time', startTime)
            .gte('scheduled_date', scheduledDate))
        }
      } else {
        if (type === 'appointment') {
          ;({ error } = await supabase.from('appointments').delete().eq('id', session.id))
        } else if (type === 'class') {
          ;({ error } = await supabase.from('class_schedules').delete().eq('id', session.id))
        } else if (type === 'event') {
          ;({ error } = await supabase.from('events').delete().eq('id', session.id))
        } else if (type === 'challenge') {
          ;({ error } = await supabase.from('challenge_schedules').delete().eq('id', session.id))
        }
      }
      if (error) throw error
      toast.success(mode === 'future' ? 'This and all future sessions deleted' : 'Session deleted')
      setConfirmDelete(false)
      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // Derive display info
  const getTitle = () => {
    if (type === 'appointment') return (session as Appointment).client_name || 'Appointment'
    if (type === 'class') return (session as ClassSchedule).class?.name || (session as ClassSchedule).class_name || 'Class'
    if (type === 'event') return (session as Event).name || 'Event'
    if (type === 'challenge') return (session as ChallengeSchedule).challenge?.name || (session as ChallengeSchedule).challenge_name || 'Challenge'
    return ''
  }

  const getDate = () => {
    if (type === 'appointment') return (session as Appointment).appointment_date || (session as Appointment).date || ''
    if (type === 'class') return (session as ClassSchedule).scheduled_date || ''
    if (type === 'event') return (session as Event).start_date || ''
    if (type === 'challenge') return (session as ChallengeSchedule).scheduled_date || ''
    return ''
  }

  const getStartTime = () => {
    if (type === 'appointment') return (session as Appointment).start_time || (session as Appointment).time || ''
    return (session as any).start_time || ''
  }

  const getEndTime = () => {
    if (type === 'appointment') {
      const apt = session as Appointment
      const dur = apt.duration_minutes || apt.duration || 60
      const [h, m] = (apt.start_time || '00:00').split(':').map(Number)
      const total = h * 60 + m + dur
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }
    if (type === 'class') {
      const cls = session as ClassSchedule
      if (cls.end_time) return cls.end_time
      const dur = cls.class?.duration_minutes || 60
      const [h, m] = (cls.start_time || '00:00').split(':').map(Number)
      const total = h * 60 + m + dur
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }
    return (session as any).end_time || ''
  }

  const getLocation = () => {
    if (type === 'class') {
      const cls = session as ClassSchedule
      return cls.location || cls.class?.location || ''
    }
    return (session as any).location || ''
  }

  const getBookings = () => {
    if (type === 'appointment') return null
    const s = session as any
    // Use real booking count once loaded; fall back to cached counter
    const current = !loadingBookings ? inlineBookings.filter(b => b.booking_status !== 'cancelled').length : (s.current_bookings ?? 0)
    const max = s.max_capacity || s.class?.max_capacity || '∞'
    return `${current}/${max} booked`
  }

  const getDescription = () => {
    if (type === 'appointment') return (session as Appointment).notes || ''
    if (type === 'event') return (session as Event).description || ''
    if (type === 'challenge') return (session as ChallengeSchedule).challenge?.description || ''
    return ''
  }

  const dateStr = getDate()
  const formattedDate = dateStr
    ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setEditing(false); setConfirmDelete(false); setShowBookClient(false); setBookError(null); setBookBypass(false); setBookClientIds(new Set()); setBookTier(''); setClientSearch('') } }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        {showBookClient ? (
          /* ── Book client page ── */
          <>
            <SheetHeader className="pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowBookClient(false); setBookError(null); setBookBypass(false); setBookClientIds(new Set()); setBookTier(''); setClientSearch('') }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-lg font-semibold">Book clients</SheetTitle>
              </div>
            </SheetHeader>

            {/* Fixed controls — search, tier, error */}
            <div className="px-4 flex flex-col gap-2 shrink-0 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search clients…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
              </div>

              {type === 'challenge' && (
                <div className="flex gap-2">
                  {(['', 'grey', 'blue', 'black'] as const).map(t => (
                    <button key={t} onClick={() => setBookTier(t)}
                      className={`flex-1 text-xs py-1.5 rounded-md border transition-colors capitalize ${bookTier === t ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}>
                      {t || 'No tier'}
                    </button>
                  ))}
                </div>
              )}

              {bookError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 space-y-1.5">
                  <p className="text-xs text-destructive whitespace-pre-line">{bookError}</p>
                  {bookBypassable && !bookBypass && (
                    <button className="text-xs text-amber-400 underline" onClick={() => setBookBypass(true)}>
                      Bypass checks and retry
                    </button>
                  )}
                  {bookBypass && <p className="text-xs text-amber-400 font-medium">Checks bypassed</p>}
                </div>
              )}
            </div>

            {/* Scrollable client list */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
              {loadingClients ? (
                <p className="text-xs text-muted-foreground">Loading clients…</p>
              ) : (() => {
                const filtered = clients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                const allSelected = filtered.length > 0 && filtered.every(c => bookClientIds.has(c.id))
                return (
                  <div className="flex flex-col rounded-lg border border-border overflow-hidden divide-y divide-border">
                    {/* Select all row */}
                    <button
                      onClick={() => {
                        setBookClientIds(prev => {
                          const next = new Set(prev)
                          if (allSelected) filtered.forEach(c => next.delete(c.id))
                          else filtered.forEach(c => next.add(c.id))
                          return next
                        })
                        setBookError(null); setBookBypassable(false); setBookBypass(false)
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors text-left"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${allSelected ? 'bg-foreground border-foreground' : 'border-border'}`}>
                        {allSelected && <span className="text-background text-[10px] leading-none">✓</span>}
                      </span>
                      {allSelected ? 'Deselect all' : `Select all${filtered.length !== clients.length ? ` (${filtered.length})` : ''}`}
                    </button>
                    {filtered.map(c => {
                      const selected = bookClientIds.has(c.id)
                      return (
                        <button key={c.id}
                          onClick={() => {
                            setBookClientIds(prev => { const next = new Set(prev); selected ? next.delete(c.id) : next.add(c.id); return next })
                            setBookError(null); setBookBypassable(false); setBookBypass(false)
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left ${selected ? 'bg-foreground/8 text-foreground' : 'hover:bg-muted text-foreground/80'}`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-foreground border-foreground' : 'border-border'}`}>
                            {selected && <span className="text-background text-[10px] leading-none">✓</span>}
                          </span>
                          {c.name}
                        </button>
                      )
                    })}
                    {filtered.length === 0 && (
                      <p className="text-xs text-muted-foreground px-3 py-2.5">No clients match</p>
                    )}
                  </div>
                )
              })()}
            </div>

            <SheetFooter className="pt-4 border-t shrink-0">
              <Button className="w-full" onClick={handleBookClient} disabled={bookClientIds.size === 0 || booking}>
                {booking
                  ? 'Booking…'
                  : bookClientIds.size === 0
                  ? 'Select clients to book'
                  : bookBypass
                  ? `Book ${bookClientIds.size} client${bookClientIds.size > 1 ? 's' : ''} (bypassed)`
                  : `Book ${bookClientIds.size} client${bookClientIds.size > 1 ? 's' : ''}`}
              </Button>
            </SheetFooter>
          </>
        ) : (
          /* ── Session detail page ── */
          <>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant={typeVariants[type]} className="capitalize">
              {typeLabels[type]}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold mt-2">{getTitle()}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-2">
          {/* Date & Time */}
          <div className="space-y-2">
            {formattedDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formatTime(getStartTime())} – {formatTime(getEndTime())}</span>
            </div>
            {getLocation() && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{getLocation()}</span>
              </div>
            )}
            {getBookings() && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{getBookings()}</span>
              </div>
            )}
          </div>

          {getDescription() && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{getDescription()}</p>
            </>
          )}

          {/* KB equipment summary — challenges with kettlebell tier_capacity */}
          {kbSummary && kbSummary.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Kettlebells needed</p>
                <div className="flex flex-wrap gap-2">
                  {kbSummary.map(({ weight, needed, available }) => (
                    <div key={weight} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${needed > available ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/[0.03] text-foreground'}`}>
                      <span className="font-semibold">{weight}</span>
                      <span className={needed > available ? 'text-red-400' : 'text-muted-foreground'}>{needed}/{available}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Inline bookings — class / event / challenge only */}
          {type !== 'appointment' && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {loadingBookings ? 'Loading…' : `${inlineBookings.filter(b => b.booking_status !== 'cancelled').length} booked`}
                  </span>
                  {!loadingBookings && (() => {
                    const active = inlineBookings.filter(b => b.booking_status !== 'cancelled')
                    const grey = active.filter(b => b.ability_tier === 'grey').length
                    const blue = active.filter(b => b.ability_tier === 'blue').length
                    const black = active.filter(b => b.ability_tier === 'black').length
                    if (!grey && !blue && !black) return null
                    return (
                      <>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        {grey > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400">Grey {grey}</span>}
                        {blue > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Blue {blue}</span>}
                        {black > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-900/60 text-zinc-300">Black {black}</span>}
                      </>
                    )
                  })()}
                </div>
                {!loadingBookings && inlineBookings.length === 0 && (
                  <p className="text-xs text-muted-foreground">No bookings yet</p>
                )}
                {!loadingBookings && inlineBookings.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {inlineBookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                        <span className="text-foreground flex items-center gap-1">
                          {b.client_name}
                          {b.is_birthday && <span title="Birthday today!">🎂</span>}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {type === 'challenge' && editingTierId === b.id ? (
                            <div className="flex items-center gap-1">
                              {(['grey', 'blue', 'black'] as const).map(t => (
                                <button key={t} onClick={() => handleTierChange(b.id, t)}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize border transition-colors ${b.ability_tier === t ? 'bg-foreground text-background border-foreground' : 'bg-muted text-muted-foreground border-border hover:bg-muted/70'}`}>
                                  {t}
                                </button>
                              ))}
                              <button onClick={() => setEditingTierId(null)} className="text-[10px] text-muted-foreground hover:text-foreground ml-0.5">✕</button>
                            </div>
                          ) : (
                            <>
                              {type === 'challenge' ? (
                                <button onClick={() => setEditingTierId(b.id)}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize bg-muted text-muted-foreground hover:bg-muted/70 transition-colors">
                                  {b.ability_tier || 'no tier'}
                                </button>
                              ) : b.ability_tier ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize bg-muted text-muted-foreground">{b.ability_tier}</span>
                              ) : null}
                            </>
                          )}
                          {b.booking_status === 'waitlist' && (
                            <span className="text-[10px] text-amber-500">waitlist</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Edit form */}
          {editing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Edit Session</h4>
                <div className="space-y-1">
                  <Label htmlFor="edit-time" className="text-xs">Start Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {(type === 'appointment' || type === 'class') && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-duration" className="text-xs">Duration (minutes)</Label>
                    <select
                      id="edit-duration"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hour</option>
                      <option value={75}>1h 15min</option>
                      <option value={90}>1h 30min</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                )}
                {(type === 'event' || type === 'challenge') && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-end-time" className="text-xs">End Time</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="edit-location" className="text-xs">Location</Label>
                  <Input
                    id="edit-location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="h-8 text-sm"
                  />
                </div>
                {(type === 'class' || type === 'event' || type === 'challenge') && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-capacity" className="text-xs">Max Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      value={editMaxCapacity}
                      onChange={(e) => setEditMaxCapacity(Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                {(type === 'appointment' || type === 'event') && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-notes" className="text-xs">{type === 'appointment' ? 'Notes' : 'Description'}</Label>
                    <Textarea
                      id="edit-notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <>
              <Separator />
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-3">
                <p className="text-sm text-destructive font-medium">
                  Delete this {typeLabels[type].toLowerCase()}?
                </p>
                {type === 'class' && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${deleteMode === 'single' ? 'border-destructive bg-destructive/10 text-destructive font-medium' : 'border-border hover:bg-muted'}`}
                      onClick={() => setDeleteMode('single')}
                    >
                      This session only
                    </button>
                    <button
                      className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${deleteMode === 'future' ? 'border-destructive bg-destructive/10 text-destructive font-medium' : 'border-border hover:bg-muted'}`}
                      onClick={() => setDeleteMode('future')}
                    >
                      This and all future sessions in this series
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteMode)} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="pt-4 border-t flex-col gap-2 sm:flex-col">
          {!editing && !confirmDelete && (
            <div className="flex flex-col gap-2 w-full">
              {type !== 'appointment' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setShowBookClient(true); setBookError(null); setBookBypass(false) }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Book client
                </Button>
              )}
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStartEdit}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
          {editing && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}
        </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>

    {/* Bookings roster — nested sheet */}
    {(type === 'class' || type === 'event' || type === 'challenge') && (
      <BookingsSheet
        open={showBookings}
        onClose={() => setShowBookings(false)}
        type={type as 'class' | 'event' | 'challenge'}
        scheduleId={type === 'class' ? (session as ClassSchedule)?.id : undefined}
        eventId={type === 'event' ? (session as Event)?.id : undefined}
        challengeScheduleId={type === 'challenge' ? (session as any)?.id : undefined}
        title={(type === 'class'
          ? (session as ClassSchedule)?.class?.name || (session as ClassSchedule)?.class_name
          : type === 'challenge'
          ? (session as any)?.challenge?.name || (session as any)?.challenge_name
          : (session as Event)?.name) || ''}
        subtitle={`${getDate()} · ${formatTime(getStartTime())}`}
        maxCapacity={(session as any)?.max_capacity}
        sessionDate={getDate()}
        sessionStartTime={getStartTime()}
      />
    )}
  </>
  )
}

