/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'
import { addWeeks, QUEUED_STATUS } from '@/lib/programAssignment'

// POST /api/assign-program   Body: { clientId, programId }
// Assigns a programme to a client. If the client has no active programme this one
// starts now (status 'active'). If they already have one running, this one is QUEUED
// (status 'paused') to auto-start when the active one finishes — that's how stacking
// works. Only the active programme gets workout_instances; queued ones are materialised
// at roll-over so the app only ever sees the current programme's workouts.

export async function POST(request: NextRequest) {
  try {
    const { clientId, programId } = await request.json()
    if (!clientId || !programId) {
      return NextResponse.json({ error: 'clientId and programId are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient() as any

    const { data: program } = await supabase
      .from('programs')
      .select('id, trainer_id, duration_weeks')
      .eq('id', programId)
      .single()
    if (!program) return NextResponse.json({ error: 'Programme not found' }, { status: 404 })

    const duration = program.duration_weeks || 12
    const today = new Date().toISOString().split('T')[0]

    // Existing active + queued programmes for this client, to work out where this one lands
    const { data: existing } = await supabase
      .from('client_programs')
      .select('id, status, start_date, end_date, assigned_at, program_id, programs(duration_weeks)')
      .eq('client_id', clientId)
      .in('status', ['active', QUEUED_STATUS])

    const active = (existing ?? []).find((r: any) => r.status === 'active')
    const queued = (existing ?? []).filter((r: any) => r.status === QUEUED_STATUS)

    if (!active) {
      // Nothing running — start immediately
      const endDate = addWeeks(today, duration)
      const { error: insErr } = await supabase.from('client_programs').insert({
        client_id: clientId,
        program_id: programId,
        trainer_id: program.trainer_id,
        status: 'active',
        assigned_at: new Date().toISOString(),
        start_date: today,
        end_date: endDate,
      })
      if (insErr) throw insErr
      return NextResponse.json({ success: true, status: 'active', startDate: today, endDate })
    }

    // Something is already running → queue this one behind the end of the chain.
    // Backfill a missing end_date on the active programme (pre-existing assignments had
    // none) so it can actually expire and roll over.
    if (!active.end_date) {
      const activeStart = (active.assigned_at || active.start_date || today).split('T')[0]
      const activeDur = active.programs?.duration_weeks || 12
      const activeEnd = addWeeks(activeStart, activeDur)
      await supabase.from('client_programs')
        .update({ start_date: active.start_date || activeStart, end_date: activeEnd })
        .eq('id', active.id)
      active.end_date = activeEnd
    }

    // Chain start = the latest end_date among the active + already-queued programmes
    const chainEnd = [active, ...queued]
      .map((r: any) => r.end_date)
      .filter(Boolean)
      .sort()
      .pop() || addWeeks(today, duration)

    const startDate = chainEnd
    const endDate = addWeeks(startDate, duration)

    const { error: qErr } = await supabase.from('client_programs').insert({
      client_id: clientId,
      program_id: programId,
      trainer_id: program.trainer_id,
      status: QUEUED_STATUS,
      assigned_at: new Date(startDate + 'T00:00:00Z').toISOString(),
      start_date: startDate,
      end_date: endDate,
    })
    if (qErr) throw qErr
    // No workout_instances yet — created when this programme rolls over to active.

    return NextResponse.json({ success: true, status: 'queued', startDate, endDate })
  } catch (err: any) {
    logger.error('assign-program error:', err)
    return NextResponse.json({ error: err.message || 'Failed to assign programme' }, { status: 500 })
  }
}
