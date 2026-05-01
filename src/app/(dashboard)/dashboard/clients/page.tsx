'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Switch } from '@/components/ui/switch'
import { Search, Plus, MoreHorizontal, Archive, Trash2, Users, SlidersHorizontal, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

interface Client {
  id: string
  name: string
  first_name?: string
  email: string
  programs: string
  status: 'Active' | 'Inactive' | 'Archived' | 'Lead'
  clientType: 'classes' | 'pt' | 'both' | 'none'
  abilityTier?: string | null
  last_activity_date?: string | null
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  Inactive: 'secondary',
  Archived: 'outline',
  Lead: 'outline',
}

const STATUS_COLOURS: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent',
  Lead: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent',
  Inactive: 'bg-red-500/15 text-red-700 dark:text-red-400 border-transparent',
  Archived: 'bg-muted text-muted-foreground border-transparent',
}

const TYPE_LABELS: Record<string, string> = {
  classes: 'Classes',
  pt: 'Personal Training',
  both: 'Full',
  none: 'None',
}

const TIER_COLOURS: Record<string, string> = {
  grey: 'bg-muted text-muted-foreground border-transparent',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent',
  black: 'bg-zinc-800/15 text-zinc-800 dark:text-zinc-300 border-transparent',
  none: 'bg-muted text-muted-foreground border-transparent',
}

const TYPE_COLOURS: Record<string, string> = {
  classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent',
  pt: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent',
  both: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-transparent',
  none: 'bg-muted text-muted-foreground border-transparent',
}

