// @ts-nocheck
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { User, Dumbbell, Calendar, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionType } from './SessionCard'

interface AppointmentTemplate {
  id: string
  name: string
  duration_minutes: number
  description?: string
}

interface ClassItem {
  id: string
  name: string
  duration_minutes: number
  max_capacity: number
  location?: string
}

interface EventTemplate {
  id: string
  name: string
  duration_minutes?: number
  max_capacity?: number
  location?: string
  description?: string
}

interface Challenge {
  id: string
  name: string
  duration_minutes?: number
  max_capacity?: number
  location?: string
  description?: string
}

interface Client {
  id: string
  name: string
}

interface AddSessionSheetProps {
  open: boolean
  onClose: () => void
  selectedSlot: { date: string; time: string } | null
  trainerId: string
  appointmentTemplates: AppointmentTemplate[]
  classes: ClassItem[]
  eventTemplates: EventTemplate[]
  challenges: Challenge[]
  clients: Client[]
  onRefresh: () => void
}

type TabType = 'appointment' | 'class' | 'event' | 'challenge'

const tabs: { type: TabType; label: string; icon: typeof User }[] = [
  { type: 'appointment', label: 'Appointment', icon: User },
  { type: 'class', label: 'Class', icon: Dumbbell },
  { type: 'event', label: 'Event', icon: Calendar },
  { type: 'challenge', label: 'Challenge', icon: Trophy },
]

