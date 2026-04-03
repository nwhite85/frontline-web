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

// ─── Resource capacity checkers ──────────────────────────────────────────────

function checkStrength(
  tc: any,
  tier: Tier,
  gender: string | null,
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): string | null {
  const kbs = tc.kettlebells as Record<string, number>
  const tiers = tc.tiers as Record<Tier, { female: string; male: string }>
  const kbsPerPerson = tc.kbs_per_person as number ?? 2

  // Calculate current KB usage from existing bookings
  const weightUsage: Record<string, number> = {}
  for (const b of bookings) {
    const t = b.ability_tier as Tier | null
    if (!t || !tiers[t]) continue
    const g = b.gender === 'male' ? 'male' : 'female'
    const weight = tiers[t][g]
    weightUsage[weight] = (weightUsage[weight] || 0) + kbsPerPerson
  }

  // Add the new booking
  const newTierCfg = tiers[tier]
  if (!newTierCfg) return null
  const newGender = gender === 'male' ? 'male' : 'female'
  const newWeight = newTierCfg[newGender]
  weightUsage[newWeight] = (weightUsage[newWeight] || 0) + kbsPerPerson

  // Check all pools
  for (const [weight, used] of Object.entries(weightUsage)) {
    const stock = kbs[weight] ?? 0
    if (used > stock) {
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
      return `${tierLabel} tier is full — not enough ${weight} kettlebells available (${stock} in stock, ${used} needed).`
    }
  }
  return null
}

function checkSpeed(tc: any, totalCount: number): string | null {
  const maxPeople = (tc.total_ropes as number) * (tc.people_per_rope as number)
  if (totalCount + 1 > maxPeople) {
    return `This session is full — all ${tc.total_ropes} battle ropes are taken.`
  }
  return null
}

function checkEndurance(tc: any, tier: Tier, tierCount: number): string | null {
  const stock = tc.tiers?.[tier]?.stock as number
  if (stock != null && tierCount + 1 > stock) {
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
    return `${tierLabel} tier is full — not enough ${tier === 'grey' ? '10kg' : tier === 'blue' ? '15kg' : '20kg'} power bags available.`
  }
  return null
}

function checkPower(tc: any, tier: Tier, counts: Record<Tier, number>): string | null {
  const totalRisers = tc.total_risers as number
  const balls = tc.balls as Record<Tier, { weight: string; stock: number }>
  const tiers = tc.tiers as Record<Tier, { risers_per_group: number; group_size: number }>

  const newCounts = { ...counts, [tier]: counts[tier] + 1 }

  // Check riser usage across all tiers
  let risersUsed = 0
  for (const t of VALID_TIERS) {
    const cfg = tiers[t]
    if (!cfg) continue
    risersUsed += Math.ceil(newCounts[t] / cfg.group_size) * cfg.risers_per_group
  }
  if (risersUsed > totalRisers) {
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
    return `${tierLabel} tier is full — not enough step risers available (${totalRisers} total, ${risersUsed} needed).`
  }

  // Check ball stock for this tier
  const ballCfg = balls[tier]
  if (ballCfg) {
    const groupsNeeded = Math.ceil(newCounts[tier] / tiers[tier].group_size)
    if (groupsNeeded > ballCfg.stock) {
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
      return `${tierLabel} tier is full — not enough ${ballCfg.weight} slam balls available.`
    }
  }
  return null
}

