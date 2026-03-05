'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Plus, MoreHorizontal, Activity, LayoutTemplate } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workout {
  id: string
  title: string
  est_duration?: string | null
  weight_unit?: string | null
  created_at: string
  exercise_names?: string[]
  exercise_count?: number
  description?: string | null
}

// ─── Edit Metadata Sheet ──────────────────────────────────────────────────────

function WorkoutSheet({
  open, onOpenChange, editTarget, trainerId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: Workout | null
  trainerId: string
  onSaved: () => void
}) {
  const [form, setForm] = useState({ title: '', est_duration: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        title: editTarget?.title ?? '',
        est_duration: editTarget?.est_duration ?? '',
      })
      setError(null)
    }
  }, [open, editTarget])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        est_duration: form.est_duration.trim() || null,
      }
      if (editTarget) {
        // @ts-ignore
        const { error: err } = await supabase.from('workouts').update(payload).eq('id', editTarget.id)
        if (err) throw err
        toast.success('Workout updated')
      } else {
        // @ts-ignore
        const { error: err } = await supabase.from('workouts').insert({ ...payload, trainer_id: trainerId })
        if (err) throw err
        toast.success('Workout created')
      }
      onSaved(); onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Workout' : 'New Workout'}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Upper Body Push" />
          </div>
          <div className="grid gap-1.5">
            <Label>Est. Duration</Label>
            <Input value={form.est_duration} onChange={e => set('est_duration', e.target.value)} placeholder="e.g. 45 min" />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Workout Table Section ─────────────────────────────────────────────────────

