// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Users, Search, CheckCircle, Clock, X, UserPlus } from 'lucide-react'
import { logger } from '@/utils/logger'

interface Booking {
  id: string
  client_id: string
  booking_status: 'confirmed' | 'waitlist' | 'cancelled' | 'no_show' | 'attended'
  booking_date: string
  payment_status?: string
  amount_paid?: number
  notes?: string
  checked_in_at?: string
  client_name?: string
  client_email?: string
  ability_tier?: string | null
}

interface AvailableClient {
  id: string
  name: string
  email: string
}

interface BookingsSheetProps {
  open: boolean
  onClose: () => void
  type: 'class' | 'event' | 'challenge'
  scheduleId?: string
  eventId?: string
  challengeScheduleId?: string
  title: string
  subtitle?: string
  maxCapacity?: number
}

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', variant: 'default' as const, icon: CheckCircle },
  attended: { label: 'Attended', variant: 'default' as const, icon: CheckCircle },
  waitlist: { label: 'Waitlist', variant: 'secondary' as const, icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: X },
  no_show: { label: 'No show', variant: 'destructive' as const, icon: X },
}

export function BookingsSheet({ open, onClose, type, scheduleId, eventId, challengeScheduleId, title, subtitle, maxCapacity }: BookingsSheetProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [clients, setClients] = useState<AvailableClient[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!scheduleId && !eventId && !challengeScheduleId) return
    setLoading(true)
    try {
      let data: any[] = []
      if (type === 'class' && scheduleId) {
        const { data: rows, error } = await supabase
          .from('class_bookings')
          .select('*')
          .eq('class_schedule_id', scheduleId)
          .order('booking_date', { ascending: false })
        if (error) throw error
        data = rows || []
      } else if (type === 'event' && eventId) {
        const { data: rows, error } = await supabase
          .from('event_bookings')
          .select('*')
          .eq('event_id', eventId)
          .order('booking_date', { ascending: false })
        if (error) throw error
        data = rows || []
      } else if (type === 'challenge' && challengeScheduleId) {
        const { data: rows, error } = await supabase
          .from('challenge_bookings')
          .select('*')
          .eq('challenge_schedule_id', challengeScheduleId)
          .order('booking_date', { ascending: false })
        if (error) throw error
        data = rows || []
      }

      // Enrich with client profiles
      const clientIds = [...new Set(data.map(b => b.client_id).filter(Boolean))]
      let profiles: any[] = []
      if (clientIds.length > 0) {
        const { data: p } = await supabase
          .from('user_profiles')
          .select('id, name, email')
          .in('id', clientIds)
        profiles = p || []
      }

      setBookings(data.map(b => ({
        ...b,
        client_name: profiles.find(p => p.id === b.client_id)?.name || 'Unknown',
        client_email: profiles.find(p => p.id === b.client_id)?.email || '',
      })))
    } catch (err) {
      logger.error('Error fetching bookings:', err)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('role', 'client')
      .order('name')
    setClients(data || [])
  }

  useEffect(() => {
    if (open) {
      fetchBookings()
      fetchClients()
    }
  }, [open, scheduleId, eventId, challengeScheduleId])

  const syncBookingCount = async () => {
    // Recount confirmed+attended bookings and update current_bookings on the schedule row
    try {
      const bookingTable = type === 'class' ? 'class_bookings' : type === 'challenge' ? 'challenge_bookings' : 'event_bookings'
      const fkField = type === 'class' ? 'class_schedule_id' : type === 'challenge' ? 'challenge_schedule_id' : 'event_id'
      const id = type === 'class' ? scheduleId : type === 'challenge' ? challengeScheduleId : eventId
      if (!id) return

      const { count } = await supabase
        .from(bookingTable)
        .select('id', { count: 'exact', head: true })
        .eq(fkField, id)
        .in('booking_status', ['confirmed', 'attended', 'waitlist'])

      const scheduleTable = type === 'class' ? 'class_schedules' : type === 'challenge' ? 'challenge_schedules' : 'events'
      const scheduleFk = type === 'event' ? 'id' : 'id'
      await supabase.from(scheduleTable).update({ current_bookings: count ?? 0 }).eq(scheduleFk, id)
    } catch {}
  }

  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId)
    try {
      const table = type === 'class' ? 'class_bookings' : type === 'challenge' ? 'challenge_bookings' : 'event_bookings'
      const update: any = { booking_status: status }
      if (status === 'attended') update.checked_in_at = new Date().toISOString()
      const { error } = await supabase.from(table).update(update).eq('id', bookingId)
      if (error) throw error
      await fetchBookings()
      await syncBookingCount()
      toast.success('Status updated')
    } catch (err) {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const addClient = async (client: AvailableClient) => {
    setAddingId(client.id)
    try {
      if (type === 'class' && scheduleId) {
        const { error } = await supabase.from('class_bookings').insert({
          class_schedule_id: scheduleId,
          client_id: client.id,
          booking_status: 'confirmed',
          booking_date: new Date().toISOString().split('T')[0],
          payment_status: 'pending',
        })
        if (error) throw error
      } else if (type === 'event' && eventId) {
        const { error } = await supabase.from('event_bookings').insert({
          event_id: eventId,
          client_id: client.id,
          booking_status: 'confirmed',
          booking_date: new Date().toISOString().split('T')[0],
          payment_status: 'pending',
        })
        if (error) throw error
      } else if (type === 'challenge' && challengeScheduleId) {
        const { error } = await supabase.from('challenge_bookings').insert({
          challenge_schedule_id: challengeScheduleId,
          client_id: client.id,
          booking_status: 'confirmed',
          booking_date: new Date().toISOString().split('T')[0],
        })
        if (error) throw error
      }
      await fetchBookings()
      await syncBookingCount()
      toast.success(`${client.name} added`)
      setClientSearch('')
    } catch (err) {
      toast.error('Failed to add client')
    } finally {
      setAddingId(null)
    }
  }

  const confirmedCount = bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'attended').length
  const tierCounts = type === 'challenge' ? {
    grey: bookings.filter(b => b.ability_tier === 'grey' && b.booking_status !== 'cancelled').length,
    blue: bookings.filter(b => b.ability_tier === 'blue' && b.booking_status !== 'cancelled').length,
    black: bookings.filter(b => b.ability_tier === 'black' && b.booking_status !== 'cancelled').length,
  } : null
  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 8)

  const initials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-[440px] sm:max-w-[440px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bookings
          </SheetTitle>
          <SheetDescription>
            <span className="font-medium text-foreground">{title}</span>
            {subtitle && <span className="text-muted-foreground"> · {subtitle}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Tier summary — challenges only */}
        {tierCounts && (tierCounts.grey > 0 || tierCounts.blue > 0 || tierCounts.black > 0) && (
          <div className="flex items-center gap-2 px-1 pb-1">
            {tierCounts.grey > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400">Grey {tierCounts.grey}</span>
            )}
            {tierCounts.blue > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Blue {tierCounts.blue}</span>
            )}
            {tierCounts.black > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-900/60 text-zinc-300">Black {tierCounts.black}</span>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{confirmedCount}</span>
            <span className="text-muted-foreground">
              {maxCapacity ? `/ ${maxCapacity} booked` : 'booked'}
            </span>
            {bookings.filter(b => b.booking_status === 'waitlist').length > 0 && (
              <Badge variant="outline" className="bg-card text-xs ml-1">
                {bookings.filter(b => b.booking_status === 'waitlist').length} waitlist
              </Badge>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowAddClient(v => !v)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add client
          </Button>
        </div>

        {/* Add client search panel */}
        {showAddClient && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search clients…"
                className="pl-8 h-8 text-sm bg-card"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-0.5">
              {filteredClients.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 text-[10px] [&::after]:hidden">
                      <AvatarFallback className="text-[10px]">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium leading-none">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <Button
                   
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    disabled={addingId === c.id || bookings.some(b => b.client_id === c.id)}
                    onClick={() => addClient(c)}
                  >
                    {bookings.some(b => b.client_id === c.id) ? 'Booked' : addingId === c.id ? '…' : 'Add'}
                  </Button>
                </div>
              ))}
              {clientSearch && filteredClients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No clients found</p>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Bookings list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loading ? (
            <div className="flex flex-col gap-2 p-1">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-1">
              <Users className="h-6 w-6 opacity-40" />
              <span>No bookings yet</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 p-1">
              {bookings.map(booking => {
                const cfg = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.confirmed
                return (
                  <div key={booking.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/40 transition-colors group">
                    <Avatar className="h-8 w-8 shrink-0 [&::after]:hidden">
                      <AvatarFallback className="text-xs">{initials(booking.client_name || '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium leading-none truncate">{booking.client_name}</p>
                        {booking.ability_tier && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            booking.ability_tier === 'grey' ? 'bg-zinc-500/20 text-zinc-400' :
                            booking.ability_tier === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-zinc-900/40 text-zinc-300'
                          }`}>{booking.ability_tier}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{booking.client_email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                      {booking.booking_status === 'confirmed' && (
                        <Button
                         
                          variant="ghost"
                          className="h-6 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={updatingId === booking.id}
                          onClick={() => updateStatus(booking.id, 'attended')}
                        >
                          Check in
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
