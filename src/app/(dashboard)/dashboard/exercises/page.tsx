'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Plus, MoreHorizontal, Dumbbell, Trash2, Pencil } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'

interface Exercise {
  id: string
  name: string
  category?: string | null
  equipment?: string | null
  trainer_id: string | null
  created_at: string | null
  video_url?: string | null
}

const EQUIPMENT_OPTIONS = [
  'All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Kettlebell',
  'Resistance Band', 'Bodyweight', 'Pull-Up Bar', 'Foam Roller', 'TRX', 'Other',
]

const CATEGORY_OPTIONS = ['Strength', 'Cardio', 'Mixed', 'Mobility', 'Olympic', 'Power', 'Plyometric']

export default function ExercisesPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch, setHeaderTabs } = usePageActions()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('All')

  const [showAdd, setShowAdd] = useState(false)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Strength')
  const [formEquipment, setFormEquipment] = useState('Barbell')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [sortConfig, setSortConfig] = useState<SortConfig<Exercise> | null>({ key: 'name', direction: 'asc' })

  const handleSort = (key: string) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  useEffect(() => {
    setHeaderSearch(
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-8 h-8 text-sm w-24 lg:w-56 bg-card"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={equipmentFilter} onValueChange={v => { setEquipmentFilter(v); setPage(1) }}>
          <SelectTrigger className="h-8 text-xs bg-card border-input w-20 lg:w-32"><SelectValue placeholder="Equipment" /></SelectTrigger>
          <SelectContent>
            {EQUIPMENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    )
    setHeaderTabs(null)
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => setShowAdd(true)}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        <span className="hidden lg:inline">Add Exercise</span>
      </Button>
    )
    return () => { setHeaderSearch(null); setActions(null); setHeaderTabs(null) }
  }, [setActions, setHeaderSearch, searchQuery, equipmentFilter])

  const fetchExercises = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
      if (err) throw err
      setExercises(data || [])
    } catch (err) {
      logger.error('Error fetching exercises:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExercises() }, [user])

  const openEdit = (ex: Exercise) => {
    setEditExercise(ex)
    setFormName(ex.name)
    // no category field in DB
    setFormEquipment(ex.equipment || 'Barbell')
  }

  const openAdd = () => {
    setShowAdd(true)
    setFormName('')
    setFormCategory('Strength')
    setFormEquipment('Barbell')
  }

  const handleSave = async () => {
    if (!user || !formName.trim()) return
    setSaving(true)
    try {
      if (editExercise) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('exercises') as any).update({
          name: formName.trim(), equipment: formEquipment,
        }).eq('id', editExercise.id)
        if (error) throw error
        toast.success('Exercise updated')
        setEditExercise(null)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('exercises') as any).insert({
          name: formName.trim(), equipment: formEquipment, trainer_id: user.id,
        })
        if (error) throw error
        toast.success('Exercise added')
        setShowAdd(false)
      }
      await fetchExercises()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', deleteId)
      if (error) throw error
      setExercises(prev => prev.filter(e => e.id !== deleteId))
      setDeleteId(null)
      toast.success('Exercise deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const filtered = exercises.filter(ex => {
    const matchSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchEquip = equipmentFilter === 'All' || (ex.equipment || 'Bodyweight') === equipmentFilter
    return matchSearch && matchEquip
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
        <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Add exercises to use in your workouts and programs."
          action={<Button variant="outline" onClick={openAdd}><Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Exercise</Button>}
        />
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No exercises match your search</div>
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Name"
                    direction={sortConfig?.key === 'name' ? sortConfig.direction : null}
                    onClick={() => handleSort('name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Equipment</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(ex => (
                <TableRow key={ex.id} className="hover:bg-muted/30">
                  <TableCell className="py-2 text-sm font-medium">{ex.name}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">{ex.equipment || 'Bodyweight'}</TableCell>
                  <TableCell className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ex)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(ex.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                        </DropdownMenuItem>
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
          <span>{sorted.length} exercises</span>
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

      {/* Add/Edit Sheet */}
      <Sheet open={showAdd || !!editExercise} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditExercise(null) } }}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>{editExercise ? 'Edit Exercise' : 'Add Exercise'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="flex flex-col gap-1.5">
              <Label>Name *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Exercise name" disabled={saving} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Equipment</Label>
              <Select value={formEquipment} onValueChange={setFormEquipment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EQUIPMENT_OPTIONS.filter(o => o !== 'All').map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditExercise(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? 'Saving…' : editExercise ? 'Save' : 'Add'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Exercise?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the exercise. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
