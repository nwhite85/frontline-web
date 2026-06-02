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
    const { clientProgramId, clientId, programId, weekNumber = 1 } = await request.json()
    if (!clientProgramId || !clientId || !programId) {
      return NextResponse.json({ error: 'clientProgramId, clientId, and programId are required' }, { status: 400 })
    }

    // Set assigned_at so that (today - assigned_at) places client at the requested week
    const assignedAt = new Date()
    assignedAt.setDate(assignedAt.getDate() - (weekNumber - 1) * 7)

    const supabase = getAdminClient()

    await Promise.all([
      supabase.from('client_programs').update({ assigned_at: assignedAt.toISOString() }).eq('id', clientProgramId),
      supabase.from('activity_log').delete()
        .eq('client_id', clientId)
        .eq('event_type', 'week_completed')
        .filter('metadata->>program_id', 'eq', programId),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
