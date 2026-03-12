'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Plus, MoreHorizontal, BookOpen } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Program {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  duration_weeks?: number | null
  training_days_per_week?: number | null
  program_type: string
  is_favorite: boolean
  client_id?: string | null
  created_at: string
}

// ─────────────────────────────────────────────
// Program Sheet (unchanged)
// ─────────────────────────────────────────────
function ProgramSheet({
  open, onOpenChange, editTarget, trainerId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: Program | null
  trainerId: string
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationWeeks, setDurationWeeks] = useState('')
  const [trainingDays, setTrainingDays] = useState('')
  const [programType, setProgramType] = useState('strength')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setTitle(editTarget.title)
        setSubtitle(editTarget.subtitle || '')
        setDescription(editTarget.description || '')
        setDurationWeeks(editTarget.duration_weeks ? String(editTarget.duration_weeks) : '')
        setTrainingDays(editTarget.training_days_per_week ? String(editTarget.training_days_per_week) : '')
        setProgramType(editTarget.program_type || 'strength')
      } else {
        setTitle(''); setSubtitle(''); setDescription('')
        setDurationWeeks(''); setTrainingDays(''); setProgramType('strength')
      }
      setFormError('')
    }
  }, [open, editTarget])

  const handleSave = async () => {
    if (!title.trim()) { setFormError('Title is required'); return }
    setSaving(true); setFormError('')
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle || null,
        description: description || null,
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        training_days_per_week: trainingDays ? parseInt(trainingDays) : null,
        program_type: programType,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('programs').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Program updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('programs').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Program created')
      }
      onOpenChange(false); onSaved()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Program' : 'New Program'}</SheetTitle>
          <SheetDescription>Fill in the program details below.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 12-Week Strength Builder" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Short tagline" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this program is about…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Duration (weeks)</Label>
              <Input type="number" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} min={1} placeholder="e.g. 12" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Days per week</Label>
              <Input type="number" value={trainingDays} onChange={e => setTrainingDays(e.target.value)} min={1} max={7} placeholder="e.g. 3" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Program Type</Label>
            <Select value={programType} onValueChange={setProgramType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="flexibility">Flexibility</SelectItem>
                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="sport_specific">Sport Specific</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
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

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ProgramsPage() {
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('25')
  const [sortConfig, setSortConfig] = useState<SortConfig<Program> | null>({ key: 'title', direction: 'asc' })

  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<Program | null>(null)

  // ── Header search ──
  useEffect(() => {
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search programs…"
          className="pl-8 h-8 text-sm w-48 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [search, setHeaderSearch])

  // ── Header action ──
  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />New Program
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  // ── Fetch ──
  const fetchPrograms = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('programs')
        .select('id, title, subtitle, description, duration_weeks, training_days_per_week, program_type, is_favorite, client_id, created_at')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
      if (err) throw err
      setPrograms(data || [])
    } catch (err) {
      logger.error('Error fetching programs:', err)
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchPrograms() }, [fetchPrograms])


  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('programs').delete().eq('id', id)
      if (error) throw error
      setPrograms(prev => prev.filter(p => p.id !== id))
      toast.success('Program deleted')
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleSort = (key: string) => {
    const dir = toggleSortDirection(sortConfig?.key ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(dir ? { key, direction: dir } : null)
    setPage(1)
  }

  const filtered = programs.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.subtitle?.toLowerCase().includes(search.toLowerCase())
  )
  const sorted = sortData(filtered, sortConfig)
  const numericSize = pageSize === 'all' ? Infinity : Number(pageSize)
  const totalPages = numericSize === Infinity ? 1 : Math.ceil(sorted.length / numericSize)
  const paginated = numericSize === Infinity ? sorted : sorted.slice((page - 1) * numericSize, page * numericSize)

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No programs yet"
          description="Create training programs to assign to clients and track their progress."
          action={
            <Button variant="outline" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />New Program
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
          No programs match your search
        </div>
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4 w-9">
                    <div className="h-7 w-7 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <SortButton
                      label="Program"
                      direction={sortConfig?.key === 'title' ? sortConfig.direction : null}
                      onClick={() => handleSort('title')}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium w-24">Duration</TableHead>
                  <TableHead className="text-xs font-medium w-24">Days/wk</TableHead>
                  <TableHead className="text-xs font-medium w-32">
                    <SortButton
                      label="Created"
                      direction={sortConfig?.key === 'created_at' ? sortConfig.direction : null}
                      onClick={() => handleSort('created_at')}
                    />
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(prog => {
                  const meta = prog.program_type
                    ? prog.program_type.replace(/_/g, ' ')
                    : null
                  return (
                    <TableRow
                      key={prog.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/dashboard/programs/${prog.id}`)}
                    >
                      <TableCell className="py-3 pl-4 w-9">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm font-medium leading-none">{prog.title}</p>
                        {(prog.subtitle || meta) && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                            {prog.subtitle || meta}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {prog.duration_weeks ? `${prog.duration_weeks}w` : '—'}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {prog.training_days_per_week ? `${prog.training_days_per_week}x` : '—'}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {format(new Date(prog.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="py-3 pr-3 w-9" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/programs/${prog.id}`)}>
                              Open builder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditTarget(prog); setShowSheet(true) }}>
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(prog.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{filtered.length} programs</span>
          <div className="flex items-center gap-2">
            <Select value={pageSize} onValueChange={v => { setPageSize(v); setPage(1) }}>
              <SelectTrigger className="h-7 w-20 text-xs bg-card"><SelectValue /></SelectTrigger>
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

      <ProgramSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editTarget={editTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchPrograms}
      />
    </div>
  )
}
