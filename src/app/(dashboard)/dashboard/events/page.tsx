'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Plus, MoreHorizontal, Clock, Users, CalendarDays, Megaphone } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface EventTemplate {
  id: string
  name: string
  description?: string
  duration_minutes: number
  is_multi_day: boolean
  total_days?: number
  location?: string
  location_type: string
  max_capacity: number
  price: number
  skill_level: string
  is_active: boolean
}

// ─────────────────────────────────────────────
// Event Sheet
// ─────────────────────────────────────────────
function EventSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: EventTemplate | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('60')
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [totalDays, setTotalDays] = useState('2')
  const [location, setLocation] = useState('')
  const [locationType, setLocationType] = useState('in-person')
  const [maxCapacity, setMaxCapacity] = useState('20')
  const [price, setPrice] = useState('0')
  const [skillLevel, setSkillLevel] = useState('all')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setDuration(String(editTarget.duration_minutes))
        setIsMultiDay(editTarget.is_multi_day)
        setTotalDays(String(editTarget.total_days ?? 2))
        setLocation(editTarget.location || '')
        setLocationType(editTarget.location_type || 'in-person')
        setMaxCapacity(String(editTarget.max_capacity))
        setPrice(String(editTarget.price))
        setSkillLevel(editTarget.skill_level || 'all')
        setIsActive(editTarget.is_active)
      } else {
        setName(''); setDescription(''); setDuration('60'); setIsMultiDay(false)
        setTotalDays('2'); setLocation(''); setLocationType('in-person')
        setMaxCapacity('20'); setPrice('0'); setSkillLevel('all'); setIsActive(true)
      }
      setFormError('')
    }
  }, [open, editTarget])

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        duration_minutes: parseInt(duration) || 60,
        is_multi_day: isMultiDay,
        total_days: isMultiDay ? (parseInt(totalDays) || 2) : null,
        location: location || null,
        location_type: locationType,
        max_capacity: parseInt(maxCapacity) || 20,
        price: parseFloat(price) || 0,
        skill_level: skillLevel,
        is_active: isActive,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('event_templates').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Event type updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('event_templates').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Event type created')
      }
      onOpenChange(false)
      onSaved()
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
          <SheetTitle>{editTarget ? 'Edit Event Type' : 'Add Event Type'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Bootcamp" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Multi-day event</Label>
            <Switch checked={isMultiDay} onCheckedChange={setIsMultiDay} />
          </div>
          {isMultiDay && (
            <div className="flex flex-col gap-1.5">
              <Label>Total days</Label>
              <Input type="number" value={totalDays} onChange={e => setTotalDays(e.target.value)} min={2} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. City Park" />
          </div>
          <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} min={1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Price (£)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min={0} step={0.01} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
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
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function EventsPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [events, setEvents] = useState<EventTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<EventTemplate | null>(null)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig<EventTemplate> | null>({ key: 'name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Add Event Type
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search event types…"
          className="pl-8 h-8 text-sm w-52 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [search, setHeaderSearch])

  const fetchEvents = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('event_templates')
        .select('id, name, description, duration_minutes, is_multi_day, total_days, location, location_type, max_capacity, price, skill_level, is_active')
        .eq('trainer_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      setEvents(data as EventTemplate[])
    } catch (err) {
      logger.error('Error fetching events:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('event-templates-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_templates',
        filter: `trainer_id=eq.${user.id}`,
      }, () => { fetchEvents() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('event_templates').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setEvents(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast.success('Event type deleted')
      setDeleteTarget(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const fmt = (n: number) => `£${n.toFixed(2)}`

  const handleSort = (key: keyof EventTemplate) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key as string, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const filtered = events.filter(evt => {
    if (!search) return true
    const q = search.toLowerCase()
    return evt.name.toLowerCase().includes(q) || (evt.location || '').toLowerCase().includes(q) || (evt.description || '').toLowerCase().includes(q)
  })
  const sorted = sortData(filtered, sortConfig)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = pageSize === Infinity ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No event types yet"
          description="Create event types — workshops, bootcamps, or one-off sessions clients can register for."
          action={
            <Button variant="outline" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Event Type
            </Button>
          }
        />
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4 w-9">
                  <div className="h-7 w-7 flex items-center justify-center">
                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Event"
                    direction={sortConfig?.key === 'name' ? sortConfig.direction : null}
                    onClick={() => handleSort('name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Location</TableHead>
                <TableHead className="text-xs font-medium">Location Type</TableHead>
                <TableHead className="text-xs font-medium">Duration</TableHead>
                <TableHead className="text-xs font-medium">Capacity</TableHead>
                <TableHead className="text-xs font-medium">Price</TableHead>
                <TableHead className="text-xs font-medium">Level</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((evt) => (
                <TableRow key={evt.id} className="hover:bg-muted/30">
                  <TableCell className="py-3 pl-4 w-9">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-purple-100 dark:bg-purple-500/20">
                      <Megaphone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium">{evt.name}</p>
                    {evt.is_multi_day && (
                      <Badge variant="outline" className="bg-card text-xs mt-0.5">{evt.total_days} days</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{evt.location || '—'}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs capitalize">{evt.location_type || 'in-person'}</Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /><span>{evt.duration_minutes}min</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /><span>{evt.max_capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm">{fmt(evt.price)}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="bg-card text-xs capitalize">{evt.skill_level}</Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={evt.is_active ? 'default' : 'secondary'} className="text-xs">
                      {evt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(evt); setShowSheet(true) }}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget({ id: evt.id, name: evt.name })}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{sorted.length} event types</span>
          <div className="flex items-center gap-2">
            <Select value={pageSize === Infinity ? 'all' : String(pageSize)} onValueChange={v => { setPageSize(v === 'all' ? Infinity : Number(v)); setPage(1) }}>
              <SelectTrigger className="h-7 w-20 text-xs bg-card"><SelectValue>{pageSize === Infinity ? 'All' : String(pageSize)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-card" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" className="bg-card" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <EventSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editTarget={editTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchEvents}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.name ?? ''}
        itemKind="event type"
        cascadeWarning="Any scheduled events using this type will also be removed."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
