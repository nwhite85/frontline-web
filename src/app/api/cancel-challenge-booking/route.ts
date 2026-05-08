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

async function autoPromoteWaitlist(
  supabase: ReturnType<typeof createClient>,
  challengeScheduleId: string,
  cancelledTier: string | null,
  cancelledClientId: string,
) {
  if (!cancelledTier) return

  // Get gender of the client who cancelled
  const { data: cancelledProfile } = await supabase
    .from('user_profiles')
    .select('gender')
    .eq('id', cancelledClientId)
    .maybeSingle()
  const cancelledGender = (cancelledProfile as any)?.gender ?? null

  // Find all waitlisted bookings for this schedule with matching tier
  const { data: waitlisted } = await supabase
    .from('challenge_bookings')
    .select('id, client_id, ability_tier')
    .eq('challenge_schedule_id', challengeScheduleId)
    .eq('booking_status', 'waitlist')
    .eq('ability_tier', cancelledTier)
    .order('created_at', { ascending: true })

  if (!waitlisted || waitlisted.length === 0) return

  // Filter to same gender, fallback to any gender if none match
  const clientIds = waitlisted.map((w: any) => w.client_id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, gender')
    .in('id', clientIds)
  const genderMap: Record<string, string | null> = {}
  for (const p of profiles || []) genderMap[(p as any).id] = (p as any).gender ?? null

  const match = cancelledGender
    ? waitlisted.find((w: any) => genderMap[w.client_id] === cancelledGender)
    : waitlisted[0]
  const promote = match ?? waitlisted[0]

  if (!promote) return

  await supabase
    .from('challenge_bookings')
    .update({ booking_status: 'confirmed' })
    .eq('id', (promote as any).id)

  // Recount confirmed after promotion
  const { count: newTotal } = await supabase
    .from('challenge_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_schedule_id', challengeScheduleId)
    .eq('booking_status', 'confirmed')
  await supabase
    .from('challenge_schedules')
    .update({ current_bookings: newTotal ?? 0 })
    .eq('id', challengeScheduleId)

  logger.log(`Challenge waitlist auto-promote: ${(promote as any).client_id} promoted for ${challengeScheduleId}`)
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
      // Find the booking — could be confirmed or waitlist
      const { data: booking, error: lookupError } = await supabase
        .from('challenge_bookings')
        .select('id, ability_tier, booking_status')
        .eq('challenge_schedule_id', challengeScheduleId)
        .eq('client_id', clientId)
        .in('booking_status', ['confirmed', 'waitlist'])
        .maybeSingle()

      if (lookupError) {
        return NextResponse.json({ error: lookupError.message }, { status: 500 })
      }

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const wasConfirmed = booking.booking_status === 'confirmed'

      const { error: updateError } = await supabase
        .from('challenge_bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Recount confirmed only
      const { count: newTotal } = await supabase
        .from('challenge_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_schedule_id', challengeScheduleId)
        .eq('booking_status', 'confirmed')
      await supabase
        .from('challenge_schedules')
        .update({ current_bookings: newTotal ?? 0 })
        .eq('id', challengeScheduleId)

      // Only restore credit and auto-promote if a confirmed slot was freed
      if (wasConfirmed) {
        // Restore credit for the cancelling client
        const { data: memberships } = await supabase
          .from('client_memberships')
          .select('id, class_credits_remaining, membership_plans(plan_type, includes_classes)')
          .eq('client_id', clientId)
          .eq('status', 'active')

        const hasRecurring = (memberships || []).some(
          (m: any) => m.membership_plans?.plan_type !== 'credit_package' && m.membership_plans?.includes_classes
        )
        const creditMembership = !hasRecurring
          ? (memberships || []).find((m: any) => m.membership_plans?.plan_type === 'credit_package') as any | undefined
          : undefined

        if (creditMembership) {
          const restored = (creditMembership.class_credits_remaining ?? 0) + 1
          await supabase
            .from('client_memberships')
            .update({ class_credits_remaining: restored })
            .eq('id', creditMembership.id)
          logger.log(`Challenge cancel: credit restored for ${clientId} — ${restored} remaining`)
        }

        // Auto-promote first waitlisted person matching the same tier + gender
        await autoPromoteWaitlist(supabase, challengeScheduleId, booking.ability_tier, clientId)
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

    // Recount confirmed bookings
    if (bookingStatus === 'confirmed') {
      const { count: newTotal } = await supabase
        .from('challenge_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_schedule_id', challengeScheduleId)
        .eq('booking_status', 'confirmed')
      await supabase
        .from('challenge_schedules')
        .update({ current_bookings: newTotal ?? 0 })
        .eq('id', challengeScheduleId)
    }

    return NextResponse.json({ success: true, status: bookingStatus })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
