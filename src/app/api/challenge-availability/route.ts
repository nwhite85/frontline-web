import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const VALID_TIERS = ['grey', 'blue', 'black'] as const
type Tier = typeof VALID_TIERS[number]
type TierStatus = 'available' | 'full'

// Generic check for gender-split equipment pools (kettlebells, power bags, etc.)
function equipmentPoolFull(
  stock: Record<string, number>,
  itemsPerPerson: number,
  tiers: Record<Tier, { female: string; male: string }>,
  tier: Tier,
  gender: 'male' | 'female',
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): boolean {
  const usage: Record<string, number> = {}
  for (const b of bookings) {
    const t = b.ability_tier as Tier | null
    if (!t || !tiers[t]) continue
    const g = b.gender === 'male' ? 'male' : 'female'
    const weight = tiers[t][g]
    usage[weight] = (usage[weight] || 0) + itemsPerPerson
  }
  const tierCfg = tiers[tier]
  if (!tierCfg) return false
  const weight = tierCfg[gender]
  return (usage[weight] ?? 0) + itemsPerPerson > (stock[weight] ?? 0)
}

function strengthFull(
  tc: any,
  tier: Tier,
  gender: 'male' | 'female',
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): boolean {
  return equipmentPoolFull(tc.kettlebells, (tc.kbs_per_person as number) ?? 2, tc.tiers, tier, gender, bookings)
}

function endurancePowerbagFull(
  tc: any,
  tier: Tier,
  gender: 'male' | 'female',
  bookings: Array<{ ability_tier: string | null; gender: string | null }>
): boolean {
  return equipmentPoolFull(tc.powerbags, (tc.bags_per_person as number) ?? 1, tc.tiers, tier, gender, bookings)
}

function speedFull(tc: any, totalCount: number): boolean {
  return totalCount + 1 > (tc.total_ropes as number) * (tc.people_per_rope as number)
}

function enduranceFull(tc: any, tier: Tier, tierCount: number): boolean {
  const stock = tc.tiers?.[tier]?.stock as number | undefined
  return stock != null && tierCount + 1 > stock
}

function powerFull(tc: any, tier: Tier, counts: Record<Tier, number>): boolean {
  const totalRisers = tc.total_risers as number
  const balls = tc.balls as Record<Tier, { weight: string; stock: number }>
  const tiers = tc.tiers as Record<Tier, { risers_per_group: number; group_size: number }>

  const newCounts = { ...counts, [tier]: counts[tier] + 1 }

  let risersUsed = 0
  for (const t of VALID_TIERS) {
    const cfg = tiers[t]
    if (!cfg) continue
    risersUsed += Math.ceil(newCounts[t] / cfg.group_size) * cfg.risers_per_group
  }
  if (risersUsed > totalRisers) return true

  const ballCfg = balls[tier]
  if (ballCfg) {
    const groupsNeeded = Math.ceil(newCounts[tier] / tiers[tier].group_size)
    if (groupsNeeded > ballCfg.stock) return true
  }
  return false
}

