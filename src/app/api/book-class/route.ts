import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

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
      return NextResponse.json({ error: 'classScheduleId and clientId are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // ── 1. Membership gate ──
    const { data: membership } = await supabase
      .from('client_memberships')
      .select('id, membership_plans(includes_classes, classes_per_week, classes_per_month)')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'You need an active membership to book classes.' }, { status: 403 })
    }

    const plan = (membership as any).membership_plans
    if (plan && !plan.includes_classes) {
      return NextResponse.json({ error: 'Your membership does not include classes.' }, { status: 403 })
    }

    if (plan?.classes_per_week) {
      const now = new Date()
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - day)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const { count } = await supabase
        .from('class_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .neq('booking_status', 'cancelled')
        .gte('booking_date', weekStart.toISOString())
        .lt('booking_date', weekEnd.toISOString())

      if ((count ?? 0) >= plan.classes_per_week) {
        return NextResponse.json(
          { error: `You've used all ${plan.classes_per_week} classes for this week.` },
          { status: 403 }
        )
      }
    } else if (plan?.classes_per_month) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const { count } = await supabase
        .from('class_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .neq('booking_status', 'cancelled')
        .gte('booking_date', monthStart.toISOString())
        .lt('booking_date', monthEnd.toISOString())

      if ((count ?? 0) >= plan.classes_per_month) {
        return NextResponse.json(
          { error: `You've used all ${plan.classes_per_month} classes for this month.` },
          { status: 403 }
        )
      }
    }

    // ── 2. Fetch class schedule ──
    const { data: schedule } = await supabase
      .from('class_schedules')
      .select('id, trainer_id, max_capacity, current_bookings, status')
      .eq('id', classScheduleId)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Class not found.' }, { status: 404 })
    }
    if (schedule.status === 'cancelled') {
      return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 400 })
    }

    const isFull = (schedule.max_capacity ?? 0) > 0 && (schedule.current_bookings ?? 0) >= (schedule.max_capacity ?? 0)

    // ── 3. Check not already booked ──
    const { data: existing } = await supabase
      .from('class_bookings')
      .select('id, booking_status')
      .eq('client_id', clientId)
      .eq('class_schedule_id', classScheduleId)
      .maybeSingle()

    if (existing && existing.booking_status !== 'cancelled') {
      return NextResponse.json({ error: 'You are already booked for this class.' }, { status: 400 })
    }

    // ── 4. Insert or re-activate booking ──
    if (existing && existing.booking_status === 'cancelled') {
      await supabase
        .from('class_bookings')
        .update({
          booking_status: isFull ? 'waitlist' : 'confirmed',
          booking_date: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('class_bookings')
        .insert({
          client_id: clientId,
          class_schedule_id: classScheduleId,
          trainer_id: schedule.trainer_id,
          booking_status: isFull ? 'waitlist' : 'confirmed',
          payment_status: 'included',
          amount_paid: 0,
          booking_date: new Date().toISOString(),
        })
    }

    // Increment current_bookings counter (only for confirmed, not waitlist)
    if (!isFull) {
      await supabase
        .from('class_schedules')
        .update({ current_bookings: (schedule.current_bookings ?? 0) + 1 })
        .eq('id', classScheduleId)
    }

    logger.log(`Class booked: ${clientId} → ${classScheduleId} (${isFull ? 'waitlist' : 'confirmed'})`)
    return NextResponse.json({
      success: true,
      status: isFull ? 'waitlist' : 'confirmed',
    })
  } catch (error: any) {
    logger.error('book-class error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book class' }, { status: 500 })
  }
}