function WorkoutSection({
  title, icon: Icon, workouts, loading, onOpen, onEdit, onDelete, onSort, sortConfig,
}: {
  title: string
  icon: React.ElementType
  workouts: Workout[]
  loading: boolean
  onOpen: (w: Workout) => void
  onEdit: (w: Workout) => void
  onDelete: (id: string) => void
  onSort: (key: keyof Workout) => void
  sortConfig: SortConfig<Workout> | null
}) {
  const iconColor = title === 'Templates'
    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'

  if (loading) return (
    <div className="flex flex-col gap-1">
      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-none" />)}
    </div>
  )

  if (!workouts.length) return null

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="pl-4 w-9">
              <div className="h-7 w-7 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="text-xs font-medium">
              <SortButton
                label="Title"
                direction={sortConfig?.key === 'title' ? sortConfig.direction : null}
                onClick={() => onSort('title')}
              />
            </TableHead>
            <TableHead className="text-xs font-medium text-right">Duration</TableHead>
            <TableHead className="text-xs font-medium text-right">
              <SortButton
                label="Created"
                direction={sortConfig?.key === 'created_at' ? sortConfig.direction : null}
                onClick={() => onSort('created_at')}
                className="ml-auto"
              />
            </TableHead>
            <TableHead className="w-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {workouts.map(w => (
            <TableRow
              key={w.id}
              className="hover:bg-muted/30 cursor-pointer"
              onClick={() => onOpen(w)}
            >
              <TableCell className="py-3 pl-4 w-9">
                <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${iconColor}`}>
                  <Activity className="h-3.5 w-3.5" />
                </div>
              </TableCell>
              <TableCell className="py-3">
                <p className="text-sm font-medium leading-none">{w.title}</p>
                {w.exercise_names && w.exercise_names.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                    {w.exercise_names.slice(0, 4).join(' · ')}{(w.exercise_count ?? 0) > 4 ? ` +${(w.exercise_count ?? 0) - 4} more` : ''}
                  </p>
                ) : w.description ? (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{w.description}</p>
                ) : null}
              </TableCell>
              <TableCell className="py-3 text-xs text-muted-foreground text-right">
                {w.est_duration || '—'}
              </TableCell>
              <TableCell className="py-3 text-xs text-muted-foreground pr-4 text-right">
                {format(new Date(w.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="py-3 pr-3 w-9" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpen(w)}>Open builder</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(w)}>Edit details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(w.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig<Workout> | null>({ key: 'title', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<Workout | null>(null)

  // ── Header ──
  useEffect(() => {
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search workouts…"
          className="pl-8 h-8 text-sm w-48 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [search, setHeaderSearch])

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card h-8" onClick={() => handleNew()} disabled={creating}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        {creating ? 'Creating…' : 'New Workout'}
      </Button>
    )
    return () => setActions(null)
  }, [setActions, creating])

  // ── Fetch ──
  const fetchWorkouts = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError(null)
    try {
      // Step 1: fetch workouts
      const { data: workoutData, error: err1 } = await supabase
        .from('workouts')
        .select('id, title, est_duration, weight_unit, created_at')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
      if (err1) {
        logger.error('Workouts query error', err1?.message, err1?.code, err1?.details)
        throw new Error(err1.message || 'Failed to fetch workouts')
      }

      const workoutIds = (workoutData || []).map((w: any) => w.id)

      // Step 2: fetch workout_exercise rows (no embedded join)
      const { data: weData, error: err2 } = workoutIds.length > 0
        ? await supabase
            .from('workout_exercises')
            .select('workout_id, position, exercise_id')
            .in('workout_id', workoutIds)
            .order('position', { ascending: true })
        : { data: [], error: null }
      if (err2) logger.warn('workout_exercises query error', err2?.message)

      // Step 3: fetch exercise names for the exercise IDs we found
      const exerciseIds = [...new Set((weData || []).map((we: any) => we.exercise_id).filter(Boolean))]
      const { data: exerciseData } = exerciseIds.length > 0
        ? await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds)
        : { data: [] }

      const exerciseMap: Record<string, string> = {}
      for (const ex of exerciseData || []) {
        exerciseMap[(ex as any).id] = (ex as any).name
      }

      // Group exercise names by workout_id
      const exercisesByWorkout: Record<string, { name: string; position: number }[]> = {}
      for (const we of weData || []) {
        const name = exerciseMap[(we as any).exercise_id]
        if (!name) continue
        if (!exercisesByWorkout[(we as any).workout_id]) exercisesByWorkout[(we as any).workout_id] = []
        exercisesByWorkout[(we as any).workout_id].push({ name, position: (we as any).position ?? 0 })
      }

      const mapped: Workout[] = (workoutData || []).map((w: any) => {
        const exs = (exercisesByWorkout[w.id] || []).sort((a, b) => a.position - b.position)
        return {
          id: w.id,
          title: w.title,
          est_duration: w.est_duration ?? null,
          weight_unit: w.weight_unit ?? null,
          created_at: w.created_at,
          exercise_names: exs.map(e => e.name),
          exercise_count: exs.length,
        }
      })
      setWorkouts(mapped)
    } catch (err) {
      logger.error('Error fetching workouts', err instanceof Error ? err.message : JSON.stringify(err))
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { fetchWorkouts() }, [fetchWorkouts])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('workouts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `trainer_id=eq.${user.id}`,
      }, () => { fetchWorkouts() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchWorkouts])

  // ── New Workout: create immediately then redirect to builder ──
  const handleNew = async () => {
    if (!user?.id || creating) return
    setCreating(true)
    try {
      // @ts-ignore
      const { data, error: err } = await supabase
        .from('workouts')
        // @ts-ignore
        .insert({ title: 'Untitled Workout', trainer_id: user.id })
        .select('id').single()
      if (err) throw err
      // @ts-ignore
      router.push(`/dashboard/workouts/${(data as any).id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('workouts').delete().eq('id', id)
      setWorkouts(prev => prev.filter(w => w.id !== id))
      toast.success('Deleted')
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleSort = (key: string) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const filtered = workouts.filter(w =>
    !search ||
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    (w.exercise_names ?? []).some(n => n.toLowerCase().includes(search.toLowerCase()))
  )
  const sorted = sortData(filtered, sortConfig)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = pageSize === Infinity ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize)

  const hasData = workouts.length > 0
  const showEmpty = !loading && !hasData

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : showEmpty ? (
        <EmptyState
          icon={Activity}
          title="No workouts yet"
          description="Create your first workout to build routines with exercises, sets, and reps."
          action={
            <Button variant="outline" onClick={() => handleNew()}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
              New Workout
            </Button>
          }
        />
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <WorkoutSection
              title="Workouts"
              icon={Activity}
              workouts={paginated}
              loading={false}
              onOpen={w => router.push(`/dashboard/workouts/${w.id}`)}
              onEdit={w => { setEditTarget(w); setShowSheet(true) }}
              onDelete={handleDelete}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{sorted.length} workouts</span>
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

      <WorkoutSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editTarget={editTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchWorkouts}
      />
    </div>
  )
}
