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
    const { eventId, clientId } = await request.json()

    if (!eventId || !clientId) {
      return NextResponse.json(
        { error: 'eventId and clientId are required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: booking, error: lookupError } = await supabase
      .from('event_bookings')
      .select('id, booking_status')
      .eq('event_id', eventId)
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
      .from('event_bookings')
      .update({ booking_status: 'cancelled' })
      .eq('id', booking.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Decrement current_bookings
    const { data: event } = await supabase
      .from('events')
      .select('current_bookings')
      .eq('id', eventId)
      .single()
    if (event && (event.current_bookings ?? 0) > 0) {
      await supabase
        .from('events')
        .update({ current_bookings: event.current_bookings - 1 })
        .eq('id', eventId)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to cancel booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
