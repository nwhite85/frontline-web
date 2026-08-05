/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'
import { addWeeks, QUEUED_STATUS } from '@/lib/programAssignment'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
) as any

// GET /api/cron/program-rollover — daily. Any active programme whose end_date has
// passed AND that has a queued (paused) programme behind it: mark it completed and
// promote the next one to active, starting today. A lone programme (no successor)
// is left running, preserving the original "just rolls on" behaviour.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: expired, error } = await supabase
    .from('client_programs')
    .select('id, client_id, program_id')
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lte('end_date', today)

  if (error) {
    logger.error('program-rollover: fetch error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let rolled = 0

  for (const active of expired ?? []) {
    // Earliest queued programme for this client
    const { data: nextRows } = await supabase
      .from('client_programs')
      .select('id, program_id, programs(duration_weeks)')
      .eq('client_id', active.client_id)
      .eq('status', QUEUED_STATUS)
      .order('start_date', { ascending: true })
      .limit(1)

    const next = nextRows?.[0]
    if (!next) continue // no successor → leave the active programme running

    // Complete the current programme
    await supabase.from('client_programs').update({ status: 'completed' }).eq('id', active.id)

    // Promote the next one, anchored to today so week 1 starts now
    const duration = next.programs?.duration_weeks || 12
    await supabase.from('client_programs').update({
      status: 'active',
      assigned_at: new Date().toISOString(),
      start_date: today,
      end_date: addWeeks(today, duration),
    }).eq('id', next.id)

    rolled++
    logger.log(`program-rollover: client ${active.client_id} rolled ${active.program_id} → ${next.program_id}`)
  }

  return NextResponse.json({ processed: expired?.length ?? 0, rolled })
}
