import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data: bookings, error: bookingsError } = await supabase
      .from('challenge_bookings')
      .select('id, client_id, booking_status')
      .eq('challenge_schedule_id', scheduleId)
      .in('booking_status', ['booked', 'confirmed'])

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    const rows = bookings || []
    let result = rows as any[]

    if (rows.length > 0) {
      const clientIds = rows.map((b: any) => b.client_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', clientIds)

      const profileMap: Record<string, { name: string; email: string }> = {}
      ;(profiles || []).forEach((p: any) => {
        profileMap[p.id] = { name: p.name || 'Unknown', email: p.email || '' }
      })

      result = rows.map((b: any) => ({
        ...b,
        user_profiles: profileMap[b.client_id] || { name: 'Unknown', email: '' },
      }))
    }

    return NextResponse.json({ bookings: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch bookings'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