export function AddSessionSheet({
  open,
  onClose,
  selectedSlot,
  trainerId,
  appointmentTemplates,
  classes,
  eventTemplates,
  challenges,
  clients,
  onRefresh,
}: AddSessionSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appointment')
  const [saving, setSaving] = useState(false)

  // Appointment form
  const [aptTemplate, setAptTemplate] = useState('')
  const [aptClient, setAptClient] = useState('')
  const [aptBookingType, setAptBookingType] = useState<'available' | 'booked'>('available')
  const [aptTime, setAptTime] = useState(selectedSlot?.time || '09:00')
  const [aptDuration, setAptDuration] = useState(60)
  const [aptLocation, setAptLocation] = useState('')
  const [aptNotes, setAptNotes] = useState('')
  const [aptRepeat, setAptRepeat] = useState(false)
  const [aptRepeatFreq, setAptRepeatFreq] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [aptRepeatDur, setAptRepeatDur] = useState<'month' | 'year' | 'end-of-year'>('month')

  // Class form
  const [classId, setClassId] = useState('')
  const [classTime, setClassTime] = useState(selectedSlot?.time || '09:00')
  const [classRepeat, setClassRepeat] = useState(false)
  const [classRepeatFreq, setClassRepeatFreq] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [classRepeatDur, setClassRepeatDur] = useState<'month' | 'year' | 'end-of-year'>('month')

  // Event form
  const [eventName, setEventName] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [eventStartDate, setEventStartDate] = useState(selectedSlot?.date || '')
  const [eventEndDate, setEventEndDate] = useState(selectedSlot?.date || '')
  const [eventStartTime, setEventStartTime] = useState(selectedSlot?.time || '09:00')
  const [eventEndTime, setEventEndTime] = useState('10:00')
  const [eventLocation, setEventLocation] = useState('')
  const [eventPrice, setEventPrice] = useState(0)
  const [eventCapacity, setEventCapacity] = useState(50)

  // Challenge form
  const [challengeId, setChallengeId] = useState('')
  const [challengeTime, setChallengeTime] = useState(selectedSlot?.time || '09:00')
  const [challengeEndTime, setChallengeEndTime] = useState('10:00')
  const [challengeLocation, setChallengeLocation] = useState('')
  const [challengeCapacity, setChallengeCapacity] = useState(20)

  const generateRepeatedDates = (startDate: string, freq: string, dur: string): string[] => {
    const dates: string[] = []
    const start = new Date(startDate + 'T00:00:00')
    let current = new Date(start)
    let end: Date

    if (dur === 'month') {
      end = new Date(start)
      end.setMonth(end.getMonth() + 1)
    } else if (dur === 'year') {
      end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)
    } else {
      end = new Date(start.getFullYear(), 11, 31)
    }

    const addDays = (d: Date, n: number) => {
      const r = new Date(d)
      r.setDate(r.getDate() + n)
      return r
    }

    current = addDays(current, freq === 'daily' ? 1 : freq === 'weekly' ? 7 : freq === 'biweekly' ? 14 : 30)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current = addDays(current, freq === 'daily' ? 1 : freq === 'weekly' ? 7 : freq === 'biweekly' ? 14 : 30)
    }
    return dates
  }

  const handleSave = async () => {
    if (!selectedSlot || !trainerId) return
    setSaving(true)

    try {
      if (activeTab === 'appointment') {
        const template = appointmentTemplates.find(t => t.id === aptTemplate)
        const status = aptBookingType === 'available' ? 'available' : 'scheduled'
        const insertData: any = {
          trainer_id: trainerId,
          appointment_date: selectedSlot.date,
          start_time: aptTime,
          duration_minutes: aptDuration,
          location: aptLocation || null,
          notes: aptNotes || null,
          status,
          client_id: aptBookingType === 'booked' ? aptClient || null : null,
          appointment_type: template?.name || 'personal_training',
        }
        const { error } = await supabase.from('appointments').insert(insertData)
        if (error) throw error

        if (aptRepeat) {
          const dates = generateRepeatedDates(selectedSlot.date, aptRepeatFreq, aptRepeatDur)
          for (const d of dates) {
            await supabase.from('appointments').insert({ ...insertData, appointment_date: d })
          }
        }
        toast.success('Appointment created')
      } else if (activeTab === 'class') {
        if (!classId) { toast.error('Please select a class'); return }
        // Calculate end_time from start + duration
        const calcEndTime = (start: string, mins: number) => {
          const [h, m] = start.split(':').map(Number)
          const total = h * 60 + m + mins
          return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
        }
        const insertData: any = {
          trainer_id: trainerId,
          class_id: classId,
          scheduled_date: selectedSlot.date,
          start_time: classTime,
          end_time: calcEndTime(classTime, selectedClass?.duration_minutes || 60),
          max_capacity: selectedClass?.max_capacity || 20,
          status: 'scheduled',
          current_bookings: 0,
        }
        const { error } = await supabase.from('class_schedules').insert(insertData)
        if (error) throw error

        if (classRepeat) {
          const dates = generateRepeatedDates(selectedSlot.date, classRepeatFreq, classRepeatDur)
          for (const d of dates) {
            await supabase.from('class_schedules').insert({ ...insertData, scheduled_date: d })
          }
        }
        toast.success('Class scheduled')
      } else if (activeTab === 'event') {
        if (!eventName) { toast.error('Please enter an event name'); return }
        const { error } = await supabase.from('events').insert({
          trainer_id: trainerId,
          name: eventName,
          description: eventDesc || null,
          start_date: eventStartDate,
          end_date: eventEndDate || eventStartDate,
          start_time: eventStartTime,
          end_time: eventEndTime || null,
          location: eventLocation || null,
          price: eventPrice || 0,
          max_capacity: eventCapacity || 50,
          status: 'scheduled',
          current_bookings: 0,
        })
        if (error) throw error
        toast.success('Event created')
      } else if (activeTab === 'challenge') {
        if (!challengeId) { toast.error('Please select a challenge'); return }
        const { error } = await supabase.from('challenge_schedules').insert({
          trainer_id: trainerId,
          challenge_id: challengeId,
          scheduled_date: selectedSlot.date,
          start_time: challengeTime,
          end_time: challengeEndTime || null,
          location: challengeLocation || null,
          max_capacity: challengeCapacity || 20,
          status: 'scheduled',
          current_bookings: 0,
        })
        if (error) throw error
        toast.success('Challenge scheduled')
      }

      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  const slotDisplay = selectedSlot
    ? `${new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${selectedSlot.time}`
    : ''

  const selectedClass = classes.find(c => c.id === classId)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Add to Schedule</SheetTitle>
          {slotDisplay && (
            <p className="text-sm text-muted-foreground">{slotDisplay}</p>
          )}
        </SheetHeader>

        {/* Type tabs */}
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted/50 p-1 mx-4">
          {tabs.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md py-2 text-xs font-medium transition-colors',
                activeTab === type
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-4 pb-2">
          {/* Appointment form */}
          {activeTab === 'appointment' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Appointment Type</Label>
                <select
                  value={aptTemplate}
                  onChange={(e) => setAptTemplate(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm"
                >
                  <option value="">Select type</option>
                  {appointmentTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes}min)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration</Label>
                <select
                  value={aptDuration}
                  onChange={(e) => setAptDuration(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={75}>1h 15min</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Booking Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'booked'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setAptBookingType(t)}
                      className={cn(
                        'rounded-md border p-2.5 text-left text-xs transition-colors',
                        aptBookingType === t
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {t === 'available' ? 'Available Slot' : 'Book for Client'}
                    </button>
                  ))}
                </div>
              </div>
              {aptBookingType === 'booked' && (
                <div className="space-y-1">
                  <Label className="text-xs">Client</Label>
                  <select
                    value={aptClient}
                    onChange={(e) => setAptClient(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm"
                  >
                    <option value="">Select client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Location (optional)</Label>
                <Input value={aptLocation} onChange={(e) => setAptLocation(e.target.value)} placeholder="e.g. Studio 1" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea value={aptNotes} onChange={(e) => setAptNotes(e.target.value)} rows={2} className="text-sm resize-none" />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="apt-repeat" checked={aptRepeat} onChange={(e) => setAptRepeat(e.target.checked)} className="h-4 w-4 rounded" />
                <Label htmlFor="apt-repeat" className="text-xs cursor-pointer">Repeat this appointment</Label>
              </div>
              {aptRepeat && (
                <div className="space-y-2 pl-6 border-l-2 border-border">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <select value={aptRepeatFreq} onChange={(e) => setAptRepeatFreq(e.target.value as any)} className="w-full h-8 rounded-md border border-input bg-background pl-3 pr-8 text-sm">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration</Label>
                    <select value={aptRepeatDur} onChange={(e) => setAptRepeatDur(e.target.value as any)} className="w-full h-8 rounded-md border border-input bg-background pl-3 pr-8 text-sm">
                      <option value="month">1 Month</option>
                      <option value="year">1 Year</option>
                      <option value="end-of-year">Until end of year</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Class form */}
          {activeTab === 'class' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Class</Label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm"
                >
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedClass && (
                <div className="rounded-md bg-muted p-3 space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium">Duration:</span> {selectedClass.duration_minutes} min</p>
                  <p><span className="font-medium">Capacity:</span> {selectedClass.max_capacity} participants</p>
                  {selectedClass.location && <p><span className="font-medium">Location:</span> {selectedClass.location}</p>}
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={classTime} onChange={(e) => setClassTime(e.target.value)} className="h-9" />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="class-repeat" checked={classRepeat} onChange={(e) => setClassRepeat(e.target.checked)} className="h-4 w-4 rounded" />
                <Label htmlFor="class-repeat" className="text-xs cursor-pointer">Repeat this class</Label>
              </div>
              {classRepeat && (
                <div className="space-y-2 pl-6 border-l-2 border-border">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <select value={classRepeatFreq} onChange={(e) => setClassRepeatFreq(e.target.value as any)} className="w-full h-8 rounded-md border border-input bg-background pl-3 pr-8 text-sm">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration</Label>
                    <select value={classRepeatDur} onChange={(e) => setClassRepeatDur(e.target.value as any)} className="w-full h-8 rounded-md border border-input bg-background pl-3 pr-8 text-sm">
                      <option value="month">1 Month</option>
                      <option value="year">1 Year</option>
                      <option value="end-of-year">Until end of year</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event form */}
          {activeTab === 'event' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Event Name</Label>
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Nutrition Workshop" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} rows={2} className="text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location (optional)</Label>
                <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Event location" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Price (£)</Label>
                  <Input type="number" value={eventPrice} onChange={(e) => setEventPrice(parseFloat(e.target.value) || 0)} min="0" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Capacity</Label>
                  <Input type="number" value={eventCapacity} onChange={(e) => setEventCapacity(parseInt(e.target.value) || 50)} min="1" className="h-9" />
                </div>
              </div>
            </div>
          )}

          {/* Challenge form */}
          {activeTab === 'challenge' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Challenge</Label>
                <select
                  value={challengeId}
                  onChange={(e) => setChallengeId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm"
                >
                  <option value="">Select challenge</option>
                  {challenges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input type="time" value={challengeTime} onChange={(e) => setChallengeTime(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input type="time" value={challengeEndTime} onChange={(e) => setChallengeEndTime(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location (optional)</Label>
                <Input value={challengeLocation} onChange={(e) => setChallengeLocation(e.target.value)} placeholder="Location" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Capacity</Label>
                <Input type="number" value={challengeCapacity} onChange={(e) => setChallengeCapacity(parseInt(e.target.value) || 20)} min="1" className="h-9" />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 border-t">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Add to Schedule'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
