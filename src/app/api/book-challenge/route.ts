import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'
import { isCreditPlan, isRecurringClassPlan } from '@/lib/membership'

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

function checkEquipmentPool(
  stock: Record<string, number>,
  itemsPerPerson: number,
  tiers: Record<Tier, { female: string; male: string }>,
  tier: Tier,
  gender: string | null,
  bookings: Array<{ ability_tier: string | null; gender: string | null }>,
  equipmentName: string
): string | null {
  const usage: Record<string, number> = {}
  for (const b of bookings) {
    const t = b.ability_tier as Tier | null
    if (!t || !tiers[t]) continue
    const g = b.gender === 'male' ? 'male' : 'female'
    const weight = tiers[t][g]
    usage[weight] = (usage[weight] || 0) + itemsPerPerson
  }
  const tierCfg = tiers[tier]
  if (!tierCfg) return null
  const g = gender === 'male' ? 'male' : 'female'
  const weight = tierCfg[g]
  const currentUsage = usage[weight] ?? 0
  const available = stock[weight] ?? 0
  if (currentUsage + itemsPerPerson > available) {
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
    return `${tierLabel} tier is full — not enough ${weight} ${equipmentName} available (${available} in stock, ${currentUsage + itemsPerPerson} needed).`
  }
  return null
}

function checkStrength(
  tc: any,
  tier: Tier,
  gender: string | null,
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): string | null {
  return checkEquipmentPool(tc.kettlebells, tc.kbs_per_person ?? 2, tc.tiers, tier, gender, bookings, 'kettlebells')
}

