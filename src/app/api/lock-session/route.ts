import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/lock-session
// Body: { scheduleId: string, type: 'challenge' | 'class', lock: boolean }
// Locks or unlocks a session. For challenges, computes locked_kit from current bookings.
// For classes, records locked_capacity as current booking count.
export async function POST(req: NextRequest) {
  try {
    const { scheduleId, type, lock } = await req.json() as {
      scheduleId: string
      type: 'challenge' | 'class'
      lock: boolean
    }

    if (!scheduleId || !type) {
      return NextResponse.json({ error: 'scheduleId and type are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    if (!lock) {
      // Unlock
      const table = type === 'challenge' ? 'challenge_schedules' : 'class_schedules'
      const update = type === 'challenge'
        ? { is_locked: false, locked_kit: null }
        : { is_locked: false, locked_capacity: null }
      await supabase.from(table).update(update).eq('id', scheduleId)
      return NextResponse.json({ locked: false })
    }

    if (type === 'class') {
      // Count current non-cancelled bookings
      const { count } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_schedule_id', scheduleId)
        .neq('booking_status', 'cancelled')

      await supabase
        .from('class_schedules')
        .update({ is_locked: true, locked_capacity: count ?? 0 })
        .eq('id', scheduleId)

      return NextResponse.json({ locked: true, locked_capacity: count ?? 0 })
    }

    // Challenge lockdown — compute kit snapshot
    const { data: schedule } = await supabase
      .from('challenge_schedules')
      .select('challenge:challenge_id(tier_capacity)')
      .eq('id', scheduleId)
      .single()

    const tc = (schedule as any)?.challenge?.tier_capacity as any
    if (!tc) {
      return NextResponse.json({ error: 'No tier_capacity config for this challenge' }, { status: 400 })
    }

    // Fetch all current confirmed bookings with gender
    const { data: bookings } = await supabase
      .from('challenge_bookings')
      .select('ability_tier, client_id')
      .eq('challenge_schedule_id', scheduleId)
      .neq('booking_status', 'cancelled')

    const clientIds = (bookings || []).map((b: any) => b.client_id).filter(Boolean)
    const { data: profiles } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, gender').in('id', clientIds)
      : { data: [] }

    const genderMap: Record<string, string | null> = {}
    for (const p of profiles || []) genderMap[(p as any).id] = (p as any).gender ?? null

    const enriched = (bookings || []).map((b: any) => ({
      ability_tier: b.ability_tier ?? null,
      gender: genderMap[b.client_id] ?? null,
    }))

    // Compute locked_kit — one entry per equipment type
    const locked_kit: Record<string, Record<string, number>> = {}

    function countByWeight(
      tierMap: Record<string, { male: string; female: string }>,
      itemsPerPerson: number
    ): Record<string, number> {
      const count: Record<string, number> = {}
      for (const b of enriched) {
        const tier = b.ability_tier as string | null
        const gender = b.gender === 'male' ? 'male' : 'female'
        if (!tier || !tierMap[tier]) continue
        const weight = tierMap[tier][gender]
        if (!weight) continue
        count[weight] = (count[weight] || 0) + itemsPerPerson
      }
      return count
    }

    if (tc.kettlebells && tc.tiers) {
      locked_kit.kettlebells = countByWeight(tc.tiers, (tc.kbs_per_person as number) ?? 2)
    }
    if (tc.powerbags && tc.tiers) {
      locked_kit.powerbags = countByWeight(tc.tiers, (tc.bags_per_person as number) ?? 1)
    }
    if (tc.dumbbell_tiers && tc.dumbbells) {
      locked_kit.dumbbells = countByWeight(tc.dumbbell_tiers, 1)
    }
    if (tc.total_ropes != null && tc.people_per_rope) {
      const ropesNeeded = Math.ceil(enriched.length / (tc.people_per_rope as number))
      locked_kit.ropes = { 'Battle rope': ropesNeeded }
    }
    if (tc.balls) {
      const ballCount: Record<string, number> = {}
      for (const b of enriched) {
        const tier = b.ability_tier as string | null
        if (!tier) continue
        const ballInfo = (tc.balls as any)[tier]
        if (!ballInfo) continue
        ballCount[ballInfo.weight] = (ballCount[ballInfo.weight] || 0) + 1
      }
      locked_kit.balls = ballCount
      if (tc.total_risers != null && tc.tiers) {
        const tierGroups: Record<string, number> = {}
        for (const b of enriched) {
          if (b.ability_tier) tierGroups[b.ability_tier] = (tierGroups[b.ability_tier] || 0) + 1
        }
        let risers = 0
        for (const [tier, cnt] of Object.entries(tierGroups)) {
          const t = (tc.tiers as any)[tier]
          if (t?.group_size && t?.risers_per_group) {
            risers += Math.ceil((cnt as number) / t.group_size) * t.risers_per_group
          }
        }
        locked_kit.risers = { Risers: risers }
      }
    }

    await supabase
      .from('challenge_schedules')
      .update({ is_locked: true, locked_kit })
      .eq('id', scheduleId)

    return NextResponse.json({ locked: true, locked_kit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to lock session' }, { status: 500 })
  }
}
