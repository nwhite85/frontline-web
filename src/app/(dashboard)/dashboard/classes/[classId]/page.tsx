'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { ArrowLeft, Edit2, BookOpen, Clock, Users, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassTemplate {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  max_capacity: number
  location: string | null
  location_type: string
  price: number | null
  skill_level: string | null
  is_active: boolean | null
  trainer_id: string
}

interface ClassSchedule {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  current_bookings: number | null
  max_capacity: number
  status: string | null
  location: string | null
}

// ─── Edit Class Sheet ─────────────────────────────────────────────────────────

function EditClassSheet({
  open,
  onOpenChange,
  cls,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  cls: ClassTemplate
  onSaved: (updated: ClassTemplate) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('60')
  const [maxCapacity, setMaxCapacity] = useState('10')
  const [location, setLocation] = useState('')
  const [locationType, setLocationType] = useState('in-person')
  const [price, setPrice] = useState('0')
  const [skillLevel, setSkillLevel] = useState('all')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      setName(cls.name)
      setDescription(cls.description || '')
      setDuration(String(cls.duration_minutes))
      setMaxCapacity(String(cls.max_capacity))
      setLocation(cls.location || '')
      setLocationType(cls.location_type || 'in-person')
      setPrice(String(cls.price ?? 0))
      setSkillLevel(cls.skill_level || 'all')
      setIsActive(cls.is_active ?? true)
      setFormError('')
    }
  }, [open, cls])

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        duration_minutes: parseInt(duration) || 60,
        max_capacity: parseInt(maxCapacity) || 10,
        location: location || null,
        location_type: locationType,
        price: parseFloat(price) || 0,
        skill_level: skillLevel,
        is_active: isActive,
      }
      const { data, error } = await supabase
        .from('classes')
        // @ts-ignore
        .update(payload)
        .eq('id', cls.id)
        .select()
        .single()
      if (error) throw error
      toast.success('Class updated')
      onSaved(data as ClassTemplate)
      onOpenChange(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>Edit Class</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="grid gap-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HIIT Class" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} />
            </div>
            <div className="grid gap-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} min={1} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Studio A" />
          </div>
          <div className="grid gap-1.5">
            <Label>Location Type</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Price (£)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min={0} step={0.01} />
            </div>
            <div className="grid gap-1.5">
              <Label>Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const classId = params.classId as string

  const [cls, setCls] = useState<ClassTemplate | null>(null)
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classNotFound, setClassNotFound] = useState(false)

  const [showEditSheet, setShowEditSheet] = useState(false)

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => setShowEditSheet(true)}>
        <Edit2 className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Edit Class
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    if (!user || !classId) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: classData, error: classErr } = await supabase
          .from('classes')
          .select('id, name, description, duration_minutes, max_capacity, location, location_type, price, skill_level, is_active, trainer_id')
          .eq('id', classId)
          .eq('trainer_id', user.id)
          .single()

        if (classErr) {
          if (classErr.code === 'PGRST116') { setClassNotFound(true); setLoading(false); return }
          throw classErr
        }
        setCls(classData as ClassTemplate)

        const { data: schedData } = await supabase
          .from('class_schedules')
          .select('id, scheduled_date, start_time, end_time, current_bookings, max_capacity, status, location')
          .eq('class_id', classId)
          .order('scheduled_date', { ascending: true })
        setSchedules((schedData ?? []) as ClassSchedule[])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, classId])

  const fmt = (n: number | null) => n != null ? `£${n.toFixed(2)}` : '—'

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (classNotFound) notFound()

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button variant="ghost" className="w-fit" onClick={() => router.push('/dashboard/classes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Classes
        </Button>
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  if (!cls) return null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.push('/dashboard/classes')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Classes
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{cls.name}</h1>
            <Badge variant={cls.is_active ? 'default' : 'secondary'} className="text-xs">
              {cls.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {cls.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{cls.description}</p>
          )}
        </div>
      </div>

      {/* Key details card */}
      <Card>
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                <Clock className="h-3 w-3" /> Duration
              </p>
              <p className="text-sm font-medium">{cls.duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                <Users className="h-3 w-3" /> Capacity
              </p>
              <p className="text-sm font-medium">{cls.max_capacity} people</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Price</p>
              <p className="text-sm font-medium">{fmt(cls.price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Level</p>
              <p className="text-sm font-medium capitalize">{cls.skill_level || 'All levels'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location Type</p>
              <p className="text-sm font-medium capitalize">{cls.location_type || 'In-person'}</p>
            </div>
            {cls.location && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                <p className="text-sm font-medium">{cls.location}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming schedules */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Upcoming Schedules</h2>
        {schedules.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming schedules"
            description="Schedule this class from the Schedule page to see sessions here."
          />
        ) : (
          <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium pl-4">Date</TableHead>
                    <TableHead className="text-xs font-medium">Time</TableHead>
                    <TableHead className="text-xs font-medium">Booked / Capacity</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => {
                    const statusVariant = (() => {
                      if (!s.status || s.status === 'scheduled') return 'secondary' as const
                      if (s.status === 'completed') return 'default' as const
                      if (s.status === 'cancelled') return 'destructive' as const
                      return 'outline' as const
                    })()
                    const booked = s.current_bookings ?? 0
                    const full = booked >= s.max_capacity
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell className="py-3 pl-4 text-sm font-medium">
                          {format(new Date(s.scheduled_date), 'EEE dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          <span className={full ? 'text-destructive font-medium' : ''}>
                            {booked} / {s.max_capacity}
                          </span>
                          {full && <Badge variant="destructive" className="text-xs ml-1.5">Full</Badge>}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={statusVariant} className="text-xs capitalize">
                            {s.status || 'scheduled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {cls && (
        <EditClassSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          cls={cls}
          onSaved={updated => setCls(updated)}
        />
      )}
    </div>
  )
}