function checkEndurancePowerbag(
  tc: any,
  tier: Tier,
  gender: string | null,
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): string | null {
  return checkEquipmentPool(tc.powerbags, tc.bags_per_person ?? 1, tc.tiers, tier, gender, bookings, 'power bags')
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

function checkPower(
  tc: any,
  tier: Tier,
  gender: string | null,
  counts: Record<Tier, number>,
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): string | null {
  const totalRisers = tc.total_risers as number
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  if (tc.gender_tiers) {
    type GTC = { risers_each_side: number; ball_kg: string }
    const genderTiers = tc.gender_tiers as Record<string, Record<string, GTC>>
    const groupSize: number = tc.group_size ?? 4
    const medBalls = tc.med_balls as Record<string, { stock: number }> | undefined

    const ballGroups: Record<string, { count: number; maxRisersEachSide: number }> = {}
    for (const b of bookings) {
      const t = b.ability_tier
      const g = b.gender ?? 'female'
      if (!t || !genderTiers[t]) continue
      const cfg: GTC = genderTiers[t][g] ?? genderTiers[t]['female'] ?? genderTiers[t]['male']
      if (!cfg) continue
      if (!ballGroups[cfg.ball_kg]) ballGroups[cfg.ball_kg] = { count: 0, maxRisersEachSide: 0 }
      ballGroups[cfg.ball_kg].count++
      if (cfg.risers_each_side > ballGroups[cfg.ball_kg].maxRisersEachSide)
        ballGroups[cfg.ball_kg].maxRisersEachSide = cfg.risers_each_side
    }
    const g = gender ?? 'female'
    const newCfg: GTC | undefined = genderTiers[tier]?.[g] ?? genderTiers[tier]?.['female'] ?? genderTiers[tier]?.['male']
    if (newCfg) {
      if (!ballGroups[newCfg.ball_kg]) ballGroups[newCfg.ball_kg] = { count: 0, maxRisersEachSide: 0 }
      ballGroups[newCfg.ball_kg].count++
      if (newCfg.risers_each_side > ballGroups[newCfg.ball_kg].maxRisersEachSide)
        ballGroups[newCfg.ball_kg].maxRisersEachSide = newCfg.risers_each_side
    }
    let risersUsed = 0
    for (const { count, maxRisersEachSide } of Object.values(ballGroups)) {
      risersUsed += Math.ceil(count / groupSize) * maxRisersEachSide * 2
    }
    if (risersUsed > totalRisers) {
      return `${tierLabel} tier is full — not enough step risers available (${totalRisers} total, ${risersUsed} needed).`
    }
    if (newCfg && medBalls) {
      const stock = medBalls[newCfg.ball_kg]?.stock ?? Infinity
      const groupsNeeded = Math.ceil(ballGroups[newCfg.ball_kg].count / groupSize)
      if (groupsNeeded > stock) {
        return `${tierLabel} tier is full — not enough ${newCfg.ball_kg}kg medicine balls available.`
      }
    }
    return null
  }

  // Legacy: tier-only config
  const balls = tc.balls as Record<Tier, { weight: string; stock: number }> | undefined
  const tiers = tc.tiers as Record<Tier, { risers_per_group: number; group_size: number }> | undefined
  if (!tiers) return null

  const newCounts = { ...counts, [tier]: counts[tier] + 1 }
  let risersUsed = 0
  for (const t of VALID_TIERS) {
    const cfg = tiers[t]
    if (!cfg) continue
    risersUsed += Math.ceil(newCounts[t] / cfg.group_size) * cfg.risers_per_group
  }
  if (risersUsed > totalRisers) {
    return `${tierLabel} tier is full — not enough step risers available (${totalRisers} total, ${risersUsed} needed).`
  }
  const ballCfg = balls?.[tier]
  if (ballCfg && tiers[tier]) {
    const groupsNeeded = Math.ceil(newCounts[tier] / tiers[tier].group_size)
    if (groupsNeeded > ballCfg.stock) {
      return `${tierLabel} tier is full — not enough ${ballCfg.weight} slam balls available.`
    }
  }
  return null
}

// ─── Waitlist helper ──────────────────────────────────────────────────────────

async function addToWaitlist(
  supabase: ReturnType<typeof createClient>,
  existing: { id: string; booking_status: string } | null,
  challengeScheduleId: string,
  clientId: string,
  trainerId: string,
  tier: Tier | undefined,
): Promise<NextResponse> {
  if (existing && existing.booking_status === 'cancelled') {
    await (supabase as any)
      .from('challenge_bookings')
      .update({ booking_status: 'waitlist', booking_date: new Date().toISOString(), ability_tier: tier || null })
      .eq('id', existing.id)
  } else {
    await (supabase as any).from('challenge_bookings').insert({
      challenge_schedule_id: challengeScheduleId,
      client_id: clientId,
      trainer_id: trainerId,
      booking_status: 'waitlist',
      booking_date: new Date().toISOString(),
      ability_tier: tier || null,
    })
  }
  logger.log(`Challenge waitlist: ${clientId} → ${challengeScheduleId} (tier: ${tier ?? 'none'})`)
  return NextResponse.json({ success: true, status: 'waitlist' })
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

    // ── Membership / credit gate ──────────────────────────────────────────────
    const { data: memberships } = await supabase
      .from('client_memberships')
      .select('id, class_credits_remaining, membership_plans(plan_type, includes_classes)')
      .eq('client_id', clientId)
      .eq('status', 'active')

    const recurringMembership = (memberships || []).find((m: any) =>
      isRecurringClassPlan(m.membership_plans)
    ) as any | undefined

    const creditMembership = !recurringMembership
      ? (memberships || []).find((m: any) =>
          isCreditPlan(m.membership_plans) && (m.class_credits_remaining ?? 0) > 0
        ) as any | undefined
      : undefined

    if (!recurringMembership && !creditMembership) {
      const hasExpiredCredits = (memberships || []).some((m: any) => isCreditPlan(m.membership_plans))
      return NextResponse.json({
        error: hasExpiredCredits
          ? 'You have no credits remaining. Please purchase a new credit pack.'
          : 'You need an active membership or credits to book this session.',
      }, { status: 403 })
    }

    const useCredits = !recurringMembership
    const paymentStatus = useCredits ? 'credit' : 'included'
    // ─────────────────────────────────────────────────────────────────────────

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

    // Get current confirmed booking counts per tier (exclude waitlist from capacity checks)
    const { data: existingBookings } = await supabase
      .from('challenge_bookings')
      .select('ability_tier, client_id')
      .eq('challenge_schedule_id', challengeScheduleId)
      .eq('booking_status', 'confirmed')

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
      } else if (tc.powerbags) {
        blockMsg = checkEndurancePowerbag(tc, tier, clientGender, bookingsForCheck)
      } else if (tc.total_ropes != null) {
        blockMsg = checkSpeed(tc, totalCount)
      } else if (tc.total_risers != null) {
        blockMsg = checkPower(tc, tier, clientGender, counts, bookingsForCheck)
      } else if (tc.tiers?.[tier]?.stock != null) {
        blockMsg = checkEndurance(tc, tier, counts[tier])
      }

      if (blockMsg) {
        // Slot full — add to waitlist instead of rejecting
        return await addToWaitlist(supabase as any, existing, challengeScheduleId, clientId, schedule.trainer_id, tier)
      }

    } else if (tc && !tc.mode && tier) {
      // Legacy simple per-tier cap
      const tierMax = tc[tier] as number | null
      if (tierMax != null && counts[tier] >= tierMax) {
        return await addToWaitlist(supabase as any, existing, challengeScheduleId, clientId, schedule.trainer_id, tier)
      }
    } else {
      // Fallback: overall capacity check
      const maxCap = schedule.max_capacity ?? 0
      if (maxCap > 0 && totalCount >= maxCap) {
        return await addToWaitlist(supabase as any, existing, challengeScheduleId, clientId, schedule.trainer_id, tier)
      }
    }

    // Insert or re-activate booking as confirmed
    if (existing && existing.booking_status === 'cancelled') {
      await (supabase as any)
        .from('challenge_bookings')
        .update({ booking_status: 'confirmed', booking_date: new Date().toISOString(), ability_tier: tier || null })
        .eq('id', existing.id)
    } else {
      await (supabase as any).from('challenge_bookings').insert({
        challenge_schedule_id: challengeScheduleId,
        client_id: clientId,
        trainer_id: schedule.trainer_id,
        booking_status: 'confirmed',
        booking_date: new Date().toISOString(),
        ability_tier: tier || null,
      })
    }

    // Update current_bookings — confirmed only
    const { count: newTotal } = await supabase
      .from('challenge_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_schedule_id', challengeScheduleId)
      .eq('booking_status', 'confirmed')

    await supabase
      .from('challenge_schedules')
      .update({ current_bookings: newTotal ?? 0 })
      .eq('id', challengeScheduleId)

    // Deduct credit if using credit package
    if (useCredits && creditMembership) {
      const remaining = (creditMembership.class_credits_remaining ?? 1) - 1
      await supabase
        .from('client_memberships')
        .update({ class_credits_remaining: remaining })
        .eq('id', creditMembership.id)
      logger.log(`Challenge booking: credit deducted for ${clientId} — ${remaining} remaining`)
    }

    logger.log(`Challenge booked: ${clientId} → ${challengeScheduleId} (tier: ${tier ?? 'none'}, ${paymentStatus})`)
    return NextResponse.json({ success: true, status: 'confirmed' })

  } catch (error: any) {
    logger.error('book-challenge error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book session' }, { status: 500 })
  }
}