// ─── Main handler ─────────────────────────────────────────────────────────────

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
    const tier = abilityTier as Tier

    // Fetch schedule + challenge config
    const { data: schedule } = await supabase
      .from('challenge_schedules')
      .select('id, trainer_id, max_capacity, current_bookings, status, challenge:challenge_id(id, tier_capacity)')
      .eq('id', challengeScheduleId)
      .single()

    if (!schedule) return NextResponse.json({ error: 'Challenge session not found.' }, { status: 404 })
    if (schedule.status === 'cancelled') return NextResponse.json({ error: 'This session has been cancelled.' }, { status: 400 })

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

    // Fetch client gender for KB allocation
    const { data: clientData } = await supabase
      .from('user_profiles')
      .select('gender')
      .eq('id', clientId)
      .maybeSingle()
    const clientGender = (clientData as any)?.gender ?? null

    // Get current booking counts per tier (include gender for KB checks)
    const { data: existingBookings } = await supabase
      .from('challenge_bookings')
      .select('ability_tier, client_id')
      .eq('challenge_schedule_id', challengeScheduleId)
      .neq('booking_status', 'cancelled')

    // Fetch genders for all booked clients
    const bookedClientIds = (existingBookings || []).map((b: any) => b.client_id).filter(Boolean)
    const { data: clientProfiles } = bookedClientIds.length > 0
      ? await supabase.from('user_profiles').select('id, gender').in('id', bookedClientIds)
      : { data: [] }
    const genderMap: Record<string, string | null> = {}
    for (const p of clientProfiles || []) genderMap[(p as any).id] = (p as any).gender ?? null

    const counts: Record<Tier, number> = { grey: 0, blue: 0, black: 0 }
    let totalCount = 0
    for (const b of existingBookings || []) {
      if ((b as any).ability_tier && VALID_TIERS.includes((b as any).ability_tier as Tier)) {
        counts[(b as any).ability_tier as Tier]++
      }
      totalCount++
    }

    // Flatten bookings to { ability_tier, gender } for checkStrength
    const bookingsForCheck = (existingBookings || []).map((b: any) => ({
      ability_tier: b.ability_tier ?? null,
      gender: genderMap[b.client_id] ?? null,
    }))

    // Run resource capacity check
    const challenge = (schedule as any).challenge
    const tc = challenge?.tier_capacity as any

    if (tc?.mode === 'resource' && tier) {
      let blockMsg: string | null = null

      // Determine which challenge type based on config shape
      if (tc.kettlebells) {
        blockMsg = checkStrength(tc, tier, clientGender, bookingsForCheck)
      } else if (tc.total_ropes != null) {
        blockMsg = checkSpeed(tc, totalCount)
      } else if (tc.total_risers != null) {
        blockMsg = checkPower(tc, tier, counts)
      } else if (tc.tiers?.[tier]?.stock != null) {
        blockMsg = checkEndurance(tc, tier, counts[tier])
      }

      if (blockMsg) return NextResponse.json({ error: blockMsg }, { status: 403 })

    } else if (tc && !tc.mode && tier) {
      // Legacy simple per-tier cap
      const tierMax = tc[tier] as number | null
      if (tierMax != null && counts[tier] >= tierMax) {
        const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
        return NextResponse.json({ error: `${tierLabel} tier is full for this session.` }, { status: 403 })
      }
    } else {
      // Fallback: overall capacity check
      const maxCap = schedule.max_capacity ?? 0
      if (maxCap > 0 && totalCount >= maxCap) {
        return NextResponse.json({ error: 'This session is full.' }, { status: 403 })
      }
    }

    // Insert or re-activate booking
    if (existing && existing.booking_status === 'cancelled') {
      await supabase
        .from('challenge_bookings')
        .update({ booking_status: 'confirmed', booking_date: new Date().toISOString(), ability_tier: tier || null })
        .eq('id', existing.id)
    } else {
      await supabase.from('challenge_bookings').insert({
        challenge_schedule_id: challengeScheduleId,
        client_id: clientId,
        trainer_id: schedule.trainer_id,
        booking_status: 'confirmed',
        booking_date: new Date().toISOString(),
        ability_tier: tier || null,
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

    logger.log(`Challenge booked: ${clientId} → ${challengeScheduleId} (tier: ${tier ?? 'none'})`)
    return NextResponse.json({ success: true, status: 'confirmed' })

  } catch (error: any) {
    logger.error('book-challenge error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book session' }, { status: 500 })
  }
}
