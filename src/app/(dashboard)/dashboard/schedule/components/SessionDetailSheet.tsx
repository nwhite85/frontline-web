// @ts-nocheck
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Users, Trash2, Edit2, X } from 'lucide-react'
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
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showBookings, setShowBookings] = useState(false)
  const [saving, setSaving] = useState(false)

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
        const { error } = await supabase
          .from('class_schedules')
          .update({
            start_time: editTime,
            location: editLocation || null,
            max_capacity: editMaxCapacity || null,
          })
          .eq('id', session.id)
        if (error) throw error
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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      let error = null
      if (type === 'appointment') {
        ;({ error } = await supabase.from('appointments').delete().eq('id', session.id))
      } else if (type === 'class') {
        ;({ error } = await supabase.from('class_schedules').delete().eq('id', session.id))
      } else if (type === 'event') {
        ;({ error } = await supabase.from('events').delete().eq('id', session.id))
      } else if (type === 'challenge') {
        ;({ error } = await supabase.from('challenge_schedules').delete().eq('id', session.id))
      }
      if (error) throw error
      toast.success('Session deleted')
      setConfirmDelete(false)
      onClose()
      onRefresh()
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
    const current = s.current_bookings ?? 0
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
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setEditing(false); setConfirmDelete(false) } }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant={typeVariants[type]} className="capitalize">
              {typeLabels[type]}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold mt-2">{getTitle()}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
                {type === 'appointment' && (
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
                  Are you sure you want to delete this {typeLabels[type].toLowerCase()}?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                   
                    className="flex-1"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                   
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="pt-4 border-t flex-col gap-2 sm:flex-col">
          {!editing && !confirmDelete && (type === 'class' || type === 'event') && (
            <Button
              variant="outline"
             
              className="w-full"
              onClick={() => setShowBookings(true)}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              View Bookings
            </Button>
          )}
          {!editing && !confirmDelete && (
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
      </SheetContent>
    </Sheet>

    {/* Bookings roster — nested sheet */}
    {(type === 'class' || type === 'event') && (
      <BookingsSheet
        open={showBookings}
        onClose={() => setShowBookings(false)}
        type={type as 'class' | 'event'}
        scheduleId={type === 'class' ? (session as ClassSchedule)?.id : undefined}
        eventId={type === 'event' ? (session as Event)?.id : undefined}
        title={(type === 'class'
          ? (session as ClassSchedule)?.class?.name || (session as ClassSchedule)?.class_name
          : (session as Event)?.name) || ''}
        subtitle={`${getDate()} · ${formatTime(getStartTime())}`}
        maxCapacity={(session as any)?.max_capacity || (session as ClassSchedule)?.class?.max_capacity}
      />
    )}
  </>
  )
}

