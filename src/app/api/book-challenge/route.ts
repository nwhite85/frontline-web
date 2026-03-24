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

const VALID_TIERS = ['grey', 'blue', 'black'] as const
type Tier = typeof VALID_TIERS[number]

export async function POST(request: NextRequest) {
  try {
    const { challengeScheduleId, clientId, abilityTier } = await request.json()

    if (!challengeScheduleId || !clientId) {
      return NextResponse.json({ error: 'challengeScheduleId and clientId are required' }, { status: 400 })
    }
    if (abilityTier && !VALID_TIERS.includes(abilityTier)) {
      return NextResponse.json({ error: 'Invalid ability tier. Must be grey, blue or black.' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Fetch the challenge schedule + challenge details
    const { data: schedule } = await supabase
      .from('challenge_schedules')
      .select('id, trainer_id, max_capacity, current_bookings, status, challenge:challenge_id(id, tier_capacity)')
      .eq('id', challengeScheduleId)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Challenge session not found.' }, { status: 404 })
    }
    if (schedule.status === 'cancelled') {
      return NextResponse.json({ error: 'This session has been cancelled.' }, { status: 400 })
    }

    // Check not already booked
    const { data: existing } = await supabase
      .from('challenge_bookings')
      .select('id, booking_status')
      .eq('client_id', clientId)
      .eq('challenge_schedule_id', challengeScheduleId)
      .maybeSingle()

    if (existing && existing.booking_status !== 'cancelled') {
      return NextResponse.json({ error: 'You are already booked for this session.' }, { status: 400 })
    }

    // Tier capacity check
    const challenge = (schedule as any).challenge
    const tierCapacity = challenge?.tier_capacity as Record<string, number | null> | null

    if (abilityTier && tierCapacity) {
      const tierMax = tierCapacity[abilityTier as Tier]
      if (tierMax != null) {
        // Count existing confirmed bookings for this tier
        const { count: tierCount } = await supabase
          .from('challenge_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_schedule_id', challengeScheduleId)
          .eq('ability_tier', abilityTier)
          .neq('booking_status', 'cancelled')

        if ((tierCount ?? 0) >= tierMax) {
          const tierLabel = abilityTier.charAt(0).toUpperCase() + abilityTier.slice(1)
          return NextResponse.json(
            { error: `${tierLabel} tier is full for this session.` },
            { status: 403 }
          )
        }
      }
    }

    // Overall capacity check (fallback)
    const maxCap = schedule.max_capacity ?? 0
    if (maxCap > 0) {
      const { count: totalCount } = await supabase
        .from('challenge_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_schedule_id', challengeScheduleId)
        .neq('booking_status', 'cancelled')

      if ((totalCount ?? 0) >= maxCap) {
        return NextResponse.json({ error: 'This session is full.' }, { status: 403 })
      }
    }

    // Insert or re-activate booking
    if (existing && existing.booking_status === 'cancelled') {
      await supabase
        .from('challenge_bookings')
        .update({
          booking_status: 'confirmed',
          booking_date: new Date().toISOString(),
          ability_tier: abilityTier || null,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('challenge_bookings').insert({
        challenge_schedule_id: challengeScheduleId,
        client_id: clientId,
        trainer_id: schedule.trainer_id,
        booking_status: 'confirmed',
        booking_date: new Date().toISOString(),
        ability_tier: abilityTier || null,
      })
    }

    // Update current_bookings count
    const { count: newTotal } = await supabase
      .from('challenge_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_schedule_id', challengeScheduleId)
      .neq('booking_status', 'cancelled')

    await supabase
      .from('challenge_schedules')
      .update({ current_bookings: newTotal ?? 0 })
      .eq('id', challengeScheduleId)

    logger.log(`Challenge booked: ${clientId} → ${challengeScheduleId} (tier: ${abilityTier ?? 'none'})`)
    return NextResponse.json({ success: true, status: 'confirmed' })
  } catch (error: any) {
    logger.error('book-challenge error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book session' }, { status: 500 })
  }
}
