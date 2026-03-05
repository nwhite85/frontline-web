'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Plus, MoreHorizontal, Clock, Users, MapPin, Package, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface AppointmentTemplate {
  id: string
  name: string
  description?: string
  duration_minutes: number
  location?: string
  max_capacity: number
  color?: string
  is_active: boolean
  min_advance_hours?: number
}

interface SessionPackage {
  id: string
  name: string
  description?: string
  session_count: number
  price: number
  validity_days?: number
  is_unlimited: boolean
  is_active: boolean
}

// ─────────────────────────────────────────────
// Appointment Type Sheet
// ─────────────────────────────────────────────
function AppointmentTypeSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: AppointmentTemplate | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('1')
  const [color, setColor] = useState('#6366f1')
  const [minAdvanceHours, setMinAdvanceHours] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setDuration(String(editTarget.duration_minutes))
        setLocation(editTarget.location || '')
        setMaxCapacity(String(editTarget.max_capacity))
        setColor(editTarget.color || '#6366f1')
        setMinAdvanceHours(String(editTarget.min_advance_hours ?? 0))
        setIsActive(editTarget.is_active)
      } else {
        setName(''); setDescription(''); setDuration('60'); setLocation('')
        setMaxCapacity('1'); setColor('#6366f1'); setMinAdvanceHours('0'); setIsActive(true)
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
        location: location || null,
        max_capacity: parseInt(maxCapacity) || 1,
        color: color || null,
        min_advance_hours: parseInt(minAdvanceHours) || 0,
        is_active: isActive,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('appointment_templates').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Appointment type updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('appointment_templates').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Appointment type created')
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
          <SheetTitle>{editTarget ? 'Edit Appointment Type' : 'Add Appointment Type'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 1-1 PT Session" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} min={1} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Studio A" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Colour</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
              />
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                className="font-mono text-sm w-28"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Min advance booking (hours)</Label>
            <Input type="number" value={minAdvanceHours} onChange={e => setMinAdvanceHours(e.target.value)} min={0} />
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
// Session Package Sheet
// ─────────────────────────────────────────────
function SessionPackageSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: SessionPackage | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [sessionCount, setSessionCount] = useState('10')
  const [price, setPrice] = useState('0')
  const [validityDays, setValidityDays] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setIsUnlimited(editTarget.is_unlimited)
        setSessionCount(String(editTarget.session_count))
        setPrice(String(editTarget.price))
        setValidityDays(editTarget.validity_days ? String(editTarget.validity_days) : '')
        setIsActive(editTarget.is_active)
      } else {
        setName(''); setDescription(''); setIsUnlimited(false)
        setSessionCount('10'); setPrice('0'); setValidityDays(''); setIsActive(true)
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
        is_unlimited: isUnlimited,
        session_count: isUnlimited ? 0 : (parseInt(sessionCount) || 10),
        price: parseFloat(price) || 0,
        validity_days: validityDays ? parseInt(validityDays) : null,
        is_active: isActive,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('session_packages').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Package updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('session_packages').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Package created')
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
          <SheetTitle>{editTarget ? 'Edit Package' : 'Add Session Package'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 10-Session Pack" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={2} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Unlimited sessions</Label>
            <Switch checked={isUnlimited} onCheckedChange={setIsUnlimited} />
          </div>
          {!isUnlimited && (
            <div className="flex flex-col gap-1.5">
              <Label>Session count</Label>
              <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} min={1} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Price (£)</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min={0} step={0.01} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Validity (days, optional)</Label>
            <Input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} min={1} placeholder="e.g. 90" />
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
export default function AppointmentsPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderTabs } = usePageActions()
  const [activeTab, setActiveTab] = useState('types')

  const [templates, setTemplates] = useState<AppointmentTemplate[]>([])
  const [packages, setPackages] = useState<SessionPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sheet state
  const [showTypeSheet, setShowTypeSheet] = useState(false)
  const [editTypeTarget, setEditTypeTarget] = useState<AppointmentTemplate | null>(null)
  const [showPackageSheet, setShowPackageSheet] = useState(false)
  const [editPackageTarget, setEditPackageTarget] = useState<SessionPackage | null>(null)

  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletePackageTarget, setDeletePackageTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const label = activeTab === 'types' ? 'Add Appointment Type' : 'Add Package'
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => {
        if (activeTab === 'types') { setEditTypeTarget(null); setShowTypeSheet(true) }
        else { setEditPackageTarget(null); setShowPackageSheet(true) }
      }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        {label}
      </Button>
    )
    setHeaderTabs(
      <div className="inline-flex items-center rounded-md bg-muted/50 p-1 gap-0.5" data-tab-pill style={{ height: 'var(--tab-pill-h)' }}>
        {([['types', 'Appointment Types'], ['packages', 'Session Packages']] as [string, string][]).map(([val, lbl]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={cn('inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-sm transition-all',
              activeTab === val ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >{lbl}</button>
        ))}
      </div>
    )
    return () => { setActions(null); setHeaderTabs(null) }
  }, [setActions, setHeaderTabs, activeTab])

  const fetchAll = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [templatesRes, packagesRes] = await Promise.all([
        supabase
          .from('appointment_templates')
          .select('id, name, description, duration_minutes, location, max_capacity, color, is_active, min_advance_hours')
          .eq('trainer_id', user.id)
          .order('name'),
        supabase
          .from('session_packages')
          .select('id, name, description, session_count, price, validity_days, is_unlimited, is_active')
          .eq('trainer_id', user.id)
          .order('name'),
      ])
      if (templatesRes.data) setTemplates(templatesRes.data as AppointmentTemplate[])
      if (packagesRes.data) setPackages(packagesRes.data as SessionPackage[])
    } catch (err) {
      logger.error('Error fetching appointments data:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [user])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('appointment-templates-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointment_templates',
        filter: `trainer_id=eq.${user.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('appointment_templates').delete().eq('id', deleteTemplateTarget.id)
      if (error) throw error
      setTemplates(prev => prev.filter(t => t.id !== deleteTemplateTarget.id))
      toast.success('Appointment type deleted')
      setDeleteTemplateTarget(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const handleDeletePackage = async () => {
    if (!deletePackageTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('session_packages').delete().eq('id', deletePackageTarget.id)
      if (error) throw error
      setPackages(prev => prev.filter(p => p.id !== deletePackageTarget.id))
      toast.success('Package deleted')
      setDeletePackageTarget(null)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const fmt = (n: number) => `£${n.toFixed(2)}`

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* ── Appointment Types ── */}
      {activeTab === 'types' && (<>
          {loading ? (
            <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No appointment types yet"
              description="Define your appointment types here — clients can then book them from the app."
              action={
                <Button variant="outline" onClick={() => { setEditTypeTarget(null); setShowTypeSheet(true) }}>
                  <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Appointment Type
                </Button>
              }
            />
          ) : (
            <Card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-4 w-9">
                        <div className="h-7 w-7 flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium">Name</TableHead>
                      <TableHead className="text-xs font-medium">Duration</TableHead>
                      <TableHead className="text-xs font-medium">Capacity</TableHead>
                      <TableHead className="text-xs font-medium">Location</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((tmpl) => (
                      <TableRow key={tmpl.id} className="hover:bg-muted/30">
                        <TableCell className="py-3 pl-4 w-9">
                          <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium">{tmpl.name}</p>
                          {tmpl.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tmpl.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /><span>{tmpl.duration_minutes}min</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /><span>{tmpl.max_capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {tmpl.location ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /><span>{tmpl.location}</span>
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={tmpl.is_active ? 'default' : 'secondary'} className="text-xs">
                            {tmpl.is_active ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => { setEditTypeTarget(tmpl); setShowTypeSheet(true) }}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTemplateTarget({ id: tmpl.id, name: tmpl.name })}>Delete</DropdownMenuItem>
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
        </>)}

      {/* ── Session Packages ── */}
      {activeTab === 'packages' && (<>
          {loading ? (
            <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : packages.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No session packages yet"
              description="Create session packages — bundles of PT sessions clients can buy upfront."
              action={
                <Button variant="outline" onClick={() => { setEditPackageTarget(null); setShowPackageSheet(true) }}>
                  <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Package
                </Button>
              }
            />
          ) : (
            <Card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-medium">Package</TableHead>
                    <TableHead className="text-xs font-medium">Sessions</TableHead>
                    <TableHead className="text-xs font-medium">Price</TableHead>
                    <TableHead className="text-xs font-medium">Validity</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id} className="hover:bg-muted/30">
                      <TableCell className="py-3">
                        <p className="text-sm font-medium">{pkg.name}</p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pkg.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {pkg.is_unlimited
                          ? <Badge variant="outline" className="bg-card text-xs">Unlimited</Badge>
                          : <span className="text-sm">{pkg.session_count}</span>
                        }
                      </TableCell>
                      <TableCell className="py-3 text-sm">{fmt(pkg.price)}</TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {pkg.validity_days ? `${pkg.validity_days} days` : '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={pkg.is_active ? 'default' : 'secondary'} className="text-xs">
                          {pkg.is_active ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => { setEditPackageTarget(pkg); setShowPackageSheet(true) }}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletePackageTarget({ id: pkg.id, name: pkg.name })}>Delete</DropdownMenuItem>
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
        </>)}

      {/* Sheets */}
      <AppointmentTypeSheet
        open={showTypeSheet}
        onOpenChange={setShowTypeSheet}
        editTarget={editTypeTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchAll}
      />
      <SessionPackageSheet
        open={showPackageSheet}
        onOpenChange={setShowPackageSheet}
        editTarget={editPackageTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchAll}
      />

      <DeleteConfirmDialog
        open={!!deleteTemplateTarget}
        onOpenChange={(open) => { if (!open) setDeleteTemplateTarget(null) }}
        itemName={deleteTemplateTarget?.name ?? ''}
        itemKind="appointment type"
        cascadeWarning="Any scheduled appointments of this type will also be removed."
        onConfirm={handleDeleteTemplate}
        loading={deleting}
      />
      <DeleteConfirmDialog
        open={!!deletePackageTarget}
        onOpenChange={(open) => { if (!open) setDeletePackageTarget(null) }}
        itemName={deletePackageTarget?.name ?? ''}
        itemKind="session package"
        onConfirm={handleDeletePackage}
        loading={deleting}
      />
    </div>
  )
}
