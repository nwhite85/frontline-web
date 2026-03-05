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
import { Checkbox } from '@/components/ui/checkbox'
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
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Search, Plus, MoreHorizontal, Clock, Users, Trophy, Star, Flame, Zap, Rocket,
  Timer, Dumbbell, RefreshCw, Flag, Bike, Trash2,
} from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface ResultField {
  name: string
  type: 'number' | 'time' | 'text'
  unit?: string
  isPrimary?: boolean
}

interface Challenge {
  id: string
  name: string
  description?: string
  instructions?: string
  icon?: string
  location?: string
  result_fields: ResultField[]
  duration_minutes: number
  max_capacity: number
  expiration_days: number
  is_active: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  star: Star, flame: Flame, trophy: Trophy, flash: Zap, rocket: Rocket,
  timer: Timer, barbell: Dumbbell, sync: RefreshCw, flag: Flag, bicycle: Bike,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

function ChallengeIcon({ name }: { name?: string }) {
  const Icon = (name && ICON_MAP[name]) ? ICON_MAP[name] : Trophy
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─────────────────────────────────────────────
// Challenge Sheet
// ─────────────────────────────────────────────
function ChallengeSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: Challenge | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [icon, setIcon] = useState('trophy')
  const [duration, setDuration] = useState('30')
  const [maxCapacity, setMaxCapacity] = useState('20')
  const [expirationDays, setExpirationDays] = useState('30')
  const [location, setLocation] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [resultFields, setResultFields] = useState<ResultField[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setInstructions(editTarget.instructions || '')
        setIcon(editTarget.icon || 'trophy')
        setDuration(String(editTarget.duration_minutes))
        setMaxCapacity(String(editTarget.max_capacity))
        setExpirationDays(String(editTarget.expiration_days))
        setLocation(editTarget.location || '')
        setIsActive(editTarget.is_active)
        setResultFields(editTarget.result_fields || [])
      } else {
        setName(''); setDescription(''); setInstructions(''); setIcon('trophy')
        setDuration('30'); setMaxCapacity('20'); setExpirationDays('30')
        setLocation(''); setIsActive(true); setResultFields([])
      }
      setFormError('')
    }
  }, [open, editTarget])

  const addResultField = () => {
    setResultFields(prev => [...prev, { name: '', type: 'number', unit: '', isPrimary: false }])
  }

  const updateResultField = (index: number, updates: Partial<ResultField>) => {
    setResultFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  const removeResultField = (index: number) => {
    setResultFields(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        instructions: instructions || null,
        icon,
        duration_minutes: parseInt(duration) || 30,
        max_capacity: parseInt(maxCapacity) || 20,
        expiration_days: parseInt(expirationDays) || 30,
        location: location || null,
        is_active: isActive,
        result_fields: resultFields,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('challenges').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Challenge updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('challenges').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Challenge created')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const PreviewIcon = ICON_MAP[icon] || Trophy

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Challenge' : 'Add Challenge'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 30-Day Push-up Challenge" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Instructions</Label>
            <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="What clients need to do…" rows={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted border border-input shrink-0">
                <PreviewIcon className="h-4 w-4" />
              </div>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = ICON_MAP[opt]
                    return (
                      <SelectItem key={opt} value={opt}>
                        <div className="flex items-center gap-2 capitalize">
                          <IconComp className="h-3.5 w-3.5" />
                          {opt}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} min={1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Expires (days)</Label>
              <Input type="number" value={expirationDays} onChange={e => setExpirationDays(e.target.value)} min={1} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Gym / Anywhere" />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Separator />

          {/* Result Fields */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Result Fields</Label>
              <Button type="button" variant="outline" onClick={addResultField}>
                <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add field
              </Button>
            </div>
            {resultFields.length === 0 && (
              <p className="text-xs text-muted-foreground">No result fields yet. Add fields clients will fill in when logging results.</p>
            )}
            {resultFields.map((field, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-md border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Input
                    value={field.name}
                    onChange={e => updateResultField(index, { name: e.target.value })}
                    placeholder="Field name (e.g. Reps)"
                    className="flex-1 text-sm h-8"
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => removeResultField(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={field.type} onValueChange={(v) => updateResultField(index, { type: v as ResultField['type'] })}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={field.unit || ''}
                    onChange={e => updateResultField(index, { unit: e.target.value })}
                    placeholder="Unit (e.g. kg)"
                    className="flex-1 text-xs h-8"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Checkbox
                      id={`primary-${index}`}
                      checked={field.isPrimary || false}
                      onCheckedChange={v => updateResultField(index, { isPrimary: !!v })}
                      className="h-3.5 w-3.5"
                    />
                    <label htmlFor={`primary-${index}`} className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">Primary</label>
                  </div>
                </div>
              </div>
            ))}
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
export default function ChallengesPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<Challenge | null>(null)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig<Challenge> | null>({ key: 'name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Add Challenge
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search challenges…"
          className="pl-8 h-8 text-sm w-52 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [search, setHeaderSearch])

  const fetchChallenges = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, name, description, instructions, icon, location, result_fields, duration_minutes, max_capacity, expiration_days, is_active')
        .eq('trainer_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      setChallenges(data as Challenge[])
    } catch (err) {
      logger.error('Error fetching challenges:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [user])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('challenges-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `trainer_id=eq.${user.id}`,
      }, () => { fetchChallenges() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setChallenges(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast.success('Challenge deleted')
      setDeleteTarget(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const handleSort = (key: keyof Challenge) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key as string, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const filtered = challenges.filter(ch => {
    if (!search) return true
    const q = search.toLowerCase()
    return ch.name.toLowerCase().includes(q) || (ch.location || '').toLowerCase().includes(q) || (ch.description || '').toLowerCase().includes(q)
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
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No challenges yet"
          description="Create challenges for clients to complete and log results against."
          action={
            <Button variant="outline" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Challenge
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
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Challenge"
                    direction={sortConfig?.key === 'name' ? sortConfig.direction : null}
                    onClick={() => handleSort('name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Duration</TableHead>
                <TableHead className="text-xs font-medium">Capacity</TableHead>
                <TableHead className="text-xs font-medium">Expires</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((ch) => (
                <TableRow key={ch.id} className="hover:bg-muted/30">
                  <TableCell className="py-3 pl-4 w-9">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-500/20">
                      <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium">{ch.name}</p>
                    {ch.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{ch.location}</p>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /><span>{ch.duration_minutes}min</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /><span>{ch.max_capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {ch.expiration_days ? `${ch.expiration_days}d` : '—'}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={ch.is_active ? 'default' : 'secondary'} className="text-xs">
                      {ch.is_active ? 'Active' : 'Inactive'}
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
                        <DropdownMenuItem onClick={() => { setEditTarget(ch); setShowSheet(true) }}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget({ id: ch.id, name: ch.name })}>Delete</DropdownMenuItem>
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
          <span>{sorted.length} challenges</span>
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

      <ChallengeSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editTarget={editTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchChallenges}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.name ?? ''}
        itemKind="challenge"
        cascadeWarning="Any client progress and results logged against this challenge will also be deleted."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
