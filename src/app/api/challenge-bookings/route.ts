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

    // Fetch bookings and challenge tier_capacity in parallel
    const [bookingsRes, scheduleRes] = await Promise.all([
      supabase
        .from('challenge_bookings')
        .select('id, client_id, booking_status, ability_tier')
        .eq('challenge_schedule_id', scheduleId)
        .in('booking_status', ['booked', 'confirmed']),
      supabase
        .from('challenge_schedules')
        .select('challenges(tier_capacity)')
        .eq('id', scheduleId)
        .single(),
    ])

    if (bookingsRes.error) {
      return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 })
    }

    const rows = bookingsRes.data || []
    const tierCapacity = (scheduleRes.data as any)?.challenges?.tier_capacity ?? null

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

    // Compute KB equipment summary if tier_capacity has the right shape
    let kb_summary: { weight: string; needed: number; available: number }[] | null = null
    if (tierCapacity?.tiers && tierCapacity?.kettlebells) {
      const kbCount: Record<string, number> = {}
      for (const booking of result) {
        const tier = booking.ability_tier as string | null
        const gender = booking.user_profiles?.gender as string | null
        if (!tier) continue
        const tierWeights = tierCapacity.tiers[tier]
        if (!tierWeights) continue
        // Use gender-specific weight; fall back to female weight if unknown
        const weight: string = gender === 'male' ? (tierWeights.male ?? tierWeights.female) : (tierWeights.female ?? tierWeights.male)
        if (!weight) continue
        kbCount[weight] = (kbCount[weight] || 0) + (tierCapacity.kbs_per_person ?? 1)
      }
      // Build summary in weight order
      const allWeights = Object.keys(tierCapacity.kettlebells).sort((a, b) => parseFloat(a) - parseFloat(b))
      kb_summary = allWeights
        .filter(w => (kbCount[w] || 0) > 0 || tierCapacity.kettlebells[w] > 0)
        .map(w => ({
          weight: w,
          needed: kbCount[w] || 0,
          available: tierCapacity.kettlebells[w] || 0,
        }))
        .filter(s => s.needed > 0)
    }

    return NextResponse.json({ bookings: result, kb_summary })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch bookings'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
