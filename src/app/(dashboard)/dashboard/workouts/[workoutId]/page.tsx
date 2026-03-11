'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  MoreHorizontal, Plus, Trash2, Link2, TrendingDown, StickyNote,
  Settings, Undo2, Redo2, Check, ChevronDown, X, Link2Off,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Equipment / Categories ───────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = [
  'All','Barbell','Dumbbell','Kettlebell','Machine','Cable','TRX','Box',
  'Battle Rope','Bodyweight','Sled','Rower','SkiErg','Assault Bike',
  'Exercise Bike','Stepper','Elliptical','Treadmill','Cycle','Swim',
  'Stretch','Mobility','Run',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string
  name: string
  equipment?: string
  description?: string
  trainer_id?: string | null
}

interface ExerciseItem {
  tempId: string
  type: 'exercise'
  exercise_id: string | null
  exercise?: Exercise | null
  set_count: number | ''
  reps: number | ''
  weight: number | ''
  rest_seconds: number | ''
  minutes: string
  seconds: string
  distance?: number | ''
  calories?: number | ''
  notes?: string
  superset_id?: string
  is_dropset: boolean
  dropset_weights: string[]
  dropset_reps: string[]
  dropset_notes: string[]
  measurement_type: 'reps' | 'time' | 'calories'
  hidden_fields: string[]
  // Per-exercise tracking flags (show_* columns on workout_exercises)
  show_reps: boolean
  show_weight: boolean
  show_time: boolean
  show_distance: boolean
  position?: number
}

interface NoteItem {
  tempId: string
  type: 'workout-note'
  noteText: string
  position?: number
}

type WorkoutItem = ExerciseItem | NoteItem

