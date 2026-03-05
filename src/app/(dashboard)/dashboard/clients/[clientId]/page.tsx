'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Mail, Phone, Calendar, Edit2, Activity, Dumbbell, TrendingUp,
  CreditCard, Trophy, Zap, Package, BookOpen, Clock, StickyNote,
  Plus, UserCircle, MoreHorizontal, Search, Camera, Scale, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { getClientRiskLevel } from '@/utils/clientCompliance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  bio?: string | null
  date_of_birth?: string | null
  daily_calorie_goal?: number | null
  status?: string | null
  is_active?: boolean
  created_at: string
  last_activity_date?: string | null
  membership_status?: string | null
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

function EditClientSheet({
  open, onOpenChange, client, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; client: ClientProfile; onSaved: (c: ClientProfile) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date_of_birth: '', bio: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ name: client.name ?? '', email: client.email ?? '', phone: client.phone ?? '', date_of_birth: client.date_of_birth ?? '', bio: client.bio ?? '', status: client.status ?? 'Active' })
      setError(null)
    }
  }, [open, client])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('user_profiles')
        .update({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, date_of_birth: form.date_of_birth || null, bio: form.bio.trim() || null, status: form.status || null })
        .eq('id', client.id).select().single()
      if (err) throw err
      onSaved(data as ClientProfile)
      onOpenChange(false)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader><SheetTitle>Edit Client</SheetTitle></SheetHeader>
        <SheetBody>
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['Active', 'At Risk', 'Disengaged', 'Inactive', 'Archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5"><Label>Notes / Bio</Label><Textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Optional notes…" /></div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Profile Header ────────────────────────────────────────────────────────────

function SetupLinkButton({ email }: { email: string }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSend = async () => {
    setSending(true); setErr(null)
    try {
      const res = await fetch('/api/send-password-reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    } catch (e: any) { setErr(e.message) } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button
        variant="outline"
       
        className="h-7 text-xs shrink-0 bg-card"
        onClick={handleSend}
        disabled={sending}
      >
        <Mail className="h-3 w-3 mr-1.5" />
        {sending ? 'Sending…' : sent ? 'Sent!' : 'Send Setup Link'}
      </Button>
      {err && <p className="text-[0.65rem] text-destructive">{err}</p>}
    </div>
  )
}

interface ProfileHeaderActions {
  refreshKey?: number
  onEdit?: () => void
  onAddMembership?: () => void
  onChangeMembership?: () => void
  onRemoveMembership?: () => void
  onAddPayment?: () => void
  onRemovePayment?: () => void
  onGoToPrograms?: () => void
  onGoToBilling?: () => void
}

function ProfileHeader({ client, loading, refreshKey, onEdit, onAddMembership, onChangeMembership, onRemoveMembership, onAddPayment, onRemovePayment, onGoToPrograms, onGoToBilling }: { client: ClientProfile | null; loading: boolean } & ProfileHeaderActions) {
  const [stats, setStats] = useState<{ membership: any; sessionTotal: number; sessionRemaining: number; programs: { title: string }[]; defaultPaymentMethod: any } | null>(null)

  useEffect(() => {
    if (!client?.id) return
    Promise.allSettled([
      supabase.from('client_memberships').select('*, membership_plans(name, price, billing_period)').eq('client_id', client.id).eq('status', 'active').maybeSingle(),
      supabase.from('client_package_purchases').select('sessions_remaining, session_packages(total_sessions, is_unlimited)').eq('client_id', client.id).eq('status', 'active'),
      supabase.from('client_programs').select('program:programs(title)').eq('client_id', client.id).eq('status', 'active'),
    ]).then(([mem, pkg, prog]) => {
      const membership = mem.status === 'fulfilled' ? mem.value.data : null
      const packages = pkg.status === 'fulfilled' ? (pkg.value.data || []) : []
      const programs = prog.status === 'fulfilled'
        ? (prog.value.data || []).map((p: any) => p.program).filter(Boolean)
        : []
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`payment-methods-${client.id}`) : null
      const methods = stored ? JSON.parse(stored) : []
      const defaultPaymentMethod = methods.find((m: any) => m.isDefault) ?? methods[0] ?? null
      const sessionRemaining = packages.reduce((s: number, p: any) => {
        if (p.session_packages?.is_unlimited) return s
        return s + (p.sessions_remaining ?? 0)
      }, 0)
      const hasUnlimited = packages.some((p: any) => p.session_packages?.is_unlimited)
      setStats({ membership, sessionTotal: hasUnlimited ? -1 : sessionRemaining, sessionRemaining: hasUnlimited ? -1 : sessionRemaining, programs, defaultPaymentMethod })
    })
  }, [client?.id, refreshKey])

  if (loading) return (
    <Card className="mx-6 mt-6" style={{ borderRadius: 'var(--table-radius)' }}>
      <CardContent className="px-4 py-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </CardContent>
    </Card>
  )
  if (!client) return null

  const risk = getClientRiskLevel(client.last_activity_date)
  const nameParts = (client.name ?? '').trim().split(/\s+/).filter(Boolean)
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] ?? '?').toUpperCase()

  const memPlan = stats?.membership?.membership_plans
  const sessionLabel = stats?.sessionRemaining === -1 ? 'Unlimited' : stats ? `${stats.sessionRemaining} left` : '—'
  const sessionSub = stats?.sessionRemaining === -1 ? 'Package' : stats?.sessionRemaining === 0 ? 'No sessions' : 'Sessions'

  return (
    <Card className="mx-6 mt-6" style={{ borderRadius: 'var(--table-radius)' }}>
      <CardContent className="px-4 py-0">
      {/* Profile row: avatar left, details centre, edit right */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
          {initials}
        </div>

        {/* Name + contact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold leading-tight">{client.name}</h2>
            <Badge variant={risk.level === 'active' ? 'default' : risk.level === 'inactive' ? 'secondary' : 'secondary'} className="text-xs">
              {risk.label}
            </Badge>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {client.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[180px]">{client.email}</span>
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                {client.phone}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              Since {format(new Date(client.created_at), 'MMM yyyy')}
            </span>
            {client.last_activity_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3 shrink-0" />
                {formatDistanceToNow(new Date(client.last_activity_date), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Send Setup Link */}
        {client?.email && (
          <SetupLinkButton email={client.email} />
        )}
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        {/* Membership */}
        {/* ── Membership ── */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wide">Membership</p>
            {memPlan ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1"><MoreHorizontal className="h-3 w-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onChangeMembership}>Change Plan</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemoveMembership}>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={onAddMembership}><Plus className="h-3 w-3" /></Button>
            )}
          </div>
          {memPlan ? (
            <>
              <p className="text-sm font-semibold mt-0.5 truncate">{memPlan.name}</p>
              {memPlan.price && <p className="text-xs text-muted-foreground">£{memPlan.price.toFixed(2)}/{memPlan.billing_period ?? 'mo'}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">No plan</p>
          )}
        </div>

        {/* ── Sessions ── */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wide">Sessions</p>
            {stats?.sessionRemaining !== undefined && stats.sessionRemaining > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1"><MoreHorizontal className="h-3 w-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onGoToBilling}>Add Package</DropdownMenuItem>
                  <DropdownMenuItem onClick={onGoToBilling}>View All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={onGoToBilling}><Plus className="h-3 w-3" /></Button>
            )}
          </div>
          {stats?.sessionRemaining !== undefined && stats.sessionRemaining !== 0 ? (
            <>
              <p className="text-sm font-semibold mt-0.5">{sessionLabel}</p>
              <p className="text-xs text-muted-foreground">{sessionSub}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">No package</p>
          )}
        </div>

        {/* ── Programs ── */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wide">Programs</p>
            {stats?.programs?.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1"><MoreHorizontal className="h-3 w-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onGoToPrograms}>Assign Another</DropdownMenuItem>
                  <DropdownMenuItem onClick={onGoToPrograms}>View All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={onGoToPrograms}><Plus className="h-3 w-3" /></Button>
            )}
          </div>
          {stats?.programs?.length ? (
            <>
              <p className="text-sm font-semibold mt-0.5 truncate">{stats.programs[0].title}</p>
              {stats.programs.length > 1 && (
                <p className="text-xs text-muted-foreground">+{stats.programs.length - 1} more</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">None assigned</p>
          )}
        </div>

        {/* ── Payment ── */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wide">Payment</p>
            {stats?.defaultPaymentMethod ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1"><MoreHorizontal className="h-3 w-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onAddPayment}>Change Method</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemovePayment}>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={onAddPayment}><Plus className="h-3 w-3" /></Button>
            )}
          </div>
          {stats?.defaultPaymentMethod ? (
            <>
              <p className="text-sm font-semibold mt-0.5 capitalize">{stats.defaultPaymentMethod.cardType ?? 'Card'} ····{stats.defaultPaymentMethod.lastFour}</p>
              <p className="text-xs text-muted-foreground">Default</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">None on file</p>
          )}
        </div>
      </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ client, userId, onEdit }: { client: ClientProfile; userId: string; onEdit?: () => void }) {
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const results = await Promise.allSettled([
        supabase.from('forms').select('id, title, type').eq('trainer_id', userId).order('created_at', { ascending: false }).limit(8),
      ])

      if (results[0].status === 'fulfilled') setForms(results[0].value.data || [])

      const bookings: any[] = []
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: apts } = await (supabase as any).from('appointments').select('id, appointment_date, start_time, status').eq('client_id', client.id).order('appointment_date', { ascending: false }).limit(5)
        if (apts) (apts as any[]).forEach((a: any) => bookings.push({ id: a.id, title: 'PT Session', date: a.appointment_date, status: a.status, type: 'appointment' }))
      } catch {}
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cb } = await (supabase as any).from('class_bookings').select('id, booking_status, created_at, class_schedule:class_schedules(scheduled_at, class:classes(name))').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5)
        if (cb) (cb as any[]).forEach((b: any) => bookings.push({ id: b.id, title: (b.class_schedule as any)?.class?.name ?? 'Class', date: (b.class_schedule as any)?.scheduled_at ?? b.created_at, status: b.booking_status, type: 'class' }))
      } catch {}
      bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentBookings(bookings.slice(0, 5))

      setLoading(false)
    }
    fetch()
  }, [client.id, userId])

  const addNote = async () => {
    if (!note.trim()) return
    setSavingNote(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_notes').insert({ client_id: client.id, trainer_id: userId, content: note.trim() })
      setNote('')
    } catch {} finally { setSavingNote(false) }
  }

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
    </div>
  )


  return (
    <div className="flex flex-col gap-4">

      {/* Details + Quick Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <Card className="h-full">
          <CardContent className="px-4 py-0 flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</p>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground" onClick={() => onEdit?.()}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
            {client.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span>{client.phone}</span></div>}
            {client.date_of_birth && <div className="flex items-center gap-2 text-sm"><Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span>{format(new Date(client.date_of_birth), 'dd MMM yyyy')}</span></div>}
            {client.daily_calorie_goal && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{client.daily_calorie_goal} kcal / day</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span>{client.last_activity_date ? formatDistanceToNow(new Date(client.last_activity_date), { addSuffix: true }) : 'No activity'}</span>
            </div>
            {client.bio && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{client.bio}</p>}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="px-4 py-0 flex flex-col gap-2 h-full">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Note</p>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 min-h-0 resize-none"
              placeholder="Add a note about this client…"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
            />
            <div className="flex justify-end">
              <Button onClick={addNote} disabled={savingNote || !note.trim()}>{savingNote ? 'Saving…' : 'Add Note'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <Card>
          <CardContent className="px-4 py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Bookings</p>
            <div className="flex flex-col gap-1.5">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    {b.type === 'class' ? <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className="font-medium">{b.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(b.date), 'dd MMM')}</span>
                    <Badge variant={b.status === 'confirmed' || b.status === 'attended' || b.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs capitalize">{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms */}
      {forms.length > 0 && (
        <Card>
          <CardContent className="px-4 py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Forms Available</p>
            <div className="flex flex-wrap gap-1.5">
              {forms.map(f => (
                <a key={f.id} href={`/dashboard/forms/${f.id}`}>
                  <Badge variant="outline" className="bg-card text-xs cursor-pointer hover:bg-muted">{f.title}</Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

// ─── Tab: Programs ─────────────────────────────────────────────────────────────

function ProgramsTab({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const [programs, setPrograms] = useState<any[]>([])
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Assign sheets state
  const [showAssignProgram, setShowAssignProgram] = useState(false)
  const [showAssignWorkout, setShowAssignWorkout] = useState(false)
  const [allPrograms, setAllPrograms] = useState<any[]>([])
  const [allWorkouts, setAllWorkouts] = useState<any[]>([])
  const [programSearch, setProgramSearch] = useState('')
  const [workoutSearch, setWorkoutSearch] = useState('')
  const [assigning, setAssigning] = useState(false)

  const loadAssigned = useCallback(() => {
    return Promise.allSettled([
      supabase.from('client_programs').select('id, status, created_at, program:programs(id, title, duration_weeks)').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('client_workouts').select('id, status, created_at, workout:workouts(id, name)').eq('client_id', clientId).order('created_at', { ascending: false }),
    ]).then(([p, w]) => {
      if (p.status === 'fulfilled') setPrograms(p.value.data || [])
      if (w.status === 'fulfilled') setWorkouts(w.value.data || [])
      setLoading(false)
    })
  }, [clientId])

  useEffect(() => {
    loadAssigned()
    // Fetch all trainer programs/workouts for assign sheets
    if (trainerId) {
      supabase.from('programs').select('id, title, subtitle, program_type, duration_weeks, training_days_per_week').eq('trainer_id', trainerId)
        .then(({ data }) => setAllPrograms(data || []))
      supabase.from('workouts').select('id, title, estimated_duration').eq('trainer_id', trainerId).eq('is_template', false)
        .then(({ data }) => setAllWorkouts(data || []))
    }
  }, [clientId, trainerId, loadAssigned])

  const assignProgram = async (program: any) => {
    setAssigning(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_programs').insert({
        client_id: clientId,
        program_id: program.id,
        trainer_id: trainerId,
        status: 'active',
        assigned_at: new Date().toISOString(),
      })
      setShowAssignProgram(false)
      setProgramSearch('')
      await loadAssigned()
    } catch {} finally { setAssigning(false) }
  }

  const assignWorkout = async (workout: any) => {
    setAssigning(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_workouts').insert({
        client_id: clientId,
        workout_id: workout.id,
        trainer_id: trainerId,
        status: 'active',
        assigned_at: new Date().toISOString(),
      })
      setShowAssignWorkout(false)
      setWorkoutSearch('')
      await loadAssigned()
    } catch {} finally { setAssigning(false) }
  }

  const removeProgram = async (id: string) => {
    await supabase.from('client_programs').delete().eq('id', id)
    await loadAssigned()
  }

  const removeWorkout = async (id: string) => {
    await supabase.from('client_workouts').delete().eq('id', id)
    await loadAssigned()
  }

  if (loading) return <div className="flex flex-col gap-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>

  const filteredPrograms = allPrograms.filter(p => p.title?.toLowerCase().includes(programSearch.toLowerCase()))
  const filteredWorkouts = allWorkouts.filter(w => (w.title ?? w.name ?? '').toLowerCase().includes(workoutSearch.toLowerCase()))

  return (
    <div className="flex flex-col">

      {/* Programs + Workouts — full-bleed */}
      <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
        <CardContent className="p-0">

          {/* ── Programs group ── */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-medium pl-4">Programs</TableHead>
                <TableHead className="text-xs font-medium w-16">Duration</TableHead>
                <TableHead className="text-xs font-medium w-28">Assigned</TableHead>
                <TableHead className="text-xs font-medium w-24">Status</TableHead>
                <TableHead className="pr-3 w-24 text-right">
                  <Button variant="ghost" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowAssignProgram(true)}>
                    <Plus className="h-3 w-3 mr-1" />Assign
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="pl-4 py-4 text-sm text-muted-foreground">
                    No programs assigned yet
                  </TableCell>
                </TableRow>
              ) : programs.map((cp: any) => (
                <TableRow key={cp.id}>
                  <TableCell className="py-3 text-sm font-medium pl-4">{cp.program?.title ?? 'Unknown'}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{cp.program?.duration_weeks ? `${cp.program.duration_weeks}w` : '—'}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{format(new Date(cp.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="py-3"><Badge variant={cp.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{cp.status}</Badge></TableCell>
                  <TableCell className="py-3 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => removeProgram(cp.id)}>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ── Workouts group ── */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-2 border-border">
                <TableHead className="text-xs font-medium pl-4">Workouts</TableHead>
                <TableHead className="text-xs font-medium w-28">Assigned</TableHead>
                <TableHead className="text-xs font-medium w-24">Status</TableHead>
                <TableHead className="pr-3 w-24 text-right">
                  <Button variant="ghost" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowAssignWorkout(true)}>
                    <Plus className="h-3 w-3 mr-1" />Add
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="pl-4 py-4 text-sm text-muted-foreground">
                    No workouts assigned yet
                  </TableCell>
                </TableRow>
              ) : workouts.map((cw: any) => (
                <TableRow key={cw.id}>
                  <TableCell className="py-3 text-sm font-medium pl-4">{cw.workout?.name ?? cw.workout?.title ?? 'Unknown'}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{format(new Date(cw.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="py-3"><Badge variant={cw.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{cw.status}</Badge></TableCell>
                  <TableCell className="py-3 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => removeWorkout(cw.id)}>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </CardContent>
      </Card>

      {/* Assign Program Sheet */}
      <Sheet open={showAssignProgram} onOpenChange={setShowAssignProgram}>
        <SheetContent className="w-full sm:max-w-md" onOpenAutoFocus={e => e.preventDefault()}>
          <SheetHeader><SheetTitle>Assign Program</SheetTitle></SheetHeader>
          <SheetBody>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search programs…"
                value={programSearch}
                onChange={e => setProgramSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-96">
              {filteredPrograms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No programs found</p>
              )}
              {filteredPrograms.map(p => {
                const meta = [
                  p.program_type && p.program_type !== 'custom' ? p.program_type : null,
                  p.training_days_per_week ? `${p.training_days_per_week}d/wk` : null,
                ].filter(Boolean).join(' · ')
                return (
                  <button
                    key={p.id}
                    disabled={assigning}
                    onClick={() => assignProgram(p)}
                    className="flex items-start justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{p.title}</p>
                      {(p.subtitle || meta) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {p.subtitle || meta}
                        </p>
                      )}
                    </div>
                    {p.duration_weeks && <span className="text-xs text-muted-foreground ml-3 shrink-0 mt-0.5">{p.duration_weeks}w</span>}
                  </button>
                )
              })}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Assign Workout Sheet */}
      <Sheet open={showAssignWorkout} onOpenChange={setShowAssignWorkout}>
        <SheetContent className="w-full sm:max-w-md" onOpenAutoFocus={e => e.preventDefault()}>
          <SheetHeader><SheetTitle>Assign Workout</SheetTitle></SheetHeader>
          <SheetBody>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search workouts…"
                value={workoutSearch}
                onChange={e => setWorkoutSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-96">
              {filteredWorkouts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No workouts found</p>
              )}
              {filteredWorkouts.map(w => (
                <button
                  key={w.id}
                  disabled={assigning}
                  onClick={() => assignWorkout(w)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-left transition-colors"
                >
                  <span className="text-sm font-medium">{w.title ?? w.name}</span>
                  {w.estimated_duration && <span className="text-xs text-muted-foreground">{w.estimated_duration}min</span>}
                </button>
              ))}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ─── Tab: Progress ─────────────────────────────────────────────────────────────

function ProgressTab({ clientId }: { clientId: string }) {
  // ── Body Weight state ──────────────────────────────────────────────────────
  const [bodyweight, setBodyweight] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showLogWeight, setShowLogWeight] = useState(false)
  const [logWeight, setLogWeight] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logNotes, setLogNotes] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Body Measurements state ────────────────────────────────────────────────
  const [measurements, setMeasurements] = useState<Record<string, number>>({})
  const [loadingMeasurements, setLoadingMeasurements] = useState(true)
  const [measurementUnit, setMeasurementUnit] = useState<'inches' | 'cm'>('inches')
  const [showMoreMeasurements, setShowMoreMeasurements] = useState(false)
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // ── Fetch bodyweight ───────────────────────────────────────────────────────
  const loadBodyweight = useCallback(async () => {
    const { data } = await supabase
      .from('bodyweight_entries')
      .select('id, weight, recorded_at, notes')
      .eq('user_id', clientId)
      .order('recorded_at', { ascending: false })
    setBodyweight(data || [])
    setLoading(false)
  }, [clientId])

  // ── Fetch measurements ─────────────────────────────────────────────────────
  const loadMeasurements = useCallback(async () => {
    const { data: rawMeasurements } = await supabase
      .from('body_measurements')
      .select('measurement_type, value, recorded_at')
      .eq('user_id', clientId)
      .order('recorded_at', { ascending: false })
    // Keep only the first (most recent) entry per measurement_type
    const map: Record<string, number> = {}
    const data = rawMeasurements as unknown as Array<{ measurement_type: string; value: number; recorded_at: string }> | null
    for (const row of (data || [])) {
      if (!(row.measurement_type in map)) {
        map[row.measurement_type] = row.value
      }
    }
    setMeasurements(map)
    setLoadingMeasurements(false)
  }, [clientId])

  useEffect(() => {
    loadBodyweight()
    loadMeasurements()
  }, [loadBodyweight, loadMeasurements])

  // ── Log Weight handler ─────────────────────────────────────────────────────
  const handleLogWeight = async () => {
    if (!logWeight) return
    setSavingWeight(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('bodyweight_entries').insert({
        user_id: clientId,
        weight: Number(logWeight),
        recorded_at: logDate,
        notes: logNotes || null,
      })
      setShowLogWeight(false)
      setLogWeight('')
      setLogNotes('')
      setLogDate(new Date().toISOString().split('T')[0])
      await loadBodyweight()
    } catch {}
    finally { setSavingWeight(false) }
  }

  // ── Open measurement history ───────────────────────────────────────────────
  const openMeasurementHistory = async (type: string) => {
    setHistoryFor(type)
    setLoadingHistory(true)
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', clientId)
      .eq('measurement_type', type)
      .order('recorded_at', { ascending: false })
      .limit(20)
    setMeasurementHistory(data || [])
    setLoadingHistory(false)
  }

  // ── SVG Sparkline ──────────────────────────────────────────────────────────
  const chartEntries = [...bodyweight].reverse().slice(-6)
  const renderWeightChart = () => {
    if (bodyweight.length < 2) {
      return (
        <p className="text-xs text-muted-foreground text-center py-4">
          Add at least 2 entries to see chart
        </p>
      )
    }
    const W = 300, H = 160, PAD = 20
    const weights = chartEntries.map(e => e.weight)
    const minW = Math.min(...weights)
    const maxW = Math.max(...weights)
    const range = maxW - minW || 1
    const toX = (i: number) => PAD + (i / (chartEntries.length - 1)) * (W - PAD * 2)
    const toY = (w: number) => PAD + (1 - (w - minW) / range) * (H - PAD * 2 - 20)

    // Build cubic bezier path
    const points = chartEntries.map((e, i) => ({ x: toX(i), y: toY(e.weight) }))
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
    }

    const current = bodyweight[0]
    const prev = bodyweight[1]
    const diff = current && prev ? (current.weight - prev.weight) : 0
    const isLoss = diff < 0

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{current?.weight} lbs</span>
          {diff !== 0 && (
            <Badge variant={isLoss ? 'default' : 'secondary'} className={isLoss ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)} lbs
            </Badge>
          )}
        </div>
        <svg width={W} height={H} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = PAD + (i / 4) * (H - PAD * 2 - 20)
            return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="currentColor" strokeWidth={0.5} className="text-border opacity-40" />
          })}
          {/* Bezier path */}
          <path d={d} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2} />
          {/* Dots */}
          {points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={3} fill="currentColor" className="text-primary" />
          ))}
          {/* X-axis date labels */}
          {chartEntries.map((e, i) => (
            <text
              key={i}
              x={toX(i)}
              y={H - 2}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {format(new Date(e.recorded_at), 'MMM d')}
            </text>
          ))}
        </svg>
      </div>
    )
  }

  // ── Measurement positions ──────────────────────────────────────────────────
  const defaultMeasurements = [
    { type: 'Chest', style: { top: '70px', left: '8px' } },
    { type: 'Left Bicep', style: { top: '105px', right: '8px' } },
    { type: 'Waist', style: { top: '140px', left: '8px' } },
    { type: 'Hips', style: { top: '160px', right: '8px' } },
    { type: 'Right Thigh', style: { top: '200px', left: '8px' } },
    { type: 'Left Calf', style: { top: '240px', right: '8px' } },
  ]
  const extraMeasurements = [
    { type: 'Neck', style: { top: '60px', right: '8px' } },
    { type: 'Right Bicep', style: { top: '105px', left: '8px' } },
    { type: 'Left Thigh', style: { top: '200px', right: '8px' } },
    { type: 'Right Calf', style: { top: '240px', left: '8px' } },
  ]
  const visibleMeasurements = showMoreMeasurements
    ? [...defaultMeasurements, ...extraMeasurements]
    : defaultMeasurements

  const unitSuffix = measurementUnit === 'inches' ? '"' : ' cm'
  const formatMeasurementValue = (type: string) => {
    const val = measurements[type]
    if (val == null) return '--'
    return `${val}${unitSuffix}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Left: Body Weight ─────────────────────────────────────────────── */}
        <Card>
          <CardContent className="px-4 py-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body Weight</p>
              <Button variant="outline" className="h-7 text-xs" onClick={() => setShowLogWeight(true)}>
                <Plus className="h-3 w-3 mr-1" />Log Weight
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <>
                {renderWeightChart()}

                {/* History toggle */}
                {bodyweight.length > 0 && (
                  <div className="mt-3">
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowHistory(h => !h)}
                    >
                      {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showHistory ? 'Hide' : 'Show'} history ({bodyweight.length})
                    </button>
                    {showHistory && (
                      <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {bodyweight.map((e: any) => (
                          <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                            <Scale className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{e.weight} lbs</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(e.recorded_at), 'dd MMM yyyy')}</span>
                            {e.notes && <span className="text-xs text-muted-foreground truncate">· {e.notes}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Body Measurements ────────────────────────────────────── */}
        <Card>
          <CardContent className="px-4 py-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Body Measurements</p>

            {loadingMeasurements ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                {/* Body outline with overlay buttons */}
                <div className="relative">
                  <img src="/body-outline.png" className="w-64 h-auto" alt="Body outline" />
                  {visibleMeasurements.map(({ type, style }) => (
                    <button
                      key={type}
                      style={{ position: 'absolute', ...style }}
                      className="bg-card border border-primary rounded px-2 py-0.5 font-medium cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => openMeasurementHistory(type)}
                    >
                      {type}: {formatMeasurementValue(type)}
                    </button>
                  ))}
                </div>

                {/* Controls below image */}
                <div className="flex gap-2">
                  <Button
                   
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => setShowMoreMeasurements(s => !s)}
                  >
                    {showMoreMeasurements ? 'Show Less' : 'Show More'}
                  </Button>
                  <Button
                   
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => setMeasurementUnit(u => u === 'inches' ? 'cm' : 'inches')}
                  >
                    {measurementUnit === 'inches' ? 'Switch to CM' : 'Switch to Inches'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Progress Photos ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Progress Photos</p>
          <div className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <Camera className="h-8 w-8 opacity-30" />
            <p className="text-sm">Progress photo upload coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Log Weight Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={showLogWeight} onOpenChange={setShowLogWeight}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Log Weight</SheetTitle></SheetHeader>
          <SheetBody>
            <div className="grid gap-1.5">
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 185"
                value={logWeight}
                onChange={e => setLogWeight(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any notes…"
                value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowLogWeight(false)}>Cancel</Button>
            <Button onClick={handleLogWeight} disabled={savingWeight || !logWeight}>
              {savingWeight ? 'Saving…' : 'Save'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Measurement History Dialog ───────────────────────────────────────── */}
      <Dialog open={!!historyFor} onOpenChange={open => { if (!open) setHistoryFor(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{historyFor} History</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex flex-col gap-2 py-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : measurementHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No entries recorded yet</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {measurementHistory.map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground">{format(new Date(row.recorded_at), 'dd MMM yyyy')}</span>
                  <span className="text-sm font-medium">{row.value}{unitSuffix}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tab: Results ─────────────────────────────────────────────────────────────

function formatPBValue(pb: any): string {
  const hasWeight = (pb.weight || 0) > 0
  const hasReps = (pb.reps || 0) > 0
  const hasTime = (pb.time_minutes || 0) > 0 || (pb.time_seconds || 0) > 0
  const hasDistance = (pb.distance || 0) > 0

  if (hasDistance && hasTime) {
    const totalSecs = (pb.time_minutes || 0) * 60 + (pb.time_seconds || 0)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${pb.distance}m in ${mins}:${secs.toString().padStart(2, '0')}`
  }
  if (hasDistance) return `${pb.distance}m`
  if (hasTime) {
    const totalSecs = (pb.time_minutes || 0) * 60 + (pb.time_seconds || 0)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }
  if (hasReps && !hasWeight) return `${pb.reps} reps`
  if (hasWeight && hasReps) return `${pb.weight}kg × ${pb.reps} reps`
  if (hasWeight) return `${pb.weight}kg`
  return 'Recorded'
}

function formatChallengeResult(result: any): string {
  if (!result.primary_result_value) {
    if (!result.result_data) return 'Completed'
    const fields = result.challenge?.result_fields || []
    const primary = fields.find((f: any) => f.isPrimary) || fields[0]
    if (primary && result.result_data[primary.name] !== undefined) {
      const val = result.result_data[primary.name]
      if (primary.type === 'time') {
        const secs = Number(val)
        const m = Math.floor(secs / 60), s = secs % 60
        return m > 0 ? `${m}m ${s}s` : `${s}s`
      }
      return primary.unit ? `${val}${primary.unit}` : String(val)
    }
    const firstKey = Object.keys(result.result_data)[0]
    return firstKey ? String(result.result_data[firstKey]) : 'Completed'
  }
  return String(result.primary_result_value)
}

function ResultsTab({ clientId }: { clientId: string }) {
  const [personalBests, setPersonalBests] = useState<any[]>([])
  const [challengeResults, setChallengeResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      supabase
        .from('workout_set_history')
        .select('id, weight, reps, time_minutes, time_seconds, distance, logged_at, exercises(name)')
        .eq('client_id', clientId)
        .eq('is_personal_best', true)
        .order('logged_at', { ascending: false }),
      supabase
        .from('challenge_results')
        .select('id, challenge_id, result_data, primary_result_value, recorded_at, challenge:challenges(name, result_fields)')
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: false }),
    ]).then(([pb, cr]) => {
      if (pb.status === 'fulfilled') {
        const data = pb.value.data || []
        const map = new Map<string, any>()
        data.forEach((row: any) => {
          const name = row.exercises?.name ?? 'Unknown'
          const existing = map.get(name)
          if (!existing || new Date(row.logged_at) > new Date(existing.logged_at)) map.set(name, row)
        })
        setPersonalBests(Array.from(map.values()).slice(0, 12))
      }
      if (cr.status === 'fulfilled') {
        const data = cr.value.data || []
        const map = new Map<string, any>()
        data.forEach((row: any) => {
          const existing = map.get(row.challenge_id)
          if (!existing || new Date(row.recorded_at) > new Date(existing.recorded_at)) map.set(row.challenge_id, row)
        })
        setChallengeResults(Array.from(map.values()).slice(0, 12))
      }
      setLoading(false)
    })
  }, [clientId])

  if (loading) return <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>

  if (!personalBests.length && !challengeResults.length) return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Trophy className="h-8 w-8 opacity-30" />
      <p className="text-sm">No results recorded yet</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {personalBests.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personal Bests</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {personalBests.map((pb: any) => (
              <div key={pb.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{pb.exercises?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(pb.logged_at), 'dd MMM yyyy')}</p>
                </div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  {formatPBValue(pb)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {challengeResults.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Challenges</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {challengeResults.map((cr: any) => (
              <div key={cr.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{cr.challenge?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(cr.recorded_at), 'dd MMM yyyy')}</p>
                </div>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  {formatChallengeResult(cr)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab: Billing ─────────────────────────────────────────────────────────────

function BillingTab({ clientId, trainerId, showAddMembership, setShowAddMembership, showAddMethod, setShowAddMethod, onMutated }: {
  clientId: string
  trainerId: string
  showAddMembership: boolean
  setShowAddMembership: (v: boolean) => void
  showAddMethod: boolean
  setShowAddMethod: (v: boolean) => void
  onMutated?: () => void
}) {
  const [payments, setPayments] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [activeMembership, setActiveMembership] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Add membership sheet
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const [addingMembership, setAddingMembership] = useState(false)

  // Add payment method form state
  const [pmCard, setPmCard] = useState('')
  const [pmExpiry, setPmExpiry] = useState('')
  const [pmCvc, setPmCvc] = useState('')
  const [pmName, setPmName] = useState('')
  const [pmSaving, setPmSaving] = useState(false)

  const detectCardType = (n: string) => {
    const v = n.replace(/\s/g, '')
    if (v.startsWith('4')) return 'Visa'
    if (v.startsWith('5') || v.startsWith('2')) return 'Mastercard'
    if (v.startsWith('3')) return 'Amex'
    return 'Card'
  }

  const handleAddPayment = () => {
    if (!pmCard || !pmExpiry || !pmCvc || !pmName) return
    setPmSaving(true)
    try {
      const stored = localStorage.getItem(`payment-methods-${clientId}`)
      const existing = stored ? JSON.parse(stored) : []
      const newMethod = {
        id: Date.now().toString(),
        cardType: detectCardType(pmCard),
        lastFour: pmCard.replace(/\s/g, '').slice(-4),
        expiryDate: pmExpiry,
        cardholderName: pmName,
        isDefault: existing.length === 0,
        createdAt: new Date().toISOString(),
      }
      const updated = [...existing, newMethod]
      localStorage.setItem(`payment-methods-${clientId}`, JSON.stringify(updated))
      setPmCard(''); setPmExpiry(''); setPmCvc(''); setPmName('')
      setShowAddMethod(false)
      onMutated?.()
    } finally { setPmSaving(false) }
  }

  const loadBilling = useCallback(async () => {
    const results = await Promise.allSettled([
      supabase.from('client_payments').select('id, amount, status, payment_date, description').eq('client_id', clientId).order('payment_date', { ascending: false }).limit(30),
      supabase.from('client_package_purchases').select('*, session_packages(name, total_sessions, is_unlimited)').eq('client_id', clientId).eq('status', 'active'),
      supabase.from('client_memberships').select('*, membership_plans(name, price, billing_period)').eq('client_id', clientId).eq('status', 'active').maybeSingle(),
    ])
    if (results[0].status === 'fulfilled') setPayments(results[0].value.data || [])
    if (results[1].status === 'fulfilled') setPackages(results[1].value.data || [])
    if (results[2].status === 'fulfilled') setActiveMembership(results[2].value.data || null)
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    loadBilling()
    if (trainerId) {
      supabase.from('membership_plans').select('id, name, price, billing_period').eq('trainer_id', trainerId)
        .then(({ data }) => setMembershipPlans(data || []))
    }
  }, [clientId, trainerId, loadBilling])

  const addMembership = async (plan: any) => {
    setAddingMembership(true)
    try {
      // Deactivate any existing active memberships first (prevents maybeSingle() error on plan change)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_memberships').update({ status: 'cancelled' }).eq('client_id', clientId).eq('status', 'active')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_memberships').insert({
        client_id: clientId,
        membership_plan_id: plan.id,
        trainer_id: trainerId,
        status: 'active',
        start_date: new Date().toISOString(),
      })
      setShowAddMembership(false)
      await loadBilling()
      onMutated?.()
    } catch {} finally { setAddingMembership(false) }
  }

  if (loading) return <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
  const memPlan = activeMembership?.membership_plans
  const total = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col gap-4">

      {/* ── Session Packages ── */}
      {packages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Session Packages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {packages.map((pkg: any) => (
              <Card key={pkg.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{pkg.session_packages?.name ?? 'Package'}</p>
                    {pkg.session_packages?.is_unlimited && (
                      <Badge variant="outline" className="bg-card text-xs">Unlimited</Badge>
                    )}
                  </div>
                  {!pkg.session_packages?.is_unlimited && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pkg.sessions_remaining ?? '?'} / {pkg.session_packages?.total_sessions ?? '?'} remaining
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Transaction History ── */}
      <div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground mb-1">Total Paid</p><p className="text-lg font-semibold">£{(total / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground mb-1">Transactions</p><p className="text-lg font-semibold">{payments.length}</p></CardContent></Card>
        </div>

        {payments.length > 0 ? (
          <Card className="py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-medium pl-4">Description</TableHead>
                    <TableHead className="text-xs font-medium">Amount</TableHead>
                    <TableHead className="text-xs font-medium">Date</TableHead>
                    <TableHead className="text-xs font-medium pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="py-3 text-sm pl-4">{p.description ?? 'Payment'}</TableCell>
                      <TableCell className="py-3 text-sm font-medium">£{(p.amount / 100).toFixed(2)}</TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="py-3 pr-4">
                        <Badge variant={p.status === 'completed' ? 'default' : p.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs capitalize">{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <CreditCard className="h-7 w-7 opacity-30" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        )}
      </div>

      {/* ── Add Membership Sheet ── */}
      <Sheet open={showAddMembership} onOpenChange={setShowAddMembership}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Add Membership</SheetTitle></SheetHeader>
          <SheetBody>
            <div className="flex flex-col gap-1">
              {membershipPlans.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No membership plans found. Create plans in Settings.</p>
              )}
              {membershipPlans.map(plan => (
                <button
                  key={plan.id}
                  disabled={addingMembership}
                  onClick={() => addMembership(plan)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-left transition-colors"
                >
                  <span className="text-sm font-medium">{plan.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {plan.price ? `£${plan.price.toFixed(2)}` : '—'}
                    {plan.billing_period ? ` / ${plan.billing_period}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ── Add Payment Method Sheet ── */}
      <Sheet open={showAddMethod} onOpenChange={v => { if (!v) { setPmCard(''); setPmExpiry(''); setPmCvc(''); setPmName('') } setShowAddMethod(v) }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Add Payment Method</SheetTitle></SheetHeader>
          <SheetBody>
            <div className="grid gap-1.5">
              <Label>Card Number</Label>
              <Input placeholder="1234 5678 9012 3456" value={pmCard}
                onChange={e => { const n = e.target.value.replace(/\D/g,'').slice(0,16); setPmCard(n.match(/.{1,4}/g)?.join(' ')??n) }}
                className="font-mono tracking-wider" maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" value={pmExpiry}
                  onChange={e => { const n = e.target.value.replace(/\D/g,'').slice(0,4); setPmExpiry(n.length>=2 ? n.slice(0,2)+'/'+n.slice(2) : n) }}
                  className="font-mono" maxLength={5} />
              </div>
              <div className="grid gap-1.5">
                <Label>CVC</Label>
                <Input placeholder="123" value={pmCvc}
                  onChange={e => setPmCvc(e.target.value.replace(/\D/g,'').slice(0,4))}
                  className="font-mono" maxLength={4} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Cardholder Name</Label>
              <Input placeholder="JOHN SMITH" value={pmName}
                onChange={e => setPmName(e.target.value.toUpperCase().replace(/[^A-Z\s]/g,''))}
                className="uppercase" maxLength={50} />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowAddMethod(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={pmSaving || !pmCard || !pmExpiry || !pmCvc || !pmName}>
              {pmSaving ? 'Saving…' : 'Add Card'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'programs', label: 'Programs' },
  { id: 'progress', label: 'Progress' },
  { id: 'results', label: 'Results' },
  { id: 'billing', label: 'Billing' },
]

export default function ClientDetailPage() {
  const params = useParams()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderTabs } = usePageActions()

  const clientId = params?.clientId as string

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Sheet states lifted here so top-bar buttons can control them
  const [showAddMembership, setShowAddMembership] = useState(false)
  const [showAddMethod, setShowAddMethod] = useState(false)
  // Bump this to force ProfileHeader stat cards to re-fetch
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const refreshStats = () => setStatsRefreshKey(k => k + 1)

  useEffect(() => {
    setActions(null)
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderTabs(
      <div className="inline-flex items-center rounded-md bg-muted/50 p-1 gap-0.5" data-tab-pill style={{ height: 'var(--tab-pill-h)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-sm transition-all',
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
    return () => setHeaderTabs(null)
  }, [setHeaderTabs, activeTab])

  useEffect(() => {
    if (!clientId) return
    setLoading(true); setError(null)
    supabase.from('user_profiles').select('*').eq('id', clientId).single()
      .then(({ data, error: err }) => {
        if (err) setError(getErrorMessage(err))
        else setClient(data as ClientProfile)
        setLoading(false)
      })
  }, [clientId])

  if (!loading && !client) notFound()

  return (
    <div className="flex flex-col min-h-full">
      <ProfileHeader
        client={client}
        loading={loading}
        refreshKey={statsRefreshKey}
        onEdit={() => setEditOpen(true)}
        onAddMembership={() => { setActiveTab('billing'); setShowAddMembership(true) }}
        onChangeMembership={() => { setActiveTab('billing'); setShowAddMembership(true) }}
        onRemoveMembership={() => setActiveTab('billing')}
        onAddPayment={() => { setActiveTab('billing'); setShowAddMethod(true) }}
        onRemovePayment={() => setActiveTab('billing')}
        onGoToPrograms={() => setActiveTab('programs')}
        onGoToBilling={() => setActiveTab('billing')}
      />

      <div className="flex-1 p-6">
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">{error}</div>}

        {!loading && client && (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                client={client}
                userId={user?.id ?? ''}
                onEdit={() => setEditOpen(true)}
              />
            )}
            {activeTab === 'programs' && <ProgramsTab clientId={clientId} trainerId={user?.id ?? ''} />}
            {activeTab === 'progress' && <ProgressTab clientId={clientId} />}
            {activeTab === 'results' && <ResultsTab clientId={clientId} />}
            {activeTab === 'billing' && (
              <BillingTab
                clientId={clientId}
                trainerId={user?.id ?? ''}
                showAddMembership={showAddMembership}
                setShowAddMembership={setShowAddMembership}
                showAddMethod={showAddMethod}
                setShowAddMethod={setShowAddMethod}
                onMutated={refreshStats}
              />
            )}
          </>
        )}
      </div>

      {client && <EditClientSheet open={editOpen} onOpenChange={setEditOpen} client={client} onSaved={setClient} />}
    </div>
  )
}