// ─── GET /api/challenge-availability?scheduleId=...&gender=male|female ────────
//
// Returns per-tier availability for a checkpoint session.
// gender is optional — if omitted, availability is checked for female (worst case for grey/blue).
// The client app should pass the authed user's gender for accurate results.
//
// Response: { mode: 'resource'|'simple'|'unknown', tiers: { grey, blue, black }, sessionFull: boolean }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const gender = searchParams.get('gender') === 'male' ? 'male' : 'female'

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Fetch schedule + challenge config
    const { data: schedule } = await supabase
      .from('challenge_schedules')
      .select('id, max_capacity, current_bookings, status, challenge:challenge_id(id, tier_capacity)')
      .eq('id', scheduleId)
      .single()

    if (!schedule) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (schedule.status === 'cancelled') {
      return NextResponse.json({ mode: 'cancelled', tiers: { grey: 'full', blue: 'full', black: 'full' }, sessionFull: true })
    }

    const tc = (schedule as any).challenge?.tier_capacity as any

    // ── Non-resource mode: simple headcount ──
    if (!tc?.mode || tc.mode !== 'resource') {
      const maxCap = schedule.max_capacity ?? 0
      const current = schedule.current_bookings ?? 0
      const full = maxCap > 0 && current >= maxCap
      return NextResponse.json({
        mode: 'simple',
        tiers: { grey: full ? 'full' : 'available', blue: full ? 'full' : 'available', black: full ? 'full' : 'available' },
        sessionFull: full,
        maxCapacity: maxCap > 0 ? maxCap : null,
      })
    }

    // ── Resource mode: fetch existing bookings with gender ──
    const { data: existingBookings } = await supabase
      .from('challenge_bookings')
      .select('ability_tier, client_id')
      .eq('challenge_schedule_id', scheduleId)
      .neq('booking_status', 'cancelled')

    // Fetch genders separately (no FK relationship on challenge_bookings)
    const bookedClientIds = (existingBookings || []).map((b: any) => b.client_id).filter(Boolean)
    const { data: clientProfiles } = bookedClientIds.length > 0
      ? await supabase.from('user_profiles').select('id, gender').in('id', bookedClientIds)
      : { data: [] }
    const genderMap: Record<string, string | null> = {}
    for (const p of clientProfiles || []) genderMap[(p as any).id] = (p as any).gender ?? null

    const bookingsForCheck = (existingBookings || []).map((b: any) => ({
      ability_tier: b.ability_tier ?? null,
      gender: genderMap[b.client_id] ?? null,
    }))

    const counts: Record<Tier, number> = { grey: 0, blue: 0, black: 0 }
    let totalCount = 0
    for (const b of bookingsForCheck) {
      if (b.ability_tier && VALID_TIERS.includes(b.ability_tier as Tier)) {
        counts[b.ability_tier as Tier]++
      }
      totalCount++
    }

    // ── Check each tier for the given gender ──
    const tierResult: Record<Tier, TierStatus> = { grey: 'available', blue: 'available', black: 'available' }

    for (const tier of VALID_TIERS) {
      let full = false
      if (tc.kettlebells) {
        full = strengthFull(tc, tier, gender, bookingsForCheck)
      } else if (tc.powerbags) {
        full = endurancePowerbagFull(tc, tier, gender, bookingsForCheck)
      } else if (tc.total_ropes != null) {
        full = speedFull(tc, totalCount)
      } else if (tc.total_risers != null) {
        full = powerFull(tc, tier, counts)
      } else if (tc.tiers?.[tier]?.stock != null) {
        full = enduranceFull(tc, tier, counts[tier])
      }
      tierResult[tier] = full ? 'full' : 'available'
    }

    const sessionFull = VALID_TIERS.every(t => tierResult[t] === 'full')

    // ── Compute equipment-based display capacity for progress bar ──
    let maxCapacity: number | null = null
    if (tc.kettlebells) {
      // Sum floor(stock / kbs_per_person) for each unique weight
      const kbsPerPerson = (tc.kbs_per_person as number) ?? 2
      const stock = tc.kettlebells as Record<string, number>
      maxCapacity = Object.values(stock).reduce((sum, qty) => sum + Math.floor(qty / kbsPerPerson), 0)
    } else if (tc.powerbags) {
      // Sum floor(stock / bags_per_person) for each unique weight
      const bagsPerPerson = (tc.bags_per_person as number) ?? 1
      const stock = tc.powerbags as Record<string, number>
      maxCapacity = Object.values(stock).reduce((sum, qty) => sum + Math.floor(qty / bagsPerPerson), 0)
    } else if (tc.total_ropes != null) {
      maxCapacity = (tc.total_ropes as number) * (tc.people_per_rope as number)
    } else if (tc.tiers) {
      // Simple per-tier stock (endurance simple / power fallback)
      const tierStocks = VALID_TIERS.map(t => (tc.tiers[t]?.stock as number | undefined) ?? 0)
      const total = tierStocks.reduce((a, b) => a + b, 0)
      maxCapacity = total > 0 ? total : (schedule.max_capacity ?? null)
    } else {
      maxCapacity = schedule.max_capacity ?? null
    }

    return NextResponse.json({ mode: 'resource', tiers: tierResult, sessionFull, maxCapacity })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check availability' }, { status: 500 })
  }
}
