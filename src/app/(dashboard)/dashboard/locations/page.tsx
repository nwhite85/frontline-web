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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Search, Plus, MoreHorizontal, MapPin, Star } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface LocationOption {
  id: string
  location_name: string
  is_favorite: boolean
  default_for_appointments: boolean
  default_for_challenges: boolean
  default_for_classes: boolean
  default_for_events: boolean
}

// ─────────────────────────────────────────────
// Location Sheet
// ─────────────────────────────────────────────
function LocationSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: LocationOption | null
  trainerId: string
  onSaved: () => void
}) {
  const [locationName, setLocationName] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [defaultForAppointments, setDefaultForAppointments] = useState(false)
  const [defaultForClasses, setDefaultForClasses] = useState(false)
  const [defaultForEvents, setDefaultForEvents] = useState(false)
  const [defaultForChallenges, setDefaultForChallenges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setLocationName(editTarget.location_name)
        setIsFavorite(editTarget.is_favorite)
        setDefaultForAppointments(editTarget.default_for_appointments)
        setDefaultForClasses(editTarget.default_for_classes)
        setDefaultForEvents(editTarget.default_for_events)
        setDefaultForChallenges(editTarget.default_for_challenges)
      } else {
        setLocationName(''); setIsFavorite(false)
        setDefaultForAppointments(false); setDefaultForClasses(false)
        setDefaultForEvents(false); setDefaultForChallenges(false)
      }
      setFormError('')
    }
  }, [open, editTarget])

  const handleSave = async () => {
    if (!locationName.trim()) { setFormError('Location name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        location_name: locationName.trim(),
        is_favorite: isFavorite,
        default_for_appointments: defaultForAppointments,
        default_for_classes: defaultForClasses,
        default_for_events: defaultForEvents,
        default_for_challenges: defaultForChallenges,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('location_options').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Location updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('location_options').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Location added')
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
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Location' : 'Add Location'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Location Name <span className="text-destructive">*</span></Label>
            <Input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. Studio A, City Park, Online" />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Favourite</Label>
            <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Default for</Label>
            <div className="flex items-center justify-between py-1">
              <Label className="font-normal">Appointments</Label>
              <Switch checked={defaultForAppointments} onCheckedChange={setDefaultForAppointments} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="font-normal">Classes</Label>
              <Switch checked={defaultForClasses} onCheckedChange={setDefaultForClasses} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="font-normal">Events</Label>
              <Switch checked={defaultForEvents} onCheckedChange={setDefaultForEvents} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="font-normal">Challenges</Label>
              <Switch checked={defaultForChallenges} onCheckedChange={setDefaultForChallenges} />
            </div>
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
export default function LocationsPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<LocationOption | null>(null)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig<LocationOption> | null>({ key: 'location_name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Add Location
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search locations…"
          className="pl-8 h-8 text-sm w-52 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [search, setHeaderSearch])

  const fetchLocations = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('location_options')
        .select('id, location_name, is_favorite, default_for_appointments, default_for_challenges, default_for_classes, default_for_events')
        .eq('trainer_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('location_name', { ascending: true })
      if (error) throw error
      setLocations(data as LocationOption[])
    } catch (err) {
      logger.error('Error fetching locations:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [user])


  const toggleFavorite = async (loc: LocationOption) => {
    try {
      const { error } = await supabase
        .from('location_options')
        // @ts-ignore
        .update({ is_favorite: !loc.is_favorite })
        .eq('id', loc.id)
      if (error) throw error
      setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, is_favorite: !l.is_favorite } : l))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('location_options').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setLocations(prev => prev.filter(l => l.id !== deleteTarget.id))
      toast.success('Location deleted')
      setDeleteTarget(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const defaultBadges = (loc: LocationOption) => {
    const badges: string[] = []
    if (loc.default_for_appointments) badges.push('Appointments')
    if (loc.default_for_classes) badges.push('Classes')
    if (loc.default_for_events) badges.push('Events')
    if (loc.default_for_challenges) badges.push('Challenges')
    return badges
  }

  const handleSort = (key: keyof LocationOption) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key as string, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const filtered = locations.filter(loc => !search || loc.location_name.toLowerCase().includes(search.toLowerCase()))
  const sorted = sortData(filtered, sortConfig)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = pageSize === Infinity ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add the locations where you train clients — gyms, studios, parks, or online venues."
          action={
            <Button variant="outline" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Location
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
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Name"
                    direction={sortConfig?.key === 'location_name' ? sortConfig.direction : null}
                    onClick={() => handleSort('location_name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Defaults</TableHead>
                <TableHead className="text-xs font-medium w-12">Fav</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((loc) => {
                const badges = defaultBadges(loc)
                return (
                  <TableRow key={loc.id} className="hover:bg-muted/30">
                    <TableCell className="py-3 pl-4 w-9">
                      <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-orange-100 dark:bg-orange-500/20">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-sm font-medium">{loc.location_name}</p>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {badges.length === 0
                          ? <span className="text-xs text-muted-foreground">—</span>
                          : badges.map(b => <Badge key={b} variant="outline" className="text-xs">{b}</Badge>)
                        }
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleFavorite(loc)}
                      >
                        <Star className={`h-3.5 w-3.5 ${loc.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </Button>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditTarget(loc); setShowSheet(true) }}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget({ id: loc.id, name: loc.location_name })}>Delete</DropdownMenuItem>
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{sorted.length} locations</span>
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

      <LocationSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editTarget={editTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchLocations}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.name ?? ''}
        itemKind="location"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
