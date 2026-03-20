'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Plus, Settings, MoreHorizontal, Copy, Trash2, Moon, ChevronDown, Dumbbell, ClipboardPaste } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Program {
  id: string
  title: string
  subtitle?: string | null
  duration_weeks: number
  training_days_per_week: number
  program_type?: string | null
}

interface Slot {
  workoutId: string | null
  workoutTitle: string | null
  isRest: boolean
}

type SlotKey = string // `${week}-${day}`

interface DayCellProps {
  slot: Slot | undefined
  week: number
  day: number
  workouts: { id: string; title: string }[]
  onAssign: (week: number, day: number, workoutId: string, workoutTitle: string) => Promise<void>
  onRest: (week: number, day: number) => Promise<void>
  onClear: (week: number, day: number) => Promise<void>
  onCopy: (week: number, day: number) => void
  onPaste: (week: number, day: number) => Promise<void>
  copiedSlot: { week: number; day: number } | null
  router: ReturnType<typeof useRouter>
  programId: string
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({ slot, week, day, workouts, onAssign, onRest, onClear, onCopy, onPaste, copiedSlot, router, programId }: DayCellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const isSource = copiedSlot?.week === week && copiedSlot?.day === day
  const hasCopied = copiedSlot !== null && !isSource
  const isEmpty = !slot
  const isRest = slot?.isRest ?? false
  const hasWorkout = !!slot?.workoutId && !isRest

  const WorkoutPicker = (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        <button className="absolute inset-0 w-full h-full pointer-events-none opacity-0" aria-hidden tabIndex={-1} />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search workouts…" className="h-8" />
          <CommandList className="max-h-56">
            <CommandEmpty>No workouts found</CommandEmpty>
            <CommandGroup>
              {workouts.map(w => (
                <CommandItem key={w.id} value={w.title} onSelect={async () => { await onAssign(week, day, w.id, w.title); setPickerOpen(false) }}>
                  <Dumbbell className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{w.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Options">
              <CommandItem value="__rest" onSelect={async () => { await onRest(week, day); setPickerOpen(false) }}>
                <Moon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-sm">Rest / Recovery</span>
              </CommandItem>
              {slot && (
                <CommandItem value="__clear" className="text-destructive data-[selected=true]:text-destructive" onSelect={async () => { await onClear(week, day); setPickerOpen(false) }}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">Clear slot</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className={cn('relative group/cell border-r border-b border-border p-1.5 min-h-[44px] flex items-center', isSource && 'bg-primary/5')}>
      {WorkoutPicker}

      {/* ── Empty cell ── */}
      {isEmpty && (
        <div className="w-full h-full flex items-center justify-center">
          {hasCopied ? (
            <button
              onClick={async e => { e.stopPropagation(); await onPaste(week, day) }}
              className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-colors text-[11px] font-medium"
              title="Paste"
            >
              <ClipboardPaste className="h-3 w-3" />
              Paste
            </button>
          ) : (
            <button
              onClick={() => setPickerOpen(true)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover/cell:opacity-100"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Rest chip ── */}
      {isRest && (
        <div className="flex items-center gap-1.5 w-full">
          <span className="flex-1 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-[11px] font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => setPickerOpen(true)}>
            <Moon className="h-3 w-3 shrink-0" />
            Rest
          </span>
          <button onClick={async e => { e.stopPropagation(); await onClear(week, day) }} className="h-5 w-5 shrink-0 flex items-center justify-center rounded hover:bg-muted text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── Workout chip ── */}
      {hasWorkout && (
        <div className="flex items-center gap-1 w-full min-w-0">
          <button
            className={cn('flex-1 min-w-0 px-2 py-1 rounded-md text-[11px] font-semibold text-left truncate transition-colors',
              isSource ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary hover:bg-primary/25'
            )}
            onClick={() => router.push(`/dashboard/workouts/${slot!.workoutId}?returnTo=/dashboard/programs/${programId}`)}
            title={slot!.workoutTitle ?? ''}
          >
            {slot!.workoutTitle}
          </button>
          {/* Copy icon — always visible */}
          <button
            onClick={e => { e.stopPropagation(); onCopy(week, day); toast.success('Copied — click a cell to paste') }}
            className="shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
          {/* Change / remove menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setPickerOpen(true) }}>Change workout</DropdownMenuItem>
              <DropdownMenuItem onClick={async e => { e.stopPropagation(); await onRest(week, day) }}>Mark as rest</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async e => { e.stopPropagation(); await onClear(week, day) }}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.programId as string
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [program, setProgram] = useState<Program | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [weeksCount, setWeeksCount] = useState(4)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<Record<SlotKey, Slot>>({})
  const [allWorkouts, setAllWorkouts] = useState<{ id: string; title: string }[]>([])
  const [copiedSlot, setCopiedSlot] = useState<{ week: number; day: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ weeks: '4', days: '3', type: 'strength', showAllWorkouts: false })
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Fetch ──
  useEffect(() => {
    if (!programId || !user?.id) return
    setLoading(true)
    ;(async () => {
      try {
        // Step 1: program + program_workouts + all trainer workouts in parallel
        const [pRes, wiRes, restRes, wRes] = await Promise.all([
          supabase
            .from('programs')
            .select('id, title, subtitle, duration_weeks, training_days_per_week, program_type, show_all_workouts')
            .eq('id', programId)
            .eq('trainer_id', user.id)
            .maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('program_workouts')
            .select('week_number, day_number, workout_id, workouts(id, title)')
            .eq('program_id', programId)
            .not('workout_id', 'is', null)
            .order('week_number')
            .order('day_number'),
          supabase
            .from('program_workouts')
            .select('week_number, day_number')
            .eq('program_id', programId)
            .is('workout_id', null)
            .order('week_number')
            .order('day_number'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('workouts').select('id, title').eq('trainer_id', user.id).neq('is_template', false).order('title'),
        ])

        if (!pRes.data) { setLoading(false); return }
        const p = pRes.data as Program
        setProgram(p)
        setTitle(p.title ?? '')
        setSubtitle(p.subtitle ?? '')
        setWeeksCount(p.duration_weeks ?? 4)
        setDaysPerWeek(p.training_days_per_week ?? 3)
        setSettingsForm({
          weeks: String(p.duration_weeks ?? 4),
          days: String(p.training_days_per_week ?? 3),
          type: p.program_type ?? 'strength',
          showAllWorkouts: (p as unknown as Record<string, unknown>).show_all_workouts === true,
        })

        const slotMap: Record<SlotKey, Slot> = {}
        // Workouts from program_workouts joined to workouts table
        type PWWorkoutRow = { week_number: number; day_number: number; workout_id: string; workouts: { id: string; title: string } | null }
        type PWRow = { week_number: number; day_number: number }
        for (const pw of (wiRes.data as unknown as PWWorkoutRow[]) || []) {
          slotMap[`${pw.week_number}-${pw.day_number}`] = {
            workoutId: pw.workout_id,
            workoutTitle: pw.workouts?.title ?? null,
            isRest: false,
          }
        }
        // Rest day slots stored in program_workouts with workout_id = null
        for (const r of (restRes.data as unknown as PWRow[]) || []) {
          slotMap[`${r.week_number}-${r.day_number}`] = { workoutId: null, workoutTitle: null, isRest: true }
        }
        setSlots(slotMap)
        setAllWorkouts((wRes.data || []) as { id: string; title: string }[])
      } catch (err) {
        logger.error('Program load error', err instanceof Error ? err.message : err)
      } finally {
        setLoading(false)
      }
    })()
  }, [programId, user?.id, router])

  // ── Header actions ──
  useEffect(() => {
    if (!program && !loading) return
    setActions(
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs transition-opacity duration-200',
          saveStatus === 'idle' ? 'opacity-0' : 'opacity-100',
          saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" className="bg-card h-8" onClick={() => router.push('/dashboard/programs')}>Done</Button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, saveStatus, router])

  useEffect(() => {
    if (loading) return
    setHeaderSearch(
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex flex-col min-w-0 flex-1">
          <input
            className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground leading-tight"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Program title…"
          />
          <input
            className="text-xs text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground/60 leading-tight"
            value={subtitle}
            onChange={e => handleSubtitleChange(e.target.value)}
            placeholder="Client name…"
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {program?.program_type && (
            <Badge variant="outline" className="bg-card text-xs capitalize hidden md:flex">
              {program.program_type.replace(/_/g, ' ')}
            </Badge>
          )}
          <Badge variant="outline" className="bg-card text-xs shrink-0">{weeksCount}wk · {daysPerWeek}d/wk</Badge>
        </div>
      </div>
    )
    return () => setHeaderSearch(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderSearch, loading, title, subtitle, program, weeksCount, daysPerWeek])

  useEffect(() => () => clearTimeout(titleSaveTimer.current), [])

  // ── Title auto-save ──
  const handleTitleChange = (val: string) => {
    setTitle(val)
    clearTimeout(titleSaveTimer.current)
    titleSaveTimer.current = setTimeout(async () => {
      if (!programId) return
      setSaveStatus('saving')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('programs').update({ title: val.trim() || 'Untitled' }).eq('id', programId)
      setSaveStatus(error ? 'error' : 'saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }

  // ── Subtitle auto-save ──
  const subtitleSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleSubtitleChange = (val: string) => {
    setSubtitle(val)
    clearTimeout(subtitleSaveTimer.current)
    subtitleSaveTimer.current = setTimeout(async () => {
      if (!programId) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('programs').update({ subtitle: val.trim() || null }).eq('id', programId)
    }, 1000)
  }

  // ── Slot mutations ──
  // Copy a workout (template or instance) into a new instance row for this program
  const copyWorkoutAsInstance = useCallback(async (sourceWorkoutId: string): Promise<string | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    // Fetch source workout
    const { data: src } = await db.from('workouts').select('title, weight_unit, workout_type, trainer_id').eq('id', sourceWorkoutId).single()
    if (!src) return null
    // Create new instance workout
    const { data: newWorkout } = await db.from('workouts').insert({
      title: src.title, weight_unit: src.weight_unit, workout_type: src.workout_type,
      trainer_id: src.trainer_id, is_template: false, template_id: sourceWorkoutId,
    }).select('id').single()
    if (!newWorkout?.id) return null
    // Copy exercises
    const { data: exercises } = await db.from('workout_exercises')
      .select('exercise_id,set_count,reps,rest_seconds,notes,time,distance,calories,weight,superset_id,position,is_dropset,dropset_weights,dropset_application,dropset_reps,dropset_notes,dropset_time,dropset_distance,dropset_calories,hidden_fields,measurement_type,show_reps,show_weight,show_time,show_distance')
      .eq('workout_id', sourceWorkoutId)
    if (exercises?.length) {
      await db.from('workout_exercises').insert(exercises.map((ex: Record<string, unknown>) => ({ ...ex, workout_id: newWorkout.id })))
    }
    return newWorkout.id
  }, [])

  const setSlotAndSave = useCallback(async (week: number, day: number, slot: Slot | null) => {
    const key = `${week}-${day}`
    // Optimistic update
    if (slot) {
      setSlots(prev => ({ ...prev, [key]: slot }))
    } else {
      setSlots(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    // Clear this slot from program_workouts
    await supabase.from('program_workouts').delete().eq('program_id', programId).eq('week_number', week).eq('day_number', day)
    if (slot) {
      let workoutId = slot.isRest ? null : slot.workoutId
      if (workoutId) {
        // Check if this workout is a template — if so, copy it first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: wo } = await (supabase as any).from('workouts').select('is_template').eq('id', workoutId).single()
        if (wo?.is_template !== false) {
          // It's a template (or unknown) — create an instance
          const instanceId = await copyWorkoutAsInstance(workoutId)
          if (instanceId) workoutId = instanceId
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('program_workouts').insert({
        program_id: programId, week_number: week, day_number: day, workout_id: workoutId,
      })
      if (error) toast.error('Failed to save')
      // Update slot with the actual workout ID (instance)
      if (workoutId && workoutId !== slot.workoutId) {
        setSlots(prev => ({ ...prev, [key]: { ...slot, workoutId } }))
      }
    }
  }, [programId, copyWorkoutAsInstance])

  const assignWorkout = useCallback(async (week: number, day: number, workoutId: string, workoutTitle: string) => {
    await setSlotAndSave(week, day, { workoutId, workoutTitle, isRest: false })
  }, [setSlotAndSave])

  const markRest = useCallback(async (week: number, day: number) => {
    await setSlotAndSave(week, day, { workoutId: null, workoutTitle: null, isRest: true })
  }, [setSlotAndSave])

  const clearSlot = useCallback(async (week: number, day: number) => {
    await setSlotAndSave(week, day, null)
  }, [setSlotAndSave])

  const pasteSlot = useCallback(async (week: number, day: number) => {
    if (!copiedSlot) return
    const src = slots[`${copiedSlot.week}-${copiedSlot.day}`]
    if (!src) return
    await setSlotAndSave(week, day, { ...src })
  }, [copiedSlot, slots, setSlotAndSave])

  const copyWeekToNext = useCallback(async (fromWeek: number) => {
    const toWeek = fromWeek + 1
    const fromEntries = Object.entries(slots).filter(([k]) => k.startsWith(`${fromWeek}-`))
    if (!fromEntries.length) { toast.info('No sessions to copy'); return }
    // Delete target week from both tables
    await Promise.all([
      supabase.from('workout_instances').delete().eq('program_id', programId).eq('week_number', toWeek),
      supabase.from('program_workouts').delete().eq('program_id', programId).eq('week_number', toWeek),
    ])
    // Optimistic
    setSlots(prev => {
      const n = { ...prev }
      Object.keys(n).filter(k => k.startsWith(`${toWeek}-`)).forEach(k => delete n[k])
      fromEntries.forEach(([k, s]) => { n[`${toWeek}-${parseInt(k.split('-')[1], 10)}`] = { ...s } })
      return n
    })
    // Copy each slot — create new instances for workout slots
    const allInserts: Array<Record<string, unknown>> = []
    for (const [k, s] of fromEntries) {
      const day = parseInt(k.split('-')[1], 10)
      let workoutId = s.isRest ? null : s.workoutId
      if (workoutId) {
        // Always create a fresh instance so weeks can diverge independently
        const instanceId = await copyWorkoutAsInstance(workoutId)
        if (instanceId) workoutId = instanceId
      }
      allInserts.push({ program_id: programId, week_number: toWeek, day_number: day, workout_id: workoutId })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('program_workouts').insert(allInserts)
    if (error) toast.error('Copy failed')
    else toast.success(`Week ${fromWeek} → Week ${toWeek}`)
  }, [programId, slots, copyWorkoutAsInstance])

  // ── Settings ──
  const saveSettings = useCallback(async () => {
    const weeks = parseInt(settingsForm.weeks, 10) || 4
    const days = parseInt(settingsForm.days, 10) || 3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db.from('programs').update({
      duration_weeks: weeks, training_days_per_week: days, program_type: settingsForm.type, show_all_workouts: settingsForm.showAllWorkouts,
    }).eq('id', programId)
    if (error) { toast.error('Failed to save settings'); return }

    // Clean up slots outside the new bounds
    if (weeks < weeksCount) {
      await db.from('program_workouts').delete().eq('program_id', programId).gt('week_number', weeks)
    }
    if (days < daysPerWeek) {
      await db.from('program_workouts').delete().eq('program_id', programId).gt('day_number', days)
    }

    // Update local slot state to match
    setSlots(prev => {
      const n: Record<string, Slot> = {}
      for (const [k, v] of Object.entries(prev)) {
        const [w, d] = k.split('-').map(Number)
        if (w <= weeks && d <= days) n[k] = v
      }
      return n
    })

    setWeeksCount(weeks)
    setDaysPerWeek(days)
    setProgram(prev => prev ? { ...prev, duration_weeks: weeks, training_days_per_week: days, program_type: settingsForm.type } : prev)
    setSettingsOpen(false)
    toast.success('Settings saved')
  }, [settingsForm, programId, weeksCount, daysPerWeek])

  // ── Not found ──
  if (!loading && !program) notFound()

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-20 ml-auto" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="overflow-x-auto">
          <div style={{ display: 'grid', gridTemplateColumns: `72px repeat(3, minmax(140px, 1fr))`, minWidth: '492px' }}>
            <div className="h-9 border-r border-b border-border bg-muted/30" />
            {[1,2,3].map(i => (
              <div key={i} className="h-9 border-r border-b border-border bg-muted/30 flex items-center justify-center">
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
            {[1,2,3,4].map(w => (
              <React.Fragment key={w}>
                <div className="border-r border-b border-border bg-muted/20 min-h-[90px] flex items-center justify-center">
                  <Skeleton className="h-4 w-8" />
                </div>
                {[1,2,3].map(d => (
                  <div key={d} className="border-r border-b border-border min-h-[90px] p-2.5">
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="flex flex-col">

      {/* Copied slot indicator */}
      {copiedSlot && (
        <div className="px-4 py-1.5 border-b border-border bg-primary/5 flex items-center justify-between">
          <span className="text-xs text-primary">Wk{copiedSlot.week} D{copiedSlot.day} copied — click an empty cell to paste</span>
          <button className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2" onClick={() => setCopiedSlot(null)}>Clear</button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="p-4">
      <Card data-table-card className="py-0 overflow-hidden" style={{ borderRadius: 'var(--table-radius)' }}>
      <CardContent className="p-0">
      <div className="overflow-x-auto">
        <div style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(${daysPerWeek}, minmax(100px, 160px)) 36px`,
          width: 'fit-content',
          maxWidth: '100%',
        }}>

          {/* Header row */}
          <div className="h-8 border-r border-b border-border bg-muted/30" />
          {Array.from({ length: daysPerWeek }, (_, i) => (
            <div key={i} className="h-8 flex items-center justify-center border-r border-b border-border bg-muted/30">
              <span className="text-[11px] font-medium text-muted-foreground">Day {i + 1}</span>
            </div>
          ))}
          <div className="h-8 border-b border-border bg-muted/30" />

          {/* Week rows */}
          {Array.from({ length: weeksCount }, (_, weekIdx) => {
            const week = weekIdx + 1
            const weekEntries = Object.entries(slots).filter(([k]) => k.startsWith(`${week}-`))
            const workoutCount = weekEntries.filter(([, s]) => s.workoutId && !s.isRest).length
            const restCount = weekEntries.filter(([, s]) => s.isRest).length

            return (
              <React.Fragment key={week}>
                {/* Week label */}
                <div className="flex flex-col items-center justify-center border-r border-b border-border bg-muted/20 min-h-[44px] gap-1 px-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">W{week}</span>
                </div>

                {/* Day cells */}
                {Array.from({ length: daysPerWeek }, (_, dayIdx) => {
                  const day = dayIdx + 1
                  return (
                    <DayCell
                      key={`${week}-${day}`}
                      slot={slots[`${week}-${day}`]}
                      week={week}
                      day={day}
                      workouts={allWorkouts}
                      onAssign={assignWorkout}
                      onRest={markRest}
                      onClear={clearSlot}
                      onCopy={(w, d) => setCopiedSlot({ week: w, day: d })}
                      onPaste={pasteSlot}
                      copiedSlot={copiedSlot}
                      router={router}
                      programId={programId}
                    />
                  )
                })}

                {/* Duplicate week button */}
                <div className="border-b border-border flex items-center justify-center min-h-[44px]">
                  {week < weeksCount && (
                    <button
                      onClick={() => copyWeekToNext(week)}
                      title={`Duplicate week ${week} → week ${week + 1}`}
                      className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>
      </CardContent>
      </Card>
      </div>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Program Settings</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Weeks</Label>
                <Select value={settingsForm.weeks} onValueChange={v => setSettingsForm(f => ({ ...f, weeks: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,6,8,10,12,16,20,24].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'week' : 'weeks'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sessions / week</Label>
                <Select value={settingsForm.days} onValueChange={v => setSettingsForm(f => ({ ...f, days: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'session' : 'sessions'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              <Label>Type</Label>
              <Select value={settingsForm.type} onValueChange={v => setSettingsForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['strength','cardio','hiit','flexibility','weight_loss','muscle_gain','sport_specific','general_fitness'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 mt-1">
              <div>
                <p className="text-sm font-medium">Show all workouts</p>
                <p className="text-xs text-muted-foreground">Client app shows every workout, not just the current week. Assigned week is highlighted in green.</p>
              </div>
              <Switch
                checked={settingsForm.showAllWorkouts}
                onCheckedChange={v => setSettingsForm(f => ({ ...f, showAllWorkouts: v }))}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveSettings}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
