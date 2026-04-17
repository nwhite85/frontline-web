import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Fetch bookings and challenge schedule config in parallel
    const [bookingsRes, scheduleRes] = await Promise.all([
      supabase
        .from('challenge_bookings')
        .select('id, client_id, booking_status, ability_tier')
        .eq('challenge_schedule_id', scheduleId)
        .in('booking_status', ['booked', 'confirmed']),
      supabase
        .from('challenge_schedules')
        .select('is_locked, locked_kit, challenges(tier_capacity)')
        .eq('id', scheduleId)
        .single(),
    ])

    if (bookingsRes.error) {
      return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 })
    }

    const rows = bookingsRes.data || []
    const tierCapacity = (scheduleRes.data as any)?.challenges?.tier_capacity ?? null
    const isLocked = !!(scheduleRes.data as any)?.is_locked

    let result = rows as any[]

    if (rows.length > 0) {
      const clientIds = rows.map((b: any) => b.client_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email, gender')
        .in('id', clientIds)

      const profileMap: Record<string, { name: string; email: string; gender: string | null }> = {}
      ;(profiles || []).forEach((p: any) => {
        profileMap[p.id] = { name: p.name || 'Unknown', email: p.email || '', gender: p.gender ?? null }
      })

      result = rows.map((b: any) => ({
        ...b,
        user_profiles: profileMap[b.client_id] || { name: 'Unknown', email: '', gender: null },
      }))
    }

    // Compute equipment summary for any checkpoint type
    type EquipmentItem = { weight: string; needed: number; available: number }
    type EquipmentSection = { label: string; items: EquipmentItem[] }
    let equipment_summary: EquipmentSection[] | null = null

    if (tierCapacity) {
      const sections: EquipmentSection[] = []

      // Kettlebells — Strength Checkpoint
      if (tierCapacity.tiers && tierCapacity.kettlebells) {
        const count: Record<string, number> = {}
        for (const booking of result) {
          const tier = booking.ability_tier as string | null
          const gender = booking.user_profiles?.gender as string | null
          if (!tier) continue
          const tierWeights = tierCapacity.tiers[tier]
          if (!tierWeights) continue
          const weight: string = gender === 'male' ? (tierWeights.male ?? tierWeights.female) : (tierWeights.female ?? tierWeights.male)
          if (!weight) continue
          count[weight] = (count[weight] || 0) + (tierCapacity.kbs_per_person ?? 1)
        }
        // Round up to nearest pair_size if configured (e.g. pair_size: 2 for partner workouts)
        const pairSize = tierCapacity.pair_size as number | undefined
        if (pairSize && pairSize > 1) {
          for (const w of Object.keys(count)) count[w] = Math.ceil(count[w] / pairSize) * pairSize
        }
        const items = Object.keys(tierCapacity.kettlebells)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .filter(w => (count[w] || 0) > 0)
          .map(w => ({ weight: w, needed: count[w] || 0, available: tierCapacity.kettlebells[w] }))
        if (items.length > 0) sections.push({ label: 'Kettlebells needed', items })
      }

      // Powerbags — Endurance Checkpoint
      if (tierCapacity.tiers && tierCapacity.powerbags) {
        const count: Record<string, number> = {}
        for (const booking of result) {
          const tier = booking.ability_tier as string | null
          const gender = booking.user_profiles?.gender as string | null
          if (!tier) continue
          const tierWeights = tierCapacity.tiers[tier]
          if (!tierWeights) continue
          const weight: string = gender === 'male' ? (tierWeights.male ?? tierWeights.female) : (tierWeights.female ?? tierWeights.male)
          if (!weight) continue
          count[weight] = (count[weight] || 0) + (tierCapacity.bags_per_person ?? 1)
        }
        const items = Object.keys(tierCapacity.powerbags)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .filter(w => (count[w] || 0) > 0)
          .map(w => ({ weight: w, needed: count[w] || 0, available: tierCapacity.powerbags[w] }))
        if (items.length > 0) sections.push({ label: 'Powerbags needed', items })
      }

      // Dumbbells — Endurance Checkpoint (separate tier mapping)
      if (tierCapacity.dumbbell_tiers && tierCapacity.dumbbells) {
        const count: Record<string, number> = {}
        for (const booking of result) {
          const tier = booking.ability_tier as string | null
          const gender = booking.user_profiles?.gender as string | null
          if (!tier) continue
          const tierWeights = tierCapacity.dumbbell_tiers[tier]
          if (!tierWeights) continue
          const weight: string = gender === 'male' ? (tierWeights.male ?? tierWeights.female) : (tierWeights.female ?? tierWeights.male)
          if (!weight) continue
          count[weight] = (count[weight] || 0) + 1
        }
        const items = Object.keys(tierCapacity.dumbbells)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .filter(w => (count[w] || 0) > 0)
          .map(w => ({ weight: w, needed: count[w] || 0, available: tierCapacity.dumbbells[w] }))
        if (items.length > 0) sections.push({ label: 'Dumbbells needed', items })
      }

      // Battle ropes — Speed Checkpoint
      if (tierCapacity.total_ropes != null && tierCapacity.people_per_rope) {
        const ropesNeeded = Math.ceil(result.length / tierCapacity.people_per_rope)
        if (ropesNeeded > 0) {
          sections.push({ label: 'Ropes needed', items: [{ weight: 'Battle rope', needed: ropesNeeded, available: tierCapacity.total_ropes }] })
        }
      }

      // Medicine balls + risers — Power Checkpoint (1 ball per group of 4, not per person)
      if (tierCapacity.balls) {
        // Count people per tier first, then convert to groups
        const tierCounts: Record<string, number> = {}
        for (const booking of result) {
          const tier = booking.ability_tier as string | null
          if (!tier) continue
          tierCounts[tier] = (tierCounts[tier] || 0) + 1
        }
        const ballCount: Record<string, { needed: number; available: number }> = {}
        for (const [tier, count] of Object.entries(tierCounts)) {
          const ballInfo = (tierCapacity.balls as any)[tier]
          if (!ballInfo) continue
          const groupSize = (tierCapacity.tiers as any)?.[tier]?.group_size ?? 4
          const ballsNeeded = Math.ceil(count / groupSize)
          const key = ballInfo.weight as string
          if (!ballCount[key]) ballCount[key] = { needed: 0, available: ballInfo.stock }
          ballCount[key].needed += ballsNeeded
        }
        const ballItems = Object.entries(ballCount)
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
          .filter(([, v]) => v.needed > 0)
          .map(([w, v]) => ({ weight: w, needed: v.needed, available: v.available }))
        if (ballItems.length > 0) sections.push({ label: 'Medicine balls needed', items: ballItems })

        // Risers
        if (tierCapacity.tiers && tierCapacity.total_risers != null) {
          const tierGroups: Record<string, number> = {}
          for (const booking of result) {
            const tier = booking.ability_tier as string | null
            if (!tier) continue
            tierGroups[tier] = (tierGroups[tier] || 0) + 1
          }
          let totalRisersNeeded = 0
          for (const [tier, tierCount] of Object.entries(tierGroups)) {
            const tierInfo = (tierCapacity.tiers as any)[tier]
            if (!tierInfo?.group_size || !tierInfo?.risers_per_group) continue
            totalRisersNeeded += Math.ceil((tierCount as number) / tierInfo.group_size) * tierInfo.risers_per_group
          }
          if (totalRisersNeeded > 0) {
            sections.push({ label: 'Risers needed', items: [{ weight: 'Risers', needed: totalRisersNeeded, available: tierCapacity.total_risers }] })
          }
        }
      }

      if (sections.length > 0) equipment_summary = sections
    }

    return NextResponse.json({ bookings: result, equipment_summary, is_locked: isLocked })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch bookings'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