export default function ClientsPage() {
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<SortConfig<Client> | null>({ key: 'first_name', direction: 'asc' })

  // Add client modal
  const [showAddClient, setShowAddClient] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newGender, setNewGender] = useState('')
  const [newAbilityTier, setNewAbilityTier] = useState('')
  const [newIsPT, setNewIsPT] = useState(false)
  const [addingClient, setAddingClient] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Archive/Delete dialogs
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  const handleSort = (key: string) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const fetchClients = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data: profilesRaw, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, first_name, email, created_at, status, is_active, client_type, ability_tier')
        .eq('user_type', 'client')

      if (profilesError) throw profilesError
      const profiles = profilesRaw as Array<{
        id: string
        name: string | null
        first_name: string | null
        email: string | null
        created_at: string
        status: string | null
        ability_tier: string | null
        is_active: boolean | null
      }>
      if (!profiles || profiles.length === 0) { setClients([]); return }

      const clientIds = profiles.map(p => p.id)

      const { data: programAssignmentsRaw } = await supabase
        .from('client_programs')
        .select('client_id, status, programs:programs(title, subtitle)')
        .in('client_id', clientIds)
        .eq('status', 'active')
      const programAssignments = programAssignmentsRaw as Array<{
        client_id: string; status: string; programs: { title: string; subtitle: string | null } | null
      }> | null

      const { data: membershipsRaw } = await supabase
        .from('client_memberships')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('status', 'active')
      const membershipSet = new Set<string>(
        (membershipsRaw as Array<{ client_id: string }> | null)?.map(m => m.client_id) ?? []
      )

      const { data: activityDataRaw } = await supabase
        .from('activity_log')
        .select('client_id, created_at')
        .eq('trainer_id', user.id)
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })
      const activityData = activityDataRaw as Array<{ client_id: string; created_at: string }> | null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: trainerClientRaw } = await (supabase as any)
        .from('trainer_client')
        .select('client_id, appointment_status')
        .eq('trainer_id', user.id)
        .in('client_id', clientIds)
      const ptEnabledSet = new Set<string>(
        (trainerClientRaw as Array<{ client_id: string; appointment_status: string }> | null)
          ?.filter(r => r.appointment_status === 'active')
          .map(r => r.client_id) ?? []
      )

      const lastActivityMap: Record<string, string> = {}
      activityData?.forEach(log => {
        if (!lastActivityMap[log.client_id]) {
          lastActivityMap[log.client_id] = log.created_at
        }
      })

      const transformed: Client[] = profiles.map(profile => {
        const programs = programAssignments
          ?.filter(pa => pa.client_id === profile.id)
          .map(pa => {
            const t = pa.programs?.title || 'Unknown'
            const s = pa.programs?.subtitle
            return s ? `${t} (${s})` : t
          })
          .join(', ') || 'No Programs'

        const lastActivity = lastActivityMap[profile.id]
        const daysInactive = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        const isArchived = profile.status === 'archived'
        const isLead = profile.status === 'lead'
        let status: Client['status'] = 'Active'
        if (isArchived) status = 'Archived'
        else if (isLead) status = 'Lead'
        else if (daysInactive >= 30) status = 'Inactive'

        const hasPT = ptEnabledSet.has(profile.id)
        const hasClasses = membershipSet.has(profile.id)
        let clientType: Client['clientType']
        if (hasPT && hasClasses) clientType = 'both'
        else if (hasPT) clientType = 'pt'
        else if (hasClasses) clientType = 'classes'
        else clientType = 'none'

        return {
          id: profile.id,
          name: profile.name || profile.email || 'Unknown',
          first_name: profile.first_name || profile.name?.split(' ')[0],
          email: profile.email || '',
          programs,
          status,
          clientType,
          abilityTier: profile.ability_tier ?? null,
          last_activity_date: lastActivity,
        }
      })

      setClients(transformed)
    } catch (err) {
      logger.error('Error fetching clients:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => setShowAddClient(true)}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Add Client
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderSearch(
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search clients…"
            className="pl-8 h-8 text-sm bg-card"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-8 text-sm bg-card gap-1.5 px-3 relative">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {(statusFilter !== 'All' || typeFilter !== 'All') && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {(statusFilter !== 'All' ? 1 : 0) + (typeFilter !== 'All' ? 1 : 0)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</div>
            {['All', 'Active', 'Lead', 'Inactive', 'Archived'].map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="flex items-center justify-between">
                {s}
                {statusFilter === s && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Type</div>
            {['All', 'Classes', 'Personal Training', 'Full', 'None'].map(t => (
              <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)} className="flex items-center justify-between">
                {t}
                {typeFilter === t && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
    return () => setHeaderSearch(null)
  }, [searchQuery, statusFilter, typeFilter, setHeaderSearch])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, typeFilter])

  const handleAddClient = async () => {
    if (!user || !newFirstName.trim() || !newEmail.trim()) return
    setAddingClient(true)
    setAddError(null)
    try {
      const fullName = [newFirstName.trim(), newLastName.trim()].filter(Boolean).join(' ')
      const response = await fetch('/api/signup-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), name: fullName, trainerId: user.id, fromDashboard: true, clientType: newIsPT ? 'pt' : 'classes', gender: newGender || undefined, abilityTier: newAbilityTier || undefined }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to add client')

      toast.success('Client added successfully')
      setShowAddClient(false)
      setNewIsPT(false)
      setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewGender(''); setNewAbilityTier('')
      await fetchClients()
    } catch (err) {
      setAddError(getErrorMessage(err))
    } finally {
      setAddingClient(false)
    }
  }

  const handleArchive = async (clientId: string) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from('user_profiles').update({ status: 'archived', is_active: false }).eq('id', clientId)
      if (error) throw error
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: 'Archived' as const } : c))
      setArchiveId(null)
      toast.success('Client archived')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async (clientId: string) => {
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clientId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete client')
      }
      setClients(prev => prev.filter(c => c.id !== clientId))
      setDeleteId(null)
      toast.success('Client deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const filtered = clients.filter(c => {
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const notArchived = statusFilter !== 'All' ? true : c.status !== 'Archived'
    const typeLabel = TYPE_LABELS[c.clientType]
    const matchesType = typeFilter === 'All' || typeLabel === typeFilter
    return matchesSearch && matchesStatus && notArchived && matchesType
  })

  const sorted = sortData(filtered, sortConfig)
  const total = sorted.length
  const paginated = pageSize === Infinity ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-6 pb-10">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking progress and managing their programs."
          action={
            <Button variant="outline" onClick={() => setShowAddClient(true)}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
              Add Client
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No clients match your filters</p>
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4 w-9">
                  <div className="h-7 w-7 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Client"
                    direction={sortConfig?.key === 'first_name' ? sortConfig.direction : null}
                    onClick={() => handleSort('first_name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-xs font-medium hidden lg:table-cell">Ability</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Programs</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <TableCell className="py-3 pl-4 w-9">
                    <Avatar className="h-7 w-7 shrink-0 rounded-md after:rounded-md after:hidden">
                      <AvatarFallback className="text-xs bg-accent text-primary font-medium rounded-md">
                        {client.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    <Badge variant="outline" className={`text-xs ${TYPE_COLOURS[client.clientType]}`}>
                      {TYPE_LABELS[client.clientType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    {client.abilityTier && client.abilityTier !== 'none' ? (
                      <Badge variant="outline" className={`text-xs capitalize ${TIER_COLOURS[client.abilityTier] ?? ''}`}>
                        {client.abilityTier}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {(client.clientType === 'pt' || client.clientType === 'both')
                        ? client.programs
                        : client.programs !== 'No Programs' ? client.programs : ''}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLOURS[client.status] ?? ''}`}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setArchiveId(client.id)}>
                          <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(client.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
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

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground pt-2">
          <span className="shrink-0">{total} clients</span>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <Select value={pageSize === Infinity ? 'all' : String(pageSize)} onValueChange={v => { setPageSize(v === 'all' ? Infinity : Number(v)); setPage(1) }}>
              <SelectTrigger className="h-7 w-20 text-xs bg-card"><SelectValue>{pageSize === Infinity ? 'All' : String(pageSize)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-7 w-7 bg-card" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7 bg-card" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Client Sheet */}
      <Sheet open={showAddClient} onOpenChange={setShowAddClient}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle>Add New Client</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
            {addError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{addError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fn">First Name *</Label>
                <Input id="fn" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} placeholder="First name" disabled={addingClient} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln">Last Name</Label>
                <Input id="ln" value={newLastName} onChange={e => setNewLastName(e.target.value)} placeholder="Last name" disabled={addingClient} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em">Email Address *</Label>
              <Input id="em" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="client@example.com" disabled={addingClient} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Gender</Label>
              <Select value={newGender} onValueChange={setNewGender} disabled={addingClient}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ability Level</Label>
              <Select value={newAbilityTier} onValueChange={setNewAbilityTier} disabled={addingClient}>
                <SelectTrigger><SelectValue placeholder="Select ability level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grey">Grey</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Personal Training client</p>
                <p className="text-xs text-muted-foreground">Can be booked for PT appointments</p>
              </div>
              <Switch checked={newIsPT} onCheckedChange={setNewIsPT} disabled={addingClient} />
            </div>
            <p className="text-xs text-muted-foreground">The client will receive an email invitation to create their account.</p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowAddClient(false)} disabled={addingClient}>Cancel</Button>
            <Button
              onClick={handleAddClient}
              disabled={addingClient || !newFirstName.trim() || !newEmail.trim()}
            >
              {addingClient ? 'Adding…' : 'Add Client'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Archive Dialog */}
      <Dialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archive Client?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This client will be archived and hidden from the main list. You can view them by filtering for Archived clients.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveId(null)}>Cancel</Button>
            <Button onClick={() => archiveId && handleArchive(archiveId)}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive">Delete Client Permanently?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the client and all their data. This cannot be undone. Consider archiving instead.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
