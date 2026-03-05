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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Plus, Settings, MoreHorizontal, Copy, Trash2, Moon, ChevronDown, Dumbbell } from 'lucide-react'
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
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({ slot, week, day, workouts, onAssign, onRest, onClear, onCopy, onPaste, copiedSlot, router }: DayCellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const isSource = copiedSlot?.week === week && copiedSlot?.day === day
  const hasCopied = copiedSlot !== null && !isSource
  const isEmpty = !slot
  const isRest = slot?.isRest ?? false
  const hasWorkout = !!slot?.workoutId && !isRest

  return (
    <div
      className={cn(
        'relative group/cell border-r border-b border-border min-h-[90px] transition-colors select-none',
        isEmpty && 'hover:bg-muted/30 cursor-pointer',
        isRest && 'bg-muted/20',
        hasWorkout && 'bg-primary/[0.04] hover:bg-primary/[0.08]',
        isSource && 'ring-1 ring-inset ring-primary/50 bg-primary/[0.04]',
      )}
      onClick={isEmpty ? () => setPickerOpen(true) : undefined}
    >
      {/* Tiny invisible anchor for the popover — avoids click conflict with cell */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <span className="absolute top-0 left-0 w-px h-px pointer-events-none" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder="Search workouts…" className="h-8" />
            <CommandList className="max-h-56">
              <CommandEmpty>No workouts found</CommandEmpty>
              <CommandGroup>
                {workouts.map(w => (
                  <CommandItem
                    key={w.id}
                    value={w.title}
                    onSelect={async () => { await onAssign(week, day, w.id, w.title); setPickerOpen(false) }}
                  >
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
                  <CommandItem
                    value="__clear"
                    className="text-destructive data-[selected=true]:text-destructive"
                    onSelect={async () => { await onClear(week, day); setPickerOpen(false) }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">Clear slot</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* ── Empty ── */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
        </div>
      )}

      {/* ── Rest day ── */}
      {isRest && (
        <div className="flex items-start justify-between p-2.5">
          <div className="flex items-center gap-1.5 pt-0.5">
            <Moon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Rest</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted/60 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setPickerOpen(true) }}>Change</DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onCopy(week, day); toast.success('Slot copied') }}>Copy slot</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async e => { e.stopPropagation(); await onClear(week, day) }}
              >Clear</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── Workout ── */}
      {hasWorkout && (
        <div
          className="flex flex-col p-2.5 min-h-[90px] cursor-pointer"
          onClick={() => router.push(`/dashboard/workouts/${slot!.workoutId}`)}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold leading-snug line-clamp-3 flex-1">
              {slot!.workoutTitle}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted/60 opacity-0 group-hover/cell:opacity-100 transition-opacity -mt-0.5 -mr-0.5">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/workouts/${slot!.workoutId}`) }}>
                  Open workout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); setPickerOpen(true) }}>
                  Change workout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onCopy(week, day); toast.success('Slot copied') }}>
                  Copy slot
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async e => { e.stopPropagation(); await onRest(week, day) }}>
                  Mark as rest
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async e => { e.stopPropagation(); await onClear(week, day) }}
                >Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* ── Paste button — only when clipboard is set and this isn't the source ── */}
      {hasCopied && (
        <button
          className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded border border-border bg-background hover:bg-muted inline-flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity z-10"
          onClick={async e => { e.stopPropagation(); await onPaste(week, day) }}
          title="Paste copied session"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
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
  const { setActions } = usePageActions()

  const [program, setProgram] = useState<Program | null>(null)
  const [title, setTitle] = useState('')
  const [weeksCount, setWeeksCount] = useState(4)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<Record<SlotKey, Slot>>({})
  const [allWorkouts, setAllWorkouts] = useState<{ id: string; title: string }[]>([])
  const [copiedSlot, setCopiedSlot] = useState<{ week: number; day: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ weeks: '4', days: '3', type: 'strength' })
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
            .select('id, title, subtitle, duration_weeks, training_days_per_week, program_type')
            .eq('id', programId)
            .eq('trainer_id', user.id)
            .maybeSingle(),
          supabase
            .from('workout_instances')
            .select('week_number, day_number, workout_template_id, title')
            .eq('program_id', programId)
            .order('week_number')
            .order('day_number'),
          supabase
            .from('program_workouts')
            .select('week_number, day_number')
            .eq('program_id', programId)
            .is('workout_id', null)
            .order('week_number')
            .order('day_number'),
          supabase.from('workouts').select('id, title').eq('trainer_id', user.id).order('title'),
        ])

        if (!pRes.data) { setLoading(false); return }
        const p = pRes.data as Program
        setProgram(p)
        setTitle(p.title ?? '')
        setWeeksCount(p.duration_weeks ?? 4)
        setDaysPerWeek(p.training_days_per_week ?? 3)
        setSettingsForm({
          weeks: String(p.duration_weeks ?? 4),
          days: String(p.training_days_per_week ?? 3),
          type: p.program_type ?? 'strength',
        })

        const slotMap: Record<SlotKey, Slot> = {}
        // Real workout instances — title stored directly on the row
        type WIRow = { week_number: number; day_number: number; workout_template_id: string | null; title: string | null }
        type PWRow = { week_number: number; day_number: number }
        for (const wi of (wiRes.data as unknown as WIRow[]) || []) {
          slotMap[`${wi.week_number}-${wi.day_number}`] = {
            workoutId: wi.workout_template_id,
            workoutTitle: wi.title,
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
      <div className="flex items-center gap-3">
        <span className={cn(
          'text-xs transition-opacity duration-200',
          saveStatus === 'idle' ? 'opacity-0' : 'opacity-100',
          saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
        <Button variant="outline" className="h-8" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-3.5 w-3.5 mr-1.5" />Settings
        </Button>
        <Button variant="outline" className="bg-card h-8" onClick={() => router.push('/dashboard/programs')}>Done</Button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, program, saveStatus, loading, router])

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

  // ── Slot mutations ──
  const setSlotAndSave = useCallback(async (week: number, day: number, slot: Slot | null) => {
    const key = `${week}-${day}`
    // Optimistic update
    if (slot) {
      setSlots(prev => ({ ...prev, [key]: slot }))
    } else {
      setSlots(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    // Always clear both tables for this slot first
    await Promise.all([
      supabase.from('workout_instances').delete().eq('program_id', programId).eq('week_number', week).eq('day_number', day),
      supabase.from('program_workouts').delete().eq('program_id', programId).eq('week_number', week).eq('day_number', day),
    ])
    if (slot) {
      if (slot.isRest) {
        // Rest days stored in program_workouts with workout_id null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('program_workouts').insert({
          program_id: programId, week_number: week, day_number: day, workout_id: null,
        })
        if (error) toast.error('Failed to save')
      } else {
        // Real workouts stored in workout_instances
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('workout_instances').insert({
          program_id: programId, workout_template_id: slot.workoutId, title: slot.workoutTitle, week_number: week, day_number: day,
        })
        if (error) toast.error('Failed to save')
      }
    }
  }, [programId])

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
    const restInserts = fromEntries.filter(([, s]) => s.isRest).map(([k]) => ({
      program_id: programId, week_number: toWeek, day_number: parseInt(k.split('-')[1], 10), workout_id: null,
    }))
    const wiInserts = fromEntries.filter(([, s]) => !s.isRest && s.workoutId).map(([k, s]) => ({
      program_id: programId, workout_template_id: s.workoutId, title: s.workoutTitle, week_number: toWeek, day_number: parseInt(k.split('-')[1], 10),
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [r1, r2] = await Promise.all([
      restInserts.length ? db.from('program_workouts').insert(restInserts) : Promise.resolve({ error: null }),
      wiInserts.length ? db.from('workout_instances').insert(wiInserts) : Promise.resolve({ error: null }),
    ])
    if (r1.error || r2.error) toast.error('Copy failed')
    else toast.success(`Week ${fromWeek} → Week ${toWeek}`)
  }, [programId, slots])

  // ── Settings ──
  const saveSettings = useCallback(async () => {
    const weeks = parseInt(settingsForm.weeks, 10) || 4
    const days = parseInt(settingsForm.days, 10) || 3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('programs').update({
      duration_weeks: weeks, training_days_per_week: days, program_type: settingsForm.type,
    }).eq('id', programId)
    if (error) { toast.error('Failed to save settings'); return }
    setWeeksCount(weeks)
    setDaysPerWeek(days)
    setProgram(prev => prev ? { ...prev, duration_weeks: weeks, training_days_per_week: days, program_type: settingsForm.type } : prev)
    setSettingsOpen(false)
    toast.success('Settings saved')
  }, [settingsForm, programId])

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

      {/* Subheader: editable title + metadata */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80">
        <input
          className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0 placeholder:text-muted-foreground"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Program title…"
        />
        {program?.program_type && (
          <Badge variant="outline" className="bg-card text-xs capitalize shrink-0">
            {program.program_type.replace(/_/g, ' ')}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground shrink-0">{weeksCount}wk · {daysPerWeek}d/wk</span>
        {copiedSlot && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 underline underline-offset-2"
            onClick={() => setCopiedSlot(null)}
            title="Clear clipboard"
          >
            Wk{copiedSlot.week} D{copiedSlot.day} copied · clear
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${daysPerWeek}, minmax(140px, 1fr))`,
          minWidth: `${72 + daysPerWeek * 140}px`,
        }}>

          {/* Header row */}
          <div className="h-9 border-r border-b border-border bg-muted/30" />
          {Array.from({ length: daysPerWeek }, (_, i) => (
            <div key={i} className="h-9 flex items-center justify-center border-r border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Day {i + 1}</span>
            </div>
          ))}

          {/* Week rows */}
          {Array.from({ length: weeksCount }, (_, weekIdx) => {
            const week = weekIdx + 1
            const weekEntries = Object.entries(slots).filter(([k]) => k.startsWith(`${week}-`))
            const workoutCount = weekEntries.filter(([, s]) => s.workoutId && !s.isRest).length
            const restCount = weekEntries.filter(([, s]) => s.isRest).length

            return (
              <React.Fragment key={week}>
                {/* Week label */}
                <div className="relative flex flex-col items-center justify-center border-r border-b border-border bg-muted/20 min-h-[90px] gap-0.5 group/week px-1 py-2">
                  <span className="text-xs font-semibold">Wk {week}</span>
                  {(workoutCount > 0 || restCount > 0) && (
                    <div className="flex flex-col items-center gap-0">
                      {workoutCount > 0 && (
                        <span className="text-[10px] text-muted-foreground leading-tight">{workoutCount}s</span>
                      )}
                      {restCount > 0 && (
                        <span className="text-[10px] text-muted-foreground leading-tight">{restCount}r</span>
                      )}
                    </div>
                  )}
                  {/* Copy to next week */}
                  {week < weeksCount && (
                    <button
                      className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/week:opacity-100 transition-opacity h-5 w-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center shadow-sm border border-primary/20"
                      onClick={() => copyWeekToNext(week)}
                      title={`Copy to Wk ${week + 1}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
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
                    />
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
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
