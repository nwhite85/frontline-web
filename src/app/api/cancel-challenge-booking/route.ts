import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { challengeScheduleId, clientId, action, trainerId, status } = await request.json()

    if (!challengeScheduleId || !clientId) {
      return NextResponse.json(
        { error: 'challengeScheduleId and clientId are required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // action=cancel: set confirmed booking to cancelled
    // action=book (default): upsert — update cancelled row or insert new
    if (action === 'cancel') {
      const { data: booking, error: lookupError } = await supabase
        .from('challenge_bookings')
        .select('id')
        .eq('challenge_schedule_id', challengeScheduleId)
        .eq('client_id', clientId)
        .eq('booking_status', 'confirmed')
        .maybeSingle()

      if (lookupError) {
        return NextResponse.json({ error: lookupError.message }, { status: 500 })
      }

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('challenge_bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Decrement current_bookings
      const { data: sched } = await supabase
        .from('challenge_schedules')
        .select('current_bookings')
        .eq('id', challengeScheduleId)
        .single()
      if (sched && sched.current_bookings > 0) {
        await supabase
          .from('challenge_schedules')
          .update({ current_bookings: sched.current_bookings - 1 })
          .eq('id', challengeScheduleId)
      }

      return NextResponse.json({ success: true })
    }

    // action=book: upsert — re-activate cancelled or insert new
    const bookingStatus = status || 'confirmed'
    const { data: existing, error: existingError } = await supabase
      .from('challenge_bookings')
      .select('id')
      .eq('challenge_schedule_id', challengeScheduleId)
      .eq('client_id', clientId)
      .eq('booking_status', 'cancelled')
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('challenge_bookings')
        .update({ booking_status: bookingStatus, booking_date: new Date().toISOString() })
        .eq('id', existing.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      if (!trainerId) {
        return NextResponse.json({ error: 'trainerId is required for new bookings' }, { status: 400 })
      }

      const { error: insertError } = await supabase
        .from('challenge_bookings')
        .insert({
          challenge_schedule_id: challengeScheduleId,
          client_id: clientId,
          trainer_id: trainerId,
          booking_status: bookingStatus,
          booking_date: new Date().toISOString(),
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    // Increment current_bookings for confirmed bookings
    if (bookingStatus === 'confirmed') {
      const { data: sched } = await supabase
        .from('challenge_schedules')
        .select('current_bookings')
        .eq('id', challengeScheduleId)
        .single()
      if (sched) {
        await supabase
          .from('challenge_schedules')
          .update({ current_bookings: (sched.current_bookings ?? 0) + 1 })
          .eq('id', challengeScheduleId)
      }
    }

    return NextResponse.json({ success: true, status: bookingStatus })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
