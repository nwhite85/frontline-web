'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, CreditCard, TrendingUp, Clock, CheckCircle, Plus } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'

interface Payment {
  id: string
  client_name: string
  amount: number
  currency: string
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled'
  payment_method: string
  payment_type: string
  payment_date: string | null
  description: string
}

interface PaymentSummary {
  total_revenue: number
  pending_amount: number
  this_month_revenue: number
  total_transactions: number
}

interface ClientOption {
  id: string
  name: string
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  pending: 'secondary',
  failed: 'destructive',
  refunded: 'outline',
  cancelled: 'outline',
}

const TODAY = new Date().toISOString().split('T')[0]

// ─────────────────────────────────────────────────────────────────
// RecordPaymentSheet
// ─────────────────────────────────────────────────────────────────
function RecordPaymentSheet({
  open,
  onOpenChange,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  trainerId: string
  onSaved: () => void
}) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientId, setClientId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('GBP')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentType, setPaymentType] = useState('session')
  const [paymentDate, setPaymentDate] = useState(TODAY)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Load clients when sheet opens
  useEffect(() => {
    if (!open) return
    const load = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('user_type', 'client')
        .order('name', { ascending: true })
      if (data) {
        // @ts-ignore
        setClients(data.map(c => ({ id: c.id, name: c.name || c.email || 'Unknown' })))
      }
      // Reset form
      setClientId('')
      setAmount('')
      setCurrency('GBP')
      setPaymentMethod('cash')
      setPaymentType('session')
      setPaymentDate(TODAY)
      setDescription('')
      setFormError('')
    }
    load()
  }, [open])

  const handleSave = async () => {
    setFormError('')
    if (!clientId) { setFormError('Please select a client'); return }
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount'); return }

    setSaving(true)
    try {
      const selectedClient = clients.find(c => c.id === clientId)
      // @ts-ignore
      const { error } = await supabase.from('client_payments').insert({
        trainer_id: trainerId,
        client_id: clientId,
        amount: Math.round(amt * 100),
        currency,
        status: 'completed',
        payment_method: paymentMethod,
        payment_type: paymentType,
        payment_date: paymentDate || null,
        description: description || `${selectedClient?.name ?? 'Client'} — ${paymentType}`,
      })
      if (error) throw error
      toast.success('Payment recorded')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setFormError(getErrorMessage(err) || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record Payment</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {formError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
          )}

          {/* Client */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Amount *</Label>
              <Input
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Notes / Description</Label>
            <Textarea
              placeholder="Optional notes…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="text-sm resize-none"
              rows={3}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Record Payment'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({ total_revenue: 0, pending_amount: 0, this_month_revenue: 0, total_transactions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<SortConfig<Payment> | null>({ key: 'payment_date', direction: 'desc' })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [showRecordSheet, setShowRecordSheet] = useState(false)

  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => setShowRecordSheet(true)}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Record Payment
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
            placeholder="Search payments…"
            className="pl-8 h-8 text-sm bg-card"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {['All', 'completed', 'pending', 'failed', 'refunded', 'cancelled'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
    return () => setHeaderSearch(null)
  }, [searchQuery, statusFilter, setHeaderSearch])

  const fetchData = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data: rawData, error: payErr } = await supabase
        .from('client_payments')
        .select('id, amount, currency, status, payment_method, payment_type, payment_date, description, client_id')
        .eq('trainer_id', user.id)
        .order('payment_date', { ascending: false })
      const data = rawData as Array<{
        id: string; amount: number; currency: string | null; status: string
        payment_method: string | null; payment_type: string; payment_date: string | null
        description: string; client_id: string
      }> | null

      if (payErr) throw payErr

      if (data && data.length > 0) {
        const clientIds = [...new Set(data.map(p => p.client_id).filter(Boolean))]
        const { data: profilesRaw } = await supabase
          .from('user_profiles')
          .select('id, name, email')
          .in('id', clientIds)
        const profiles = profilesRaw as Array<{ id: string; name: string | null; email: string | null }> | null

        const profileMap: Record<string, string> = {}
        profiles?.forEach(p => { profileMap[p.id] = p.name || p.email || 'Unknown' })

        setPayments(data.map(p => ({
          ...p,
          client_name: profileMap[p.client_id] || 'Unknown',
        } as Payment)))

        // Compute summary
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        setSummary({
          total_revenue: data.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
          pending_amount: data.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
          this_month_revenue: data.filter(p => p.status === 'completed' && (p.payment_date ?? '') >= monthStart).reduce((s, p) => s + p.amount, 0),
          total_transactions: data.length,
        })
      } else {
        setPayments([])
      }
    } catch (err) {
      logger.error('Error fetching payments:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])


  const handleSort = (key: string) => {
    const dir = toggleSortDirection(sortConfig?.key as string ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(dir ? { key, direction: dir } : null)
  }

  const filtered = payments.filter(p => {
    const matchSearch = !searchQuery ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchStatus
  })
  const sorted = sortData(filtered, sortConfig)
  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const fmt = (amount: number) => `£${(amount / 100).toFixed(2)}`

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total Revenue', value: fmt(summary.total_revenue), icon: TrendingUp },
          { label: 'This Month', value: fmt(summary.this_month_revenue), icon: CheckCircle },
          { label: 'Pending', value: fmt(summary.pending_amount), icon: Clock },
          { label: 'Transactions', value: summary.total_transactions.toString(), icon: CreditCard },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {loading ? <Skeleton className="h-5 w-14 mt-1" /> : (
                    <p className="text-xl font-semibold">{value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Payments from clients will appear here."
          action={
            <Button variant="outline" onClick={() => setShowRecordSheet(true)}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
              Record Payment
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No payments match your filters</div>
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Client"
                    direction={sortConfig?.key === 'client_name' ? sortConfig.direction : null}
                    onClick={() => handleSort('client_name')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Description</TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Amount"
                    direction={sortConfig?.key === 'amount' ? sortConfig.direction : null}
                    onClick={() => handleSort('amount')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Date"
                    direction={sortConfig?.key === 'payment_date' ? sortConfig.direction : null}
                    onClick={() => handleSort('payment_date')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5 text-sm font-medium">{p.client_name}</TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground">{p.description || p.payment_type}</TableCell>
                  <TableCell className="py-2.5 text-sm font-medium">{fmt(p.amount)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant={STATUS_VARIANTS[p.status] ?? 'secondary'} className="text-xs capitalize">
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{sorted.length} payments</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-card" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" className="bg-card" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <RecordPaymentSheet
        open={showRecordSheet}
        onOpenChange={setShowRecordSheet}
        trainerId={user?.id ?? ''}
        onSaved={fetchData}
      />
    </div>
  )
}