interface VisibleCols {
  sets: boolean; reps: boolean; weight: boolean; rest: boolean; distance: boolean; notes: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uuid = () => crypto.randomUUID()

function secsToMM(secs: number): { minutes: string; seconds: string } {
  return { minutes: String(Math.floor(secs / 60)), seconds: String(secs % 60) }
}

function MMToSecs(mins: string, secs: string): number {
  return (parseInt(mins || '0') || 0) * 60 + (parseInt(secs || '0') || 0)
}

function blankExercise(exercise?: Exercise): ExerciseItem {
  return {
    tempId: uuid(),
    type: 'exercise',
    exercise_id: exercise?.id ?? null,
    exercise: exercise ?? null,
    set_count: 3, reps: 10, weight: '', rest_seconds: 60,
    minutes: '', seconds: '', distance: '', calories: '',
    notes: '', superset_id: undefined, is_dropset: false,
    dropset_weights: [''], dropset_reps: [''], dropset_notes: [''],
    measurement_type: 'reps', hidden_fields: [],
    show_reps: true, show_weight: true, show_time: false, show_distance: false,
  }
}

// ─── Exercise Name Picker (popover combobox) ──────────────────────────────────

function ExercisePicker({
  value, exercises, onSelect,
}: { value: string | null; exercises: Exercise[]; onSelect: (ex: Exercise) => void }) {
  const [open, setOpen] = useState(false)
  const current = exercises.find(e => e.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1 rounded hover:bg-muted/50 transition-colors min-w-0">
          <span className={cn(
            'block text-sm truncate leading-tight',
            current ? 'font-medium' : 'italic text-muted-foreground font-normal'
          )}>
            {current?.name ?? 'Pick exercise…'}
          </span>
          {current?.equipment && (
            <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{current.equipment}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search exercises…" />
          <CommandList className="max-h-60">
            <CommandEmpty>No exercises found</CommandEmpty>
            <CommandGroup>
              {exercises.map(ex => (
                <CommandItem key={ex.id} value={ex.name} onSelect={() => { onSelect(ex); setOpen(false) }}>
                  <Check className={cn('mr-2 h-3.5 w-3.5 shrink-0', ex.id === value ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate text-sm">{ex.name}</span>
                  {ex.equipment && <span className="text-xs text-muted-foreground ml-1">{ex.equipment}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Table Header ─────────────────────────────────────────────────────────────

function TableHeader({ cols, onToggle }: { cols: VisibleCols; onToggle: (k: keyof VisibleCols) => void }) {
  const entries: [keyof VisibleCols, string][] = [
    ['sets','Sets'],['reps','Reps'],['weight','Weight'],['rest','Rest'],['distance','Dist'],['notes','Notes'],
  ]
  return (
    <div className="flex items-center h-10 border-b bg-muted/30 px-2 select-none">
      <div className="w-9 shrink-0" /> {/* exercise index */}
      <div className="w-48 shrink-0 pl-2 text-xs font-medium text-muted-foreground">Exercise</div>
      {entries.map(([k, label]) => cols[k] && (
        <button
          key={k}
          onClick={() => onToggle(k)}
          className="w-16 text-center shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          title={`Hide ${label} column`}
        >{label}</button>
      ))}
      <div className="w-8 shrink-0" /> {/* row actions */}
    </div>
  )
}

// ─── Dropset Rows ─────────────────────────────────────────────────────────────

function DropsetRows({
  item, index, cols, weightUnit, onChange, onAdd, onRemove,
}: {
  item: ExerciseItem
  index: number
  cols: VisibleCols
  weightUnit: 'lbs' | 'kg'
  onChange: (i: number, field: string, di: number, val: string) => void
  onAdd: (i: number) => void
  onRemove: (i: number, di: number) => void
}) {
  const isHidden = (k: keyof VisibleCols) => item.hidden_fields?.includes(k)

  return (
    <>
      {item.dropset_weights.map((w, di) => (
        <div key={di} className="relative flex items-center border-b border-border/50 bg-muted/20 px-2 py-1.5 group/drop">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />
          <div className="w-9 flex justify-center shrink-0" />
          <div className="w-48 shrink-0 min-w-0">
            <button className="w-full text-left px-2 py-1 rounded min-w-0">
              <span className="block text-xs text-muted-foreground leading-tight truncate">Dropset {di + 1}</span>
            </button>
          </div>
          {cols.sets && !isHidden('sets') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent rounded placeholder:text-transparent disabled:opacity-100 disabled:bg-transparent cursor-default"
                value="" type="number" placeholder="sets" disabled />
            </div>
          )}
          {cols.reps && !isHidden('reps') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                value={item.dropset_reps[di] ?? ''}
                onChange={e => onChange(index, 'dropset_reps', di, e.target.value)}
                type="number" min={0} placeholder="reps" />
            </div>
          )}
          {cols.weight && !isHidden('weight') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                value={w ?? ''}
                onChange={e => onChange(index, 'dropset_weights', di, e.target.value)}
                type="number" min={0} placeholder={weightUnit} />
            </div>
          )}
          {cols.rest && !isHidden('rest') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent rounded placeholder:text-transparent disabled:opacity-100 disabled:bg-transparent cursor-default"
                value="" type="number" placeholder="sec" disabled />
            </div>
          )}
          {cols.distance && !isHidden('distance') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent rounded placeholder:text-transparent disabled:opacity-100 disabled:bg-transparent cursor-default"
                value="" type="number" placeholder="dist" disabled />
            </div>
          )}
          {cols.notes && !isHidden('notes') && (
            <div className="w-16 flex justify-center shrink-0">
              <Input className="h-7 w-12 text-sm p-1 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                value={item.dropset_notes[di] ?? ''}
                onChange={e => onChange(index, 'dropset_notes', di, e.target.value)}
                placeholder="note" />
            </div>
          )}
          <div className="w-8 flex justify-center">
            {item.dropset_weights.length > 1 && (
              <button onClick={() => onRemove(index, di)} className="opacity-0 group-hover/drop:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
      {/* Add drop */}
      <div className="relative flex items-center px-2 py-1 bg-muted/20">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />
        <div className="w-9 flex justify-center shrink-0" />
        <div className="w-48 shrink-0 min-w-0">
          <button onClick={() => onAdd(index)} className="w-full text-left px-2 py-1 rounded min-w-0 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Plus className="h-3 w-3" />Add drop
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({
  item, index, exerciseLabel, items, cols, weightUnit, allExercises,
  dragging, dragOver, onDragStart, onDragEnd, onDragOver, onDrop,
  onChange, onRemove, onCycleMetric, onToggleField, onToggleShowField, onToggleSuperset,
  onToggleDropset, onDropsetChange, onDropsetAdd, onDropsetRemove,
  selectionMode, isSelected, onBadgeClick,
}: {
  item: ExerciseItem
  index: number
  exerciseLabel: string
  items: WorkoutItem[]
  cols: VisibleCols
  weightUnit: 'lbs' | 'kg'
  allExercises: Exercise[]
  dragging: number | null
  dragOver: number | null
  onDragStart: (i: number) => void
  onDragEnd: () => void
  onDragOver: (i: number) => void
  onDrop: (i: number) => void
  onChange: (i: number, field: string, val: unknown) => void
  onRemove: (i: number) => void
  onCycleMetric: (i: number) => void
  onToggleField: (i: number, f: string) => void
  onToggleShowField: (i: number, f: 'show_reps' | 'show_weight' | 'show_time' | 'show_distance') => void
  onToggleSuperset: (i: number) => void
  onToggleDropset: (i: number) => void
  onDropsetChange: (i: number, field: string, di: number, val: string) => void
  onDropsetAdd: (i: number) => void
  onDropsetRemove: (i: number, di: number) => void
  selectionMode: 'idle' | 'superset' | 'dropset'
  isSelected: boolean
  onBadgeClick: (tempId: string) => void
}) {
  const hidden = item.hidden_fields ?? []
  const isHidden = (f: string) => hidden.includes(f)

  // Superset grouping
  const prevItem = index > 0 ? items[index - 1] : null
  const nextItem = index < items.length - 1 ? items[index + 1] : null
  const prevExItem = prevItem?.type === 'exercise' ? prevItem as ExerciseItem : null
  const nextExItem = nextItem?.type === 'exercise' ? nextItem as ExerciseItem : null
  const inSuperset = !!item.superset_id
  const supersetStart = inSuperset && prevExItem?.superset_id !== item.superset_id
  const inDropset = !!item.is_dropset
  const dropsetStart = inDropset && !prevExItem?.is_dropset
  const metricLabel = item.measurement_type === 'time' ? 'Time' : item.measurement_type === 'calories' ? 'Cals' : 'Reps'

  // If this is a superset, check if any member of the group has a dropset
  const supersetHasDropset = inSuperset && items.some(
    i => i.type === 'exercise' && (i as ExerciseItem).superset_id === item.superset_id && (i as ExerciseItem).is_dropset
  )

  return (
    <>
      {/* Superset label — shows SS, or SS + DS if any member has a dropset */}
      {supersetStart && (
        <div className="flex items-center px-2 py-2 bg-primary/5">
          <div className="w-9 shrink-0 flex justify-center gap-1">
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-0">SS</Badge>
            {supersetHasDropset && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-0">DS</Badge>
            )}
          </div>
        </div>
      )}

      {/* Dropset label — only shown when NOT inside a superset */}
      {dropsetStart && !inSuperset && (
        <div className="flex items-center px-2 py-2 bg-emerald-500/5">
          <div className="w-9 shrink-0 flex justify-center">
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-600 dark:text-emerald-400 border-0">DS</Badge>
          </div>
        </div>
      )}

      {/* Drop target indicator */}
      {dragOver === index && dragging !== index && (
        <div className="h-0.5 bg-primary mx-4 rounded-full" />
      )}

      <div
        draggable={selectionMode === 'idle'}
        onDragStart={() => onDragStart(index)}
        onDragEnd={onDragEnd}
        onDragOver={e => { e.preventDefault(); onDragOver(index) }}
        onDrop={() => onDrop(index)}
        className={cn(
          'relative flex items-center border-b border-border/50 group/row transition-colors',
          inSuperset ? 'border-l-2 border-l-primary' : '',
          dragging === index ? 'opacity-40' : 'hover:bg-muted/20',
          'px-2 py-1.5'
        )}
      >
        {inDropset && !inSuperset && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />}
        {/* Exercise index badge */}
        <div className="w-9 flex justify-center shrink-0">
          <div
            onClick={e => { e.stopPropagation(); onBadgeClick(item.tempId) }}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-semibold transition-all',
              selectionMode === 'idle'
                ? 'bg-primary/10 text-primary cursor-grab active:cursor-grabbing'
                : selectionMode === 'superset' || (selectionMode === 'dropset' && inSuperset)
                  ? isSelected
                    ? 'bg-primary text-primary-foreground cursor-pointer scale-110'
                    : 'bg-primary/10 text-primary cursor-pointer ring-2 ring-primary/40 animate-pulse hover:animate-none hover:ring-primary/70'
                  : isSelected
                    ? 'bg-emerald-500 text-white cursor-pointer scale-110'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer ring-2 ring-emerald-500/40 animate-pulse hover:animate-none hover:ring-emerald-500/70'
            )}
            title={selectionMode !== 'idle' ? (isSelected ? 'Deselect' : 'Select') : 'Drag to reorder'}
          >
            {selectionMode !== 'idle' && isSelected
              ? <Check className="h-3 w-3" />
              : <span>{exerciseLabel}</span>
            }
          </div>
        </div>

        {/* Exercise name + equipment */}
        <div className="w-48 shrink-0 min-w-0">
          <ExercisePicker
            value={item.exercise_id}
            exercises={allExercises}
            onSelect={ex => { onChange(index, 'exercise_id', ex.id); onChange(index, 'exercise', ex) }}
          />
        </div>

        {/* Sets */}
        {cols.sets && !isHidden('sets') && (
          <div className="w-16 flex justify-center shrink-0">
            <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
              value={item.set_count === '' ? '' : item.set_count}
              onChange={e => onChange(index, 'set_count', e.target.value === '' ? '' : Number(e.target.value))}
              type="number" min={1} placeholder="sets" />
          </div>
        )}

        {/* Reps / Time / Calories */}
        {cols.reps && !isHidden('reps') && (
          <div className="w-16 flex justify-center shrink-0">
            {item.measurement_type === 'time' ? (
              <div className="flex items-center gap-0.5 text-sm">
                <Input className="h-7 w-7 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                  value={item.minutes} onChange={e => onChange(index, 'minutes', e.target.value)}
                  placeholder="0" type="number" min={0} />
                <span className="text-muted-foreground text-xs">:</span>
                <Input className="h-7 w-7 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                  value={item.seconds} onChange={e => onChange(index, 'seconds', e.target.value)}
                  placeholder="00" type="number" min={0} max={59} />
              </div>
            ) : item.measurement_type === 'calories' ? (
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                value={item.calories === '' ? '' : item.calories}
                onChange={e => onChange(index, 'calories', e.target.value === '' ? '' : Number(e.target.value))}
                type="number" min={0} placeholder="cals" />
            ) : (
              <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
                value={item.reps === '' ? '' : item.reps}
                onChange={e => onChange(index, 'reps', e.target.value === '' ? '' : Number(e.target.value))}
                type="number" min={0} placeholder="reps" />
            )}
          </div>
        )}

        {/* Weight */}
        {cols.weight && !isHidden('weight') && (
          <div className="w-16 flex justify-center shrink-0">
            <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
              value={item.weight === '' ? '' : item.weight}
              onChange={e => onChange(index, 'weight', e.target.value === '' ? '' : Number(e.target.value))}
              type="number" min={0} step={0.5} placeholder={weightUnit} />
          </div>
        )}

        {/* Rest */}
        {cols.rest && !isHidden('rest') && (
          <div className="w-16 flex justify-center shrink-0">
            <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
              value={item.rest_seconds === '' ? '' : item.rest_seconds}
              onChange={e => onChange(index, 'rest_seconds', e.target.value === '' ? '' : Number(e.target.value))}
              type="number" min={0} placeholder="sec" />
          </div>
        )}

        {/* Distance */}
        {cols.distance && !isHidden('distance') && (
          <div className="w-16 flex justify-center shrink-0">
            <Input className="h-7 w-12 text-center text-sm p-0 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
              value={item.distance === '' ? '' : item.distance}
              onChange={e => onChange(index, 'distance', e.target.value === '' ? '' : Number(e.target.value))}
              type="number" min={0} placeholder="dist" />
          </div>
        )}

        {/* Notes */}
        {cols.notes && !isHidden('notes') && (
          <div className="w-16 flex justify-center shrink-0">
            <Input className="h-7 w-12 text-xs p-1 border-0 bg-transparent hover:bg-muted focus:bg-muted rounded placeholder:text-muted-foreground/50"
              value={item.notes ?? ''}
              onChange={e => onChange(index, 'notes', e.target.value)}
              placeholder="note" />
          </div>
        )}

        {/* Row actions */}
        <div className="w-8 flex justify-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {/* Cycle metric */}
              <DropdownMenuItem onClick={() => onCycleMetric(index)}>
                <span className="text-xs">Metric: {metricLabel} →</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Field visibility sub-menu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">Fields</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['sets','reps','weight','rest','distance','notes'] as const).map(f => (
                    <DropdownMenuCheckboxItem
                      key={f}
                      className="text-xs"
                      checked={!isHidden(f)}
                      onCheckedChange={() => onToggleField(index, f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Superset/Dropset remove options — only shown when applicable */}
              {(inSuperset || item.is_dropset) && (
                <>
                  <DropdownMenuSeparator />
                  {inSuperset && (
                    <DropdownMenuItem onClick={() => onToggleSuperset(index)}>
                      <Link2Off className="h-3.5 w-3.5 mr-2" /><span className="text-xs">Remove from superset</span>
                    </DropdownMenuItem>
                  )}
                  {item.is_dropset && (
                    <DropdownMenuItem onClick={() => onToggleDropset(index)}>
                      <TrendingDown className="h-3.5 w-3.5 mr-2" />
                      <span className="text-xs">Remove dropset</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem onClick={() => onRemove(index)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                <span className="text-xs">Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tracking field chip picker — shown on hover */}
      <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-1 px-2 pb-1.5 -mt-0.5 ml-9">
        {([ 
          { key: 'show_reps', label: 'Reps' },
          { key: 'show_weight', label: 'Weight' },
          { key: 'show_time', label: 'Time' },
          { key: 'show_distance', label: 'Dist' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={e => { e.stopPropagation(); onToggleShowField(index, key) }}
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full border font-medium transition-colors',
              item[key]
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dropset rows */}
      {item.is_dropset && (
        <DropsetRows
          item={item} index={index} cols={cols} weightUnit={weightUnit}
          onChange={onDropsetChange} onAdd={onDropsetAdd} onRemove={onDropsetRemove}
        />
      )}
    </>
  )
}

// ─── Note Row ─────────────────────────────────────────────────────────────────

function NoteRow({
  item, index, cols, dragging, dragOver, onDragStart, onDragEnd, onDragOver, onDrop, onChange, onRemove,
}: {
  item: NoteItem; index: number
  cols: VisibleCols
  dragging: number | null; dragOver: number | null
  onDragStart: (i: number) => void; onDragEnd: () => void
  onDragOver: (i: number) => void; onDrop: (i: number) => void
  onChange: (i: number, val: string) => void; onRemove: (i: number) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      {dragOver === index && dragging !== index && <div className="h-0.5 bg-primary mx-4 rounded-full" />}
      <div
        draggable={!editing}
        onDragStart={() => onDragStart(index)}
        onDragEnd={onDragEnd}
        onDragOver={e => { e.preventDefault(); onDragOver(index) }}
        onDrop={() => onDrop(index)}
        className={cn(
          'flex items-center px-2 py-2 border-b border-border/50 group/note bg-muted/20',
          dragging === index ? 'opacity-40' : ''
        )}
      >
        {/* Icon — matches exercise row w-9 badge */}
        <div className="w-9 flex justify-center shrink-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center cursor-grab active:cursor-grabbing" title="Drag to reorder">
            <StickyNote className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Note text — spans the w-48 exercise name column */}
        <div className="w-48 shrink-0 min-w-0 px-2">
          {editing ? (
            <Textarea
              autoFocus
              value={item.noteText}
              onChange={e => onChange(index, e.target.value)}
              onBlur={() => setEditing(false)}
              placeholder="Workout note…"
              rows={1}
              className="w-full resize-none text-sm border-0 bg-transparent px-0 py-1 min-h-0 leading-5 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50 placeholder:italic"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full text-left text-sm leading-5 truncate block"
            >
              {item.noteText
                ? <span className="truncate">{item.noteText}</span>
                : <span className="text-muted-foreground/50 italic">Workout note…</span>
              }
            </button>
          )}
        </div>

        {/* Metric column spacers — keeps ellipsis aligned with exercise rows */}
        {cols.sets      && <div className="w-16 shrink-0" />}
        {cols.reps      && <div className="w-16 shrink-0" />}
        {cols.weight    && <div className="w-16 shrink-0" />}
        {cols.rest      && <div className="w-16 shrink-0" />}
        {cols.distance  && <div className="w-16 shrink-0" />}
        {cols.notes     && <div className="w-16 shrink-0" />}

        <div className="w-8 flex justify-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-xs text-destructive focus:text-destructive"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}

// ─── Add Exercise Bar ─────────────────────────────────────────────────────────

function AddBar({
  exercises, category, onSetCategory, onAdd, onAddNote, selectionMode, onEnterMode,
}: {
  exercises: Exercise[]; category: string
  onSetCategory: (c: string) => void
  onAdd: (ex: Exercise) => void
  onAddNote: () => void
  selectionMode: 'idle' | 'superset' | 'dropset'
  onEnterMode: (type: 'superset' | 'dropset') => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchCat = category === 'All' || ex.equipment === category
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [exercises, category, search])

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30 sticky bottom-0 z-10">
      {/* Exercise search combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 gap-1.5 bg-card font-normal text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
            Add exercise…
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" side="top" align="start">
          <Command>
            <CommandInput placeholder="Search exercises…" value={search} onValueChange={setSearch} />
            <CommandList className="max-h-56">
              <CommandEmpty>No exercises found</CommandEmpty>
              <CommandGroup>
                {filtered.map(ex => (
                  <CommandItem key={ex.id} value={ex.name} onSelect={() => { onAdd(ex); setSearch(''); setOpen(false) }}>
                    <span className="flex-1 truncate text-sm">{ex.name}</span>
                    {ex.equipment && <span className="text-xs text-muted-foreground">{ex.equipment}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Category filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 gap-1 bg-card text-xs font-normal">
            {category}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="max-h-60 overflow-y-auto">
          {EQUIPMENT_OPTIONS.map(eq => (
            <DropdownMenuItem key={eq} className={cn('text-xs', category === eq && 'text-primary font-medium')}
              onClick={() => onSetCategory(eq)}>
              {eq}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1.5 ml-auto">
        {selectionMode === 'idle' && (<>
          <button
            onClick={() => onEnterMode('superset')}
            data-slot="button" data-size="default"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-xs font-medium bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors"
          >
            <Link2 className="h-3 w-3" />
            Superset
          </button>
          <button
            onClick={() => onEnterMode('dropset')}
            data-slot="button" data-size="default"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            <TrendingDown className="h-3 w-3" />
            Dropset
          </button>
        </>)}
        {/* Note button */}
        <Button variant="outline" onClick={onAddNote}
          className="gap-1 text-xs bg-card">
          <StickyNote className="h-3 w-3" />
          Note
        </Button>
      </div>
    </div>
  )
}

// ─── Settings Dropdown ────────────────────────────────────────────────────────

function SettingsMenu({
  weightUnit, cols, onSetWeightUnit, onToggleCol,
}: {
  weightUnit: 'lbs' | 'kg'
  cols: VisibleCols
  onSetWeightUnit: (u: 'lbs' | 'kg') => void
  onToggleCol: (k: keyof VisibleCols) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">Weight unit</DropdownMenuLabel>
        <DropdownMenuCheckboxItem className="text-xs" checked={weightUnit === 'kg'} onCheckedChange={() => onSetWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}>
          Kilograms (kg)
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
        {(['sets','reps','weight','rest','distance','notes'] as const).map(k => (
          <DropdownMenuCheckboxItem key={k} className="text-xs" checked={cols[k]} onCheckedChange={() => onToggleCol(k)}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderTabs } = usePageActions()
  const workoutId = params?.workoutId as string

  // ── Core state ──
  const [title, setTitle] = useState('Untitled Workout')
  const [workoutType, setWorkoutType] = useState<'strength' | 'circuit'>('strength')
  const [items, setItems] = useState<WorkoutItem[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('kg')
  const [cols, setCols] = useState<VisibleCols>({
    sets: true, reps: true, weight: true, rest: true, distance: false, notes: true,
  })
  const [loading, setLoading] = useState(true)
  const [workoutNotFound, setWorkoutNotFound] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragType, setDragType] = useState<string | null>(null)
  const [equipFilter, setEquipFilter] = useState('All')

  // ── Selection mode (badge-click superset/dropset) ──
  const [selectionMode, setSelectionMode] = useState<'idle' | 'superset' | 'dropset'>('idle')
  const [selectedTempIds, setSelectedTempIds] = useState<Set<string>>(new Set())

  // ── Undo/redo ──
  const [history, setHistory] = useState<{ title: string; items: WorkoutItem[] }[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const pushHistory = useCallback((t: string, its: WorkoutItem[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1)
      return [...trimmed, { title: t, items: its }].slice(-50)
    })
    setHistoryIdx(prev => Math.min(prev + 1, 49))
  }, [historyIdx])
  const canUndo = historyIdx > 0
  const canRedo = historyIdx < history.length - 1
  const undo = () => {
    if (!canUndo) return
    const prev = history[historyIdx - 1]
    setTitle(prev.title); setItems(prev.items)
    setHistoryIdx(h => h - 1)
    triggerAutoSave(prev.title, prev.items)
  }
  const redo = () => {
    if (!canRedo) return
    const next = history[historyIdx + 1]
    setTitle(next.title); setItems(next.items)
    setHistoryIdx(h => h + 1)
    triggerAutoSave(next.title, next.items)
  }

  // ── Auto-save ──
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingSave = useRef<{ title: string; items: WorkoutItem[] } | null>(null)

  const doSave = useCallback(async (t: string, its: WorkoutItem[]) => {
    if (!user?.id || !workoutId) return
    setSaveStatus('saving')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    try {
      await db.from('workouts').update({ title: t.trim() || 'Untitled Workout', weight_unit: weightUnit, workout_type: workoutType })
        .eq('id', workoutId).eq('trainer_id', user.id)

      await db.from('workout_exercises').delete().eq('workout_id', workoutId)
      await db.from('workout_notes').delete().eq('workout_id', workoutId)

      const exercises = its.filter(i => i.type === 'exercise') as ExerciseItem[]
      const notes = its.filter(i => i.type === 'workout-note') as NoteItem[]

      if (exercises.length) {
        await db.from('workout_exercises').insert(
          exercises.map((ex, pos) => {
            const originalPos = its.findIndex(i => i === ex)
            return {
              workout_id: workoutId,
              exercise_id: ex.exercise_id,
              set_count: ex.set_count !== '' ? Number(ex.set_count) : null,
              reps: ex.reps !== '' ? Number(ex.reps) : null,
              weight: ex.weight !== '' ? Number(ex.weight) : null,
              rest_seconds: ex.rest_seconds !== '' ? Number(ex.rest_seconds) : null,
              time: MMToSecs(ex.minutes, ex.seconds) || null,
              distance: ex.distance !== '' ? Number(ex.distance) : null,
              calories: ex.calories !== '' ? Number(ex.calories) : null,
              notes: ex.notes || null,
              superset_id: ex.superset_id || null,
              position: originalPos,
              is_dropset: ex.is_dropset,
              dropset_weights: ex.is_dropset ? ex.dropset_weights.map(w => Number(w) || 0) : null,
              dropset_reps: ex.is_dropset ? ex.dropset_reps : null,
              dropset_notes: ex.is_dropset ? ex.dropset_notes : null,
              hidden_fields: ex.hidden_fields.length ? ex.hidden_fields : null,
              measurement_type: ex.measurement_type,
              show_reps: ex.show_reps,
              show_weight: ex.show_weight,
              show_time: ex.show_time,
              show_distance: ex.show_distance,
            }
          })
        )
      }

      if (notes.length) {
        await db.from('workout_notes').insert(
          notes.map(n => ({
            workout_id: workoutId,
            note_text: n.noteText,
            position: its.findIndex(i => i === n),
          }))
        )
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      logger.error('Save error', err)
      setSaveStatus('error')
    }
  }, [user, workoutId, weightUnit, workoutType])

  const triggerAutoSave = useCallback((t: string, its: WorkoutItem[]) => {
    pendingSave.current = { title: t, items: its }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (pendingSave.current) doSave(pendingSave.current.title, pendingSave.current.items)
    }, 2000)
  }, [doSave])

  // ── Load workout ──
  useEffect(() => {
    if (!workoutId || !user?.id) return
    setLoading(true)

    Promise.all([
      supabase.from('exercises').select('*').or(`trainer_id.eq.${user.id},trainer_id.is.null`),
      supabase.from('workouts').select(`
        title, weight_unit, workout_type,
        workout_exercises(exercise_id,set_count,reps,rest_seconds,notes,time,distance,calories,weight,superset_id,position,is_dropset,dropset_weights,dropset_application,dropset_reps,dropset_notes,dropset_time,dropset_distance,dropset_calories,hidden_fields,measurement_type,show_reps,show_weight,show_time,show_distance,exercises(id,name,equipment)),
        workout_notes(id,note_text,position)
      `).eq('id', workoutId).eq('trainer_id', user.id).maybeSingle(),
    ]).then(([exRes, wRes]) => {
      if (exRes.data) setAllExercises(exRes.data as unknown as Exercise[])
      type WdType = { title: string | null; weight_unit: string | null; workout_type: string | null; workout_exercises: unknown[]; workout_notes: unknown[] }
      const wd = wRes.data as unknown as WdType | null
      if (!wd) { setWorkoutNotFound(true); setLoading(false); return }

      setTitle(wd.title ?? 'Untitled Workout')
      setWeightUnit((wd.weight_unit ?? 'kg') as 'lbs' | 'kg')
      setWorkoutType((wd.workout_type ?? 'strength') as 'strength' | 'circuit')

      const exItems: ExerciseItem[] = (wd.workout_exercises || []).map((we: any) => {
        const { minutes, seconds } = we.time ? secsToMM(we.time) : { minutes: '', seconds: '' }
        return {
          tempId: uuid(), type: 'exercise',
          exercise_id: we.exercise_id,
          exercise: we.exercises as Exercise ?? null,
          set_count: we.set_count ?? '',
          reps: we.reps ?? '',
          weight: we.weight ?? '',
          rest_seconds: we.rest_seconds ?? '',
          minutes, seconds,
          distance: we.distance ?? '',
          calories: we.calories ?? '',
          notes: we.notes ?? '',
          superset_id: we.superset_id ?? undefined,
          is_dropset: we.is_dropset ?? false,
          dropset_weights: we.dropset_weights?.map(String) ?? [''],
          dropset_reps: we.dropset_reps?.map(String) ?? [''],
          dropset_notes: we.dropset_notes?.map(String) ?? [''],
          measurement_type: we.measurement_type ?? 'reps',
          hidden_fields: we.hidden_fields ?? [],
          // Tracking flags — with backward compat from hidden_fields
          show_reps: we.show_reps ?? !we.hidden_fields?.includes('reps'),
          show_weight: we.show_weight ?? !we.hidden_fields?.includes('weight'),
          show_time: we.show_time ?? false,
          show_distance: we.show_distance ?? false,
          position: we.position ?? 0,
        }
      })

      const noteItems: NoteItem[] = (wd.workout_notes || []).map((wn: any) => ({
        tempId: uuid(), type: 'workout-note',
        noteText: wn.note_text ?? '',
        position: wn.position ?? 0,
      }))

      const merged = [...exItems, ...noteItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      setItems(merged)

      // Init history
      const snap = { title: wd.title ?? 'Untitled Workout', items: merged }
      setHistory([snap])
      setHistoryIdx(0)

      // Auto-show distance col if any exercise has distance
      if (exItems.some(e => e.distance !== '' && e.distance !== undefined)) {
        setCols(c => ({ ...c, distance: true }))
      }

      setLoading(false)
    })
  }, [workoutId, user?.id, router])

  // ── Header injection ──
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  }

  useEffect(() => {
    setHeaderTabs(
      <input
        className="w-56 bg-transparent border-0 text-sm font-semibold focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => { pushHistory(title, items); triggerAutoSave(title, items) }}
        onKeyDown={handleTitleKeyDown}
        placeholder="Workout title…"
      />
    )
    return () => setHeaderTabs(null)
  }, [title, items, setHeaderTabs])

  useEffect(() => {
    const handleDone = async () => {
      clearTimeout(saveTimer.current)
      await doSave(title, items)
      router.push('/dashboard/workouts')
    }
    setActions(
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs transition-opacity',
          saveStatus === 'idle' ? 'opacity-0' : 'opacity-100',
          saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" disabled={!canUndo} onClick={undo}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" disabled={!canRedo} onClick={redo}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex rounded-md border border-input overflow-hidden h-8">
          {(['strength', 'circuit'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={async () => {
                  setWorkoutType(t)
                  // Save immediately — can't use triggerAutoSave here because
                  // workoutType state update is async and doSave would use stale value
                  setSaveStatus('saving')
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabase as any).from('workouts').update({ workout_type: t })
                      .eq('id', workoutId).eq('trainer_id', user?.id)
                    setSaveStatus('saved')
                    setTimeout(() => setSaveStatus('idle'), 2000)
                  } catch { setSaveStatus('error') }
                }}
              className={cn(
                'px-2.5 text-xs font-medium transition-colors',
                workoutType === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'strength' ? 'Strength' : 'Circuit'}
            </button>
          ))}
        </div>
        <SettingsMenu weightUnit={weightUnit} cols={cols}
          onSetWeightUnit={u => { setWeightUnit(u); triggerAutoSave(title, items) }}
          onToggleCol={k => setCols(c => ({ ...c, [k]: !c[k] }))} />
        <Button variant="outline" className="bg-card h-8" onClick={handleDone}>Done</Button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, canUndo, canRedo, saveStatus, weightUnit, cols, title, items, workoutType, triggerAutoSave])

  // ── Mutations ──
  const updateItem = (index: number, field: string, val: unknown) => {
    setItems(prev => {
      const next = prev.map((it, i) => i === index ? { ...it, [field]: val } : it)
      triggerAutoSave(title, next)
      return next
    })
  }

  const addExercise = (ex: Exercise) => {
    const newItem = blankExercise(ex)
    setItems(prev => {
      const next = [...prev, newItem]
      pushHistory(title, next)
      triggerAutoSave(title, next)
      return next
    })
  }

  const addNote = () => {
    const note: NoteItem = { tempId: uuid(), type: 'workout-note', noteText: '' }
    setItems(prev => {
      const next = [...prev, note]
      pushHistory(title, next)
      triggerAutoSave(title, next)
      return next
    })
  }

  const removeItem = (index: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index)
      pushHistory(title, next)
      triggerAutoSave(title, next)
      return next
    })
  }

  const cycleMetric = (index: number) => {
    const cycles: ('reps' | 'time' | 'calories')[] = ['reps', 'time', 'calories']
    setItems(prev => {
      const item = prev[index] as ExerciseItem
      const next = cycles[(cycles.indexOf(item.measurement_type) + 1) % cycles.length]
      const updated = prev.map((it, i) => i === index ? { ...it, measurement_type: next } : it)
      triggerAutoSave(title, updated)
      return updated
    })
  }

  const toggleField = (index: number, field: string) => {
    setItems(prev => {
      const item = prev[index] as ExerciseItem
      const hf = item.hidden_fields ?? []
      const updated = hf.includes(field) ? hf.filter(f => f !== field) : [...hf, field]
      const next = prev.map((it, i) => i === index ? { ...it, hidden_fields: updated } : it)
      triggerAutoSave(title, next)
      return next
    })
  }

  const toggleShowField = (index: number, field: 'show_reps' | 'show_weight' | 'show_time' | 'show_distance') => {
    setItems(prev => {
      const next = prev.map((it, i) => i === index ? { ...it, [field]: !(it as ExerciseItem)[field] } : it)
      triggerAutoSave(title, next)
      return next
    })
  }

  const toggleSuperset = (index: number) => {
    setItems(prev => {
      const item = prev[index] as ExerciseItem
      if (item.superset_id) {
        // Remove from superset — if only 2 in superset, remove partner too
        const ssId = item.superset_id
        const ssItems = prev.filter(i => i.type === 'exercise' && (i as ExerciseItem).superset_id === ssId)
        const next = prev.map(it => {
          if (it.type !== 'exercise') return it
          const ex = it as ExerciseItem
          if (ex.superset_id !== ssId) return it
          if (ssItems.length <= 2 || ex.tempId === item.tempId) return { ...ex, superset_id: undefined }
          return it
        })
        triggerAutoSave(title, next)
        pushHistory(title, next)
        return next
      } else {
        // Add to superset with next exercise
        const nextIdx = index + 1
        if (nextIdx >= prev.length || prev[nextIdx].type !== 'exercise') {
          toast.info('Select the exercise you want to pair — it will be joined with the next exercise')
          return prev
        }
        const ssId = uuid()
        const next = prev.map((it, i) => {
          if (i !== index && i !== nextIdx) return it
          return { ...it, superset_id: ssId }
        })
        triggerAutoSave(title, next)
        pushHistory(title, next)
        return next
      }
    })
  }

  const toggleDropset = (index: number) => {
    setItems(prev => {
      const item = prev[index] as ExerciseItem
      const next = prev.map((it, i) => i !== index ? it : {
        ...it,
        is_dropset: !item.is_dropset,
        dropset_weights: item.dropset_weights.length ? item.dropset_weights : [''],
        dropset_reps: item.dropset_reps.length ? item.dropset_reps : [''],
        dropset_notes: item.dropset_notes.length ? item.dropset_notes : [''],
      })
      triggerAutoSave(title, next)
      return next
    })
  }

  // ── Badge-click selection mode handlers ──
  const enterMode = (type: 'superset' | 'dropset') => {
    setSelectionMode(type)
    setSelectedTempIds(new Set())
  }

  const handleBadgeClick = (tempId: string) => {
    if (selectionMode === 'idle') return
    setSelectedTempIds(prev => {
      const next = new Set(prev)
      if (next.has(tempId)) next.delete(tempId)
      else next.add(tempId)
      return next
    })
  }

  const cancelSelection = () => {
    setSelectionMode('idle')
    setSelectedTempIds(new Set())
  }

  const confirmSuperset = () => {
    const existingIds = items
      .filter(i => selectedTempIds.has(i.tempId) && i.type === 'exercise')
      .map(i => (i as ExerciseItem).superset_id)
      .filter(Boolean)
    const newSsId = existingIds[0] ?? crypto.randomUUID()
    setItems(prev => {
      const indices = prev
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => selectedTempIds.has(item.tempId) && item.type === 'exercise')
        .map(({ i }) => i)
        .sort((a, b) => a - b)
      if (indices.length < 2) return prev
      const firstIdx = indices[0]
      const selItems = indices.map(i => ({ ...prev[i], superset_id: newSsId } as ExerciseItem))
      const rest = prev.filter((_, i) => !indices.includes(i))
      rest.splice(firstIdx, 0, ...selItems)
      triggerAutoSave(title, rest)
      pushHistory(title, rest)
      return rest
    })
    cancelSelection()
  }

  const confirmDropset = () => {
    setItems(prev => {
      const next = prev.map(item => {
        if (selectedTempIds.has(item.tempId) && item.type === 'exercise') {
          const ex = item as ExerciseItem
          if (!ex.is_dropset) {
            return { ...ex, is_dropset: true, dropset_weights: [''], dropset_reps: [''], dropset_notes: [''] }
          }
        }
        return item
      })
      triggerAutoSave(title, next)
      pushHistory(title, next)
      return next
    })
    cancelSelection()
  }

  const dropsetChange = (i: number, field: string, di: number, val: string) => {
    setItems(prev => {
      const item = { ...prev[i] as ExerciseItem }
      const arr = [...(item[field as keyof ExerciseItem] as string[])]
      arr[di] = val
      ;(item as any)[field] = arr
      const next = prev.map((it, idx) => idx === i ? item : it)
      triggerAutoSave(title, next)
      return next
    })
  }

  const dropsetAdd = (i: number) => {
    setItems(prev => {
      const item = prev[i] as ExerciseItem
      const next = prev.map((it, idx) => idx !== i ? it : {
        ...it,
        dropset_weights: [...item.dropset_weights, ''],
        dropset_reps: [...item.dropset_reps, ''],
        dropset_notes: [...item.dropset_notes, ''],
      })
      triggerAutoSave(title, next)
      return next
    })
  }

  const dropsetRemove = (i: number, di: number) => {
    setItems(prev => {
      const item = prev[i] as ExerciseItem
      const next = prev.map((it, idx) => idx !== i ? it : {
        ...it,
        dropset_weights: item.dropset_weights.filter((_, j) => j !== di),
        dropset_reps: item.dropset_reps.filter((_, j) => j !== di),
        dropset_notes: item.dropset_notes.filter((_, j) => j !== di),
      })
      triggerAutoSave(title, next)
      return next
    })
  }

  // ── Drag reorder ──
  const handleDrop = (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIdx > dragIndex ? dropIdx - 1 : dropIdx, 0, moved)
      pushHistory(title, next)
      triggerAutoSave(title, next)
      return next
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // ── Drag technique pills (superset/dropset) drop onto rows ──
  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragType === 'superset' || dragType === 'dropset') {
      setDragOverIndex(index)
    } else {
      setDragOverIndex(index)
    }
  }

  const handleRowDrop = (e: React.DragEvent, index: number) => {
    const type = e.dataTransfer.getData('type')
    if (type === 'dropset') {
      toggleDropset(index)
    } else if (type === 'superset') {
      toggleSuperset(index)
    } else {
      handleDrop(index)
    }
    setDragOverIndex(null)
    setDragType(null)
  }

  // ── Filtered exercises for add bar ──
  const filteredExercises = useMemo(() =>
    allExercises.filter(ex => equipFilter === 'All' || ex.equipment === equipFilter),
    [allExercises, equipFilter]
  )

  const exerciseLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    let counter = 0
    const supersetIndex: Record<string, { base: number; nextLetter: number }> = {}

    for (const it of items) {
      if (it.type !== 'exercise') continue
      const ex = it as ExerciseItem

      if (ex.superset_id) {
        if (!supersetIndex[ex.superset_id]) {
          counter += 1
          supersetIndex[ex.superset_id] = { base: counter, nextLetter: 0 }
        }
        const grp = supersetIndex[ex.superset_id]
        labels[ex.tempId] = `${grp.base}${String.fromCharCode(65 + grp.nextLetter)}`
        grp.nextLetter += 1
      } else {
        counter += 1
        labels[ex.tempId] = String(counter)
      }
    }

    return labels
  }, [items])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-64" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    )
  }

  if (workoutNotFound) notFound()

  return (
    <div data-ui-exempt className="flex flex-col overflow-hidden m-6" style={{ borderRadius: 'var(--table-radius)', background: 'var(--card-bg)', boxShadow: 'var(--card-box-shadow)' }}>
      {/* Column headers */}
      <TableHeader cols={cols} onToggle={k => setCols(c => ({ ...c, [k]: !c[k] }))} />
      {/* Exercise list */}
      <div>

        {/* Rows */}
        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const t = e.dataTransfer.getData('type')
              if (t === 'workout-note') addNote()
            }}
          >
            <p className="text-sm">No exercises yet — add one below</p>
          </div>
        ) : (
          items.map((item, index) => {
            if (item.type === 'workout-note') {
              const note = item as NoteItem
              return (
                <NoteRow
                  key={item.tempId}
                  item={note} index={index}
                  cols={cols}
                  dragging={dragIndex} dragOver={dragOverIndex}
                  onDragStart={i => setDragIndex(i)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                  onDragOver={i => setDragOverIndex(i)}
                  onDrop={handleDrop}
                  onChange={(i, val) => updateItem(i, 'noteText', val)}
                  onRemove={removeItem}
                />
              )
            }
            const ex = item as ExerciseItem
            return (
              <ExerciseRow
                key={item.tempId}
                item={ex} index={index} exerciseLabel={exerciseLabels[item.tempId] ?? ''} items={items}
                cols={cols} weightUnit={weightUnit}
                allExercises={allExercises}
                dragging={dragIndex} dragOver={dragOverIndex}
                onDragStart={i => setDragIndex(i)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                onDragOver={i => setDragOverIndex(i)}
                onDrop={handleDrop}
                onChange={updateItem}
                onRemove={removeItem}
                onCycleMetric={cycleMetric}
                onToggleField={toggleField}
                onToggleShowField={toggleShowField}
                onToggleSuperset={toggleSuperset}
                onToggleDropset={toggleDropset}
                onDropsetChange={dropsetChange}
                onDropsetAdd={dropsetAdd}
                onDropsetRemove={dropsetRemove}
                selectionMode={selectionMode}
                isSelected={selectedTempIds.has(item.tempId)}
                onBadgeClick={handleBadgeClick}
              />
            )
          })
        )}
      </div>

      {/* Selection banner */}
      {selectionMode !== 'idle' && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 border-t border-border/50 animate-in slide-in-from-bottom-1 duration-150',
          selectionMode === 'dropset' ? 'bg-emerald-500/5' : 'bg-primary/5'
        )}>
          <span className="text-xs text-muted-foreground flex-1">
            {selectedTempIds.size} selected — tap exercises above
          </span>
          {selectionMode === 'superset' && (<>
            <button
              onClick={confirmSuperset}
              disabled={selectedTempIds.size < 2}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Link2 className="h-3 w-3" />
              Confirm Superset
            </button>
            <button
              onClick={cancelSelection}
              className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>)}
          {selectionMode === 'dropset' && (<>
            <button
              onClick={confirmDropset}
              disabled={selectedTempIds.size < 1}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <TrendingDown className="h-3 w-3" />
              Confirm Dropset
            </button>
            <button
              onClick={cancelSelection}
              className="flex items-center justify-center h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>)}
        </div>
      )}

      {/* Add exercise bar — sticky bottom */}
      <AddBar
        exercises={filteredExercises}
        category={equipFilter}
        onSetCategory={setEquipFilter}
        onAdd={addExercise}
        onAddNote={addNote}
        selectionMode={selectionMode}
        onEnterMode={enterMode}
      />
    </div>
  )
}
