import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'
import { isCreditPlan } from '@/lib/membership'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { classScheduleId, clientId } = await request.json()

    if (!classScheduleId || !clientId) {
      return NextResponse.json(
        { error: 'classScheduleId and clientId are required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: booking, error: lookupError } = await supabase
      .from('class_bookings')
      .select('id, booking_status, payment_status')
      .eq('class_schedule_id', classScheduleId)
      .eq('client_id', clientId)
      .in('booking_status', ['confirmed', 'waitlist'])
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('class_bookings')
      .update({ booking_status: 'cancelled' })
      .eq('id', booking.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Decrement current_bookings if was confirmed
    if (booking.booking_status === 'confirmed') {
      const { data: sched } = await supabase
        .from('class_schedules')
        .select('current_bookings')
        .eq('id', classScheduleId)
        .single()
      if (sched && (sched.current_bookings ?? 0) > 0) {
        await supabase
          .from('class_schedules')
          .update({ current_bookings: sched.current_bookings - 1 })
          .eq('id', classScheduleId)
      }
    }

    // Restore credit if booking was paid by credits
    if ((booking as any).payment_status === 'credit') {
      const { data: memberships } = await supabase
        .from('client_memberships')
        .select('id, class_credits_remaining, membership_plans(plan_type)')
        .eq('client_id', clientId)
        .eq('status', 'active')

      const creditMembership = (memberships || []).find(
        (m: any) => isCreditPlan(m.membership_plans)
      ) as any | undefined

      if (creditMembership) {
        const restored = (creditMembership.class_credits_remaining ?? 0) + 1
        await supabase
          .from('client_memberships')
          .update({ class_credits_remaining: restored })
          .eq('id', creditMembership.id)
        logger.log(`Credit restored for ${clientId} — ${restored} remaining`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to cancel booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
