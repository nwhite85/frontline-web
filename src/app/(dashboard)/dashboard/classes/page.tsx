'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Search, Plus, MoreHorizontal, BookOpen, CreditCard, Clock, Users, Zap } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface ClassTemplate {
  id: string
  name: string
  description?: string
  duration_minutes: number
  max_capacity: number
  location?: string
  location_type: string
  price: number
  skill_level: string
  is_active: boolean
}

interface MembershipPlan {
  id: string
  name: string
  description?: string
  plan_type: string
  billing_period: string | null
  price: number
  is_active: boolean
  is_highlighted: boolean
  includes_personal_training: boolean
  includes_classes: boolean
}

// ─────────────────────────────────────────────
// Class Sheet
// ─────────────────────────────────────────────
function ClassSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: ClassTemplate | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('60')
  const [maxCapacity, setMaxCapacity] = useState('10')
  const [location, setLocation] = useState('')
  const [locationType, setLocationType] = useState('in-person')
  const [price, setPrice] = useState('0')
  const [skillLevel, setSkillLevel] = useState('all')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setDuration(String(editTarget.duration_minutes))
        setMaxCapacity(String(editTarget.max_capacity))
        setLocation(editTarget.location || '')
        setLocationType(editTarget.location_type || 'in-person')
        setPrice(String(editTarget.price))
        setSkillLevel(editTarget.skill_level || 'all')
        setIsActive(editTarget.is_active)
      } else {
        setName(''); setDescription(''); setDuration('60'); setMaxCapacity('10')
        setLocation(''); setLocationType('in-person'); setPrice('0')
        setSkillLevel('all'); setIsActive(true)
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
        max_capacity: parseInt(maxCapacity) || 10,
        location: location || null,
        location_type: locationType,
        price: parseFloat(price) || 0,
        skill_level: skillLevel,
        is_active: isActive,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('classes').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Class type updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('classes').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Class type created')
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
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Class Type' : 'Add Class Type'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HIIT Class" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={3} />
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
            <Label>Location Type</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Price (£)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min={0} step={0.01} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
// Plan Sheet
// ─────────────────────────────────────────────
function PlanSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
  defaultPlanType,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: MembershipPlan | null
  trainerId: string
  onSaved: () => void
  defaultPlanType?: string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [planType, setPlanType] = useState(defaultPlanType || 'recurring')
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [price, setPrice] = useState('0')
  const [includesClasses, setIncludesClasses] = useState(true)
  const [includesPT, setIncludesPT] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setDescription(editTarget.description || '')
        setPlanType(editTarget.plan_type || defaultPlanType || 'recurring')
        setBillingPeriod(editTarget.billing_period || 'monthly')
        setPrice(String(editTarget.price))
        setIncludesClasses(editTarget.includes_classes)
        setIncludesPT(editTarget.includes_personal_training)
        setIsActive(editTarget.is_active)
        setIsHighlighted(editTarget.is_highlighted)
      } else {
        setName(''); setDescription('')
        setPlanType(defaultPlanType || 'recurring')
        setBillingPeriod('monthly'); setPrice('0')
        setIncludesClasses(true); setIncludesPT(false)
        setIsActive(true); setIsHighlighted(false)
      }
      setFormError('')
    }
  }, [open, editTarget, defaultPlanType])

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        plan_type: planType,
        billing_period: planType === 'recurring' ? billingPeriod : null,
        price: parseFloat(price) || 0,
        includes_classes: includesClasses,
        includes_personal_training: includesPT,
        is_active: isActive,
        is_highlighted: isHighlighted,
      }
      if (editTarget) {
        // @ts-ignore
        const { error } = await supabase.from('membership_plans').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Plan updated')
      } else {
        // @ts-ignore
        const { error } = await supabase.from('membership_plans').insert({ ...payload, trainer_id: trainerId })
        if (error) throw error
        toast.success('Plan created')
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
          <SheetTitle>{editTarget ? 'Edit Plan' : defaultPlanType === 'drop_in' ? 'Add Pay & Go' : 'Add Plan'}</SheetTitle>
          <SheetDescription>Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto flex-1">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Membership" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Plan Type</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="credit_package">Credit Package</SelectItem>
                <SelectItem value="drop_in">Drop-in</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {planType === 'recurring' && (
            <div className="flex flex-col gap-1.5">
              <Label>Billing Period</Label>
              <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Price (£)</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min={0} step={0.01} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Includes Classes</Label>
            <Switch checked={includesClasses} onCheckedChange={setIncludesClasses} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Includes Personal Training</Label>
            <Switch checked={includesPT} onCheckedChange={setIncludesPT} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Feature this plan</Label>
            <Switch checked={isHighlighted} onCheckedChange={setIsHighlighted} />
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
// PlanCard (helper)
// ─────────────────────────────────────────────
function PlanCard({
  plan,
  onEditRequest,
  onDeleteRequest,
  fmt,
}: {
  plan: MembershipPlan
  onEditRequest: (plan: MembershipPlan) => void
  onDeleteRequest: (target: { id: string; name: string }) => void
  fmt: (n: number) => string
}) {
  return (
    <Card className={plan.is_highlighted ? 'ring-1 ring-primary' : ''}>
      <CardHeader className="pb-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {plan.plan_type?.replace(/_/g, ' ')}
              {plan.billing_period ? ` · ${plan.billing_period}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {plan.is_highlighted && <Badge className="text-xs">Featured</Badge>}
            <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
              {plan.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-bold">
          {fmt(plan.price)}
          {plan.billing_period === 'monthly' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
          {plan.billing_period === 'weekly' && <span className="text-sm font-normal text-muted-foreground">/wk</span>}
        </p>
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{plan.description}</p>
        )}
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {plan.includes_classes && <Badge variant="outline" className="text-xs">Classes</Badge>}
            {plan.includes_personal_training && <Badge variant="outline" className="text-xs">PT</Badge>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditRequest(plan)}>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteRequest({ id: plan.id, name: plan.name })}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ClassesPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderTabs, setHeaderSearch } = usePageActions()
  const [activeTab, setActiveTab] = useState('classes')

  const [classes, setClasses] = useState<ClassTemplate[]>([])
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig<ClassTemplate> | null>({ key: 'name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  // Class sheet state
  const [showClassSheet, setShowClassSheet] = useState(false)
  const [editClassTarget, setEditClassTarget] = useState<ClassTemplate | null>(null)

  // Plan sheet state
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [editPlanTarget, setEditPlanTarget] = useState<MembershipPlan | null>(null)
  const [planSheetDefaultType, setPlanSheetDefaultType] = useState<string>('recurring')

  // Delete state
  const [deleteClassTarget, setDeleteClassTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletePlanTarget, setDeletePlanTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openAddSheet = () => {
    if (activeTab === 'classes') {
      setEditClassTarget(null)
      setShowClassSheet(true)
    } else if (activeTab === 'paygo') {
      setEditPlanTarget(null)
      setPlanSheetDefaultType('drop_in')
      setShowPlanSheet(true)
    } else {
      setEditPlanTarget(null)
      setPlanSheetDefaultType('recurring')
      setShowPlanSheet(true)
    }
  }

  useEffect(() => {
    const label = activeTab === 'classes' ? 'Add Class Type' : activeTab === 'paygo' ? 'Add Pay & Go' : 'Add Plan'
    setActions(
      <Button variant="outline" className="bg-card" onClick={openAddSheet}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        {label}
      </Button>
    )
    setHeaderTabs(
      <div className="inline-flex items-center rounded-md bg-muted/50 p-1 gap-0.5" data-tab-pill style={{ height: 'var(--tab-pill-h)' }}>
        {([['classes', 'Class Types'], ['plans', 'Membership Plans'], ['paygo', 'Pay & Go']] as [string, string][]).map(([val, lbl]) => (
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

  useEffect(() => {
    if (activeTab !== 'classes') {
      setHeaderSearch(null)
      return
    }
    setHeaderSearch(
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search class types…"
          className="pl-8 h-8 text-sm w-52 bg-card border-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [activeTab, search, setHeaderSearch])

  const fetchAll = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [classesRes, plansRes] = await Promise.all([
        supabase
          .from('classes')
          .select('id, name, description, duration_minutes, max_capacity, location, location_type, price, skill_level, is_active')
          .eq('trainer_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('membership_plans')
          .select('id, name, description, plan_type, billing_period, price, is_active, is_highlighted, includes_personal_training, includes_classes')
          .eq('trainer_id', user.id)
          .order('display_order', { ascending: true }),
      ])
      if (classesRes.data) setClasses(classesRes.data as ClassTemplate[])
      if (plansRes.data) setPlans(plansRes.data as MembershipPlan[])
    } catch (err) {
      logger.error('Error fetching classes data:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [user])

  const handleDeleteClass = async () => {
    if (!deleteClassTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('classes').delete().eq('id', deleteClassTarget.id)
      if (error) throw error
      setClasses(prev => prev.filter(c => c.id !== deleteClassTarget.id))
      toast.success('Class type deleted')
      setDeleteClassTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('membership_plans').delete().eq('id', deletePlanTarget.id)
      if (error) throw error
      setPlans(prev => prev.filter(p => p.id !== deletePlanTarget.id))
      toast.success('Plan deleted')
      setDeletePlanTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const fmt = (n: number) => `£${n.toFixed(2)}`

  const handleSort = (key: keyof ClassTemplate) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key as string, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  const filteredClasses = classes.filter(cls => {
    if (!search) return true
    const q = search.toLowerCase()
    return cls.name.toLowerCase().includes(q) || (cls.location || '').toLowerCase().includes(q) || (cls.description || '').toLowerCase().includes(q)
  })
  const sortedClasses = sortData(filteredClasses, sortConfig)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sortedClasses.length / pageSize))
  const paginatedClasses = pageSize === Infinity ? sortedClasses : sortedClasses.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* ── Classes ── */}
      {activeTab === 'classes' && (<>
          {loading ? (
            <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No class types yet"
              description="Define your class types here — then schedule them from the Schedule page."
              action={
                <Button variant="outline" onClick={() => { setEditClassTarget(null); setShowClassSheet(true) }}>
                  <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Class Type
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
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium">
                        <SortButton
                          label="Name"
                          direction={sortConfig?.key === 'name' ? sortConfig.direction : null}
                          onClick={() => handleSort('name')}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-medium">Duration</TableHead>
                      <TableHead className="text-xs font-medium">Capacity</TableHead>
                      <TableHead className="text-xs font-medium">Price</TableHead>
                      <TableHead className="text-xs font-medium">Level</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClasses.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-muted/30">
                        <TableCell className="py-3 pl-4 w-9">
                          <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-500/20">
                            <BookOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium">{cls.name}</p>
                          {cls.location && (
                            <p className="text-xs text-muted-foreground mt-0.5">{cls.location}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{cls.duration_minutes}min</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{cls.max_capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm">{fmt(cls.price)}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="bg-card text-xs capitalize">{cls.skill_level}</Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={cls.is_active ? 'default' : 'secondary'} className="text-xs">
                            {cls.is_active ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => { setEditClassTarget(cls); setShowClassSheet(true) }}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteClassTarget({ id: cls.id, name: cls.name })}
                              >
                                Delete
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

          {filteredClasses.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
              <span>{sortedClasses.length} class types</span>
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
        </>)}

      {/* ── Membership Plans ── */}
      {activeTab === 'plans' && (<>
          {(() => {
            const membershipPlans = plans.filter(p => p.plan_type === 'recurring' || p.plan_type === 'hybrid')
            return loading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : membershipPlans.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No membership plans"
                description="Create recurring membership plans for clients who train regularly."
                action={
                  <Button variant="outline" onClick={() => { setEditPlanTarget(null); setPlanSheetDefaultType('recurring'); setShowPlanSheet(true) }}>
                    <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Plan
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {membershipPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEditRequest={(p) => { setEditPlanTarget(p); setPlanSheetDefaultType(p.plan_type); setShowPlanSheet(true) }}
                    onDeleteRequest={setDeletePlanTarget}
                    fmt={fmt}
                  />
                ))}
              </div>
            )
          })()}
        </>)}

      {/* ── Pay & Go ── */}
      {activeTab === 'paygo' && (<>
          {(() => {
            const paygoPlans = plans.filter(p => p.plan_type === 'credit_package' || p.plan_type === 'drop_in')
            return loading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : paygoPlans.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No Pay & Go options"
                description="Add drop-in prices or credit packages for clients who don't want a subscription."
                action={
                  <Button variant="outline" onClick={() => { setEditPlanTarget(null); setPlanSheetDefaultType('drop_in'); setShowPlanSheet(true) }}>
                    <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />{'Add Pay & Go'}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {paygoPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEditRequest={(p) => { setEditPlanTarget(p); setPlanSheetDefaultType(p.plan_type); setShowPlanSheet(true) }}
                    onDeleteRequest={setDeletePlanTarget}
                    fmt={fmt}
                  />
                ))}
              </div>
            )
          })()}
        </>)}

      {/* Sheets */}
      <ClassSheet
        open={showClassSheet}
        onOpenChange={setShowClassSheet}
        editTarget={editClassTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchAll}
      />
      <PlanSheet
        open={showPlanSheet}
        onOpenChange={setShowPlanSheet}
        editTarget={editPlanTarget}
        trainerId={user?.id ?? ''}
        onSaved={fetchAll}
        defaultPlanType={planSheetDefaultType}
      />

      {/* Delete dialogs */}
      <DeleteConfirmDialog
        open={!!deleteClassTarget}
        onOpenChange={(open) => { if (!open) setDeleteClassTarget(null) }}
        itemName={deleteClassTarget?.name ?? ''}
        itemKind="class type"
        cascadeWarning="Any scheduled sessions using this class type will also be removed from the schedule."
        onConfirm={handleDeleteClass}
        loading={deleting}
      />
      <DeleteConfirmDialog
        open={!!deletePlanTarget}
        onOpenChange={(open) => { if (!open) setDeletePlanTarget(null) }}
        itemName={deletePlanTarget?.name ?? ''}
        itemKind="plan"
        onConfirm={handleDeletePlan}
        loading={deleting}
      />
    </div>
  )
}
