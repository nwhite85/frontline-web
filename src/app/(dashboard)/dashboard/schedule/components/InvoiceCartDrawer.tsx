'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckCircle, Receipt } from 'lucide-react'

interface UnbilledAppointment {
  id: string
  appointment_date: string
  start_time: string
  appointment_type: string | null
  client_id: string | null
  payment_status: string | null
  price: number | null
}

interface AppointmentTemplate {
  name: string
  price: number
}

interface ClientGroup {
  clientId: string
  clientName: string
  appointments: UnbilledAppointment[]
}

interface InvoiceCartDrawerProps {
  open: boolean
  onClose: () => void
  trainerId: string
}

export function InvoiceCartDrawer({ open, onClose, trainerId }: InvoiceCartDrawerProps) {
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [templatePrices, setTemplatePrices] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [sendingAll, setSendingAll] = useState(false)

  const fetchUnbilled = useCallback(async () => {
    if (!trainerId) return
    setLoading(true)
    try {
      const { data: rawApts } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, appointment_type, client_id, payment_status, price')
        .eq('trainer_id', trainerId)
        .eq('status', 'scheduled')
        .eq('payment_status', 'unbilled')
        .order('appointment_date')

      const apts = (rawApts ?? []) as UnbilledAppointment[]
      if (!apts.length) { setGroups([]); return }

      const clientIds = [...new Set(apts.map(a => a.client_id).filter(Boolean))] as string[]
      const { data: rawProfiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', clientIds)

      const profiles = (rawProfiles ?? []) as { id: string; name: string | null }[]
      const nameMap = new Map(profiles.map(p => [p.id, p.name ?? 'Unknown']))

      const groupMap = new Map<string, ClientGroup>()
      for (const apt of apts) {
        if (!apt.client_id) continue
        if (!groupMap.has(apt.client_id)) {
          groupMap.set(apt.client_id, {
            clientId: apt.client_id,
            clientName: nameMap.get(apt.client_id) ?? 'Unknown',
            appointments: [],
          })
        }
        groupMap.get(apt.client_id)!.appointments.push(apt)
      }
      // Fetch template prices for fallback lookup
      const { data: rawTemplates } = await supabase
        .from('appointment_templates')
        .select('name, price')
        .eq('trainer_id', trainerId)
      const tMap = new Map<string, number>(
        (rawTemplates as AppointmentTemplate[] ?? []).map(t => [t.name, t.price])
      )
      setTemplatePrices(tMap)

      setGroups([...groupMap.values()])
    } finally {
      setLoading(false)
    }
  }, [trainerId])

  useEffect(() => {
    if (open) fetchUnbilled()
  }, [open, fetchUnbilled])

  const sendInvoice = async (clientId: string, appointmentIds: string[]) => {
    setSending(s => ({ ...s, [clientId]: true }))
    try {
      const res = await fetch('/api/send-pt-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, appointmentIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Invoice sent for ${data.sessionCount} session${data.sessionCount !== 1 ? 's' : ''}`)
      await fetchUnbilled()
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invoice')
    } finally {
      setSending(s => ({ ...s, [clientId]: false }))
    }
  }

  const sendAll = async () => {
    setSendingAll(true)
    for (const group of groups) {
      await sendInvoice(group.clientId, group.appointments.map(a => a.id))
    }
    setSendingAll(false)
  }

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const totalSessions = groups.reduce((n, g) => n + g.appointments.length, 0)
  const aptPrice = (a: UnbilledAppointment) => a.price ?? (a.appointment_type ? templatePrices.get(a.appointment_type) : undefined) ?? 35
  const groupTotal = (group: ClientGroup) => group.appointments.reduce((n, a) => n + aptPrice(a), 0)
  const grandTotal = groups.reduce((n, g) => n + groupTotal(g), 0)

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoice Queue
          </SheetTitle>
          {!loading && groups.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {groups.length} client{groups.length !== 1 ? 's' : ''} · {totalSessions} session{totalSessions !== 1 ? 's' : ''}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">No unbilled sessions</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.clientId} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{group.clientName}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!!sending[group.clientId] || sendingAll}
                    onClick={() => sendInvoice(group.clientId, group.appointments.map(a => a.id))}
                  >
                    {sending[group.clientId] ? 'Sending…' : 'Send Invoice'}
                  </Button>
                </div>
                <div className="space-y-1">
                  {group.appointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(apt.appointment_date)} · {apt.appointment_type || 'PT Session'} · {apt.start_time?.slice(0, 5)}</span>
                      <span>£{aptPrice(apt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {group.appointments.length} session{group.appointments.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs font-semibold text-foreground">£{groupTotal(group)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {groups.length > 0 && (
          <SheetFooter className="pt-3 border-t px-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total to invoice</span>
              <span className="font-semibold text-foreground">£{grandTotal}</span>
            </div>
            {groups.length > 1 && (
              <Button
                className="w-full"
                disabled={sendingAll || Object.values(sending).some(Boolean)}
                onClick={sendAll}
              >
                {sendingAll ? 'Sending all…' : `Send All (${groups.length} invoices)`}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
