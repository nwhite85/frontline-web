import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function GET(req: NextRequest) {
  const scheduleId = req.nextUrl.searchParams.get('scheduleId')
  if (!scheduleId) return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 })

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('trialist_bookings')
      .select('id, first_name, last_name, email, status, created_at')
      .eq('class_schedule_id', scheduleId)
      .eq('status', 'confirmed')

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    logger.error('[trialist-bookings] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch trialist bookings' }, { status: 500 })
  }
}
