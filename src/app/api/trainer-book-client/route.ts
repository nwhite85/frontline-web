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
    const { type, scheduleId, clientId, bypass, abilityTier } = await request.json()

    if (!type || !scheduleId || !clientId) {
      return NextResponse.json({ error: 'type, scheduleId, and clientId are required' }, { status: 400 })
    }
    if (!['class', 'event', 'challenge'].includes(type)) {
      return NextResponse.json({ error: 'type must be class, event, or challenge' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // ── CLASS ──────────────────────────────────────────────────────────────────
    if (type === 'class') {
      if (!bypass) {
        const { data: membership } = await supabase
          .from('client_memberships')
          .select('id, membership_plans(includes_classes, classes_per_week, classes_per_month)')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .maybeSingle()

        if (!membership) {
          return NextResponse.json({ error: 'Client has no active membership.', bypassable: true }, { status: 403 })
        }

        const plan = (membership as any).membership_plans
        if (plan && !plan.includes_classes) {
          return NextResponse.json({ error: "Client's membership does not include classes.", bypassable: true }, { status: 403 })
        }

        if (plan?.classes_per_week) {
          const now = new Date()
          const day = now.getDay() === 0 ? 6 : now.getDay() - 1
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - day)
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 7)
          const weekStartDate = weekStart.toISOString().split('T')[0]
          const weekEndDate = weekEnd.toISOString().split('T')[0]

          const { data: weekSchedules } = await supabase
            .from('class_schedules')
            .select('id')
            .gte('scheduled_date', weekStartDate)
            .lt('scheduled_date', weekEndDate)

          const weekScheduleIds = (weekSchedules || []).map((s: any) => s.id)

          const { count } = weekScheduleIds.length > 0
            ? await supabase
                .from('class_bookings')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', clientId)
                .neq('booking_status', 'cancelled')
                .in('class_schedule_id', weekScheduleIds)
            : { count: 0 }

          if ((count ?? 0) >= plan.classes_per_week) {
            return NextResponse.json(
              { error: `Client has used all ${plan.classes_per_week} classes this week.`, bypassable: true },
              { status: 403 }
            )
          }
        } else if (plan?.classes_per_month) {
          const now = new Date()
          const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]

          const { data: monthSchedules } = await supabase
            .from('class_schedules')
            .select('id')
            .gte('scheduled_date', monthStartDate)
            .lt('scheduled_date', monthEndDate)

          const monthScheduleIds = (monthSchedules || []).map((s: any) => s.id)

          const { count } = monthScheduleIds.length > 0
            ? await supabase
                .from('class_bookings')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', clientId)
                .neq('booking_status', 'cancelled')
                .in('class_schedule_id', monthScheduleIds)
            : { count: 0 }

          if ((count ?? 0) >= plan.classes_per_month) {
            return NextResponse.json(
              { error: `Client has used all ${plan.classes_per_month} classes this month.`, bypassable: true },
              { status: 403 }
            )
          }
        }
      }

      const { data: schedule } = await supabase
        .from('class_schedules')
        .select('id, trainer_id, max_capacity, current_bookings, status')
        .eq('id', scheduleId)
        .single()

      if (!schedule) return NextResponse.json({ error: 'Class not found.' }, { status: 404 })
      if (schedule.status === 'cancelled') return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 400 })

      const isFull = !bypass && (schedule.max_capacity ?? 0) > 0 && (schedule.current_bookings ?? 0) >= (schedule.max_capacity ?? 0)

      if (isFull) {
        return NextResponse.json({ error: 'Class is full.', bypassable: true }, { status: 403 })
      }

      const { data: existing } = await supabase
        .from('class_bookings')
        .select('id, booking_status')
        .eq('client_id', clientId)
        .eq('class_schedule_id', scheduleId)
        .maybeSingle()

      if (existing && existing.booking_status !== 'cancelled') {
        return NextResponse.json({ error: 'Client is already booked for this class.' }, { status: 400 })
      }

      if (existing?.booking_status === 'cancelled') {
        await supabase
          .from('class_bookings')
          .update({ booking_status: 'confirmed', booking_date: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase.from('class_bookings').insert({
          client_id: clientId,
          class_schedule_id: scheduleId,
          trainer_id: schedule.trainer_id,
          booking_status: 'confirmed',
          payment_status: 'included',
          amount_paid: 0,
          booking_date: new Date().toISOString(),
        })
      }

      await supabase
        .from('class_schedules')
        .update({ current_bookings: (schedule.current_bookings ?? 0) + 1 })
        .eq('id', scheduleId)

      logger.log(`Trainer booked client ${clientId} into class ${scheduleId}${bypass ? ' (bypass)' : ''}`)
      return NextResponse.json({ success: true })
    }

    // ── EVENT ──────────────────────────────────────────────────────────────────
    if (type === 'event') {
      const { data: event } = await supabase
        .from('events')
        .select('id, trainer_id, max_capacity, current_bookings, status')
        .eq('id', scheduleId)
        .single()

      if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })

      if (!bypass && event.max_capacity && (event.current_bookings ?? 0) >= event.max_capacity) {
        return NextResponse.json({ error: 'Event is full.', bypassable: true }, { status: 403 })
      }

      const { data: existing } = await supabase
        .from('event_bookings')
        .select('id, booking_status')
        .eq('event_id', scheduleId)
        .eq('client_id', clientId)
        .maybeSingle()

      if (existing && (existing as any).booking_status !== 'cancelled') {
        return NextResponse.json({ error: 'Client is already booked for this event.' }, { status: 400 })
      }

      await supabase.from('event_bookings').insert({
        event_id: scheduleId,
        client_id: clientId,
        trainer_id: event.trainer_id,
        booking_status: 'confirmed',
        payment_status: 'included',
        amount_paid: 0,
        booking_date: new Date().toISOString(),
      })

      await supabase
        .from('events')
        .update({ current_bookings: (event.current_bookings ?? 0) + 1 })
        .eq('id', scheduleId)

      logger.log(`Trainer booked client ${clientId} into event ${scheduleId}${bypass ? ' (bypass)' : ''}`)
      return NextResponse.json({ success: true })
    }

    // ── CHALLENGE ──────────────────────────────────────────────────────────────
    if (type === 'challenge') {
      const tier = abilityTier as Tier | undefined
      if (abilityTier && !VALID_TIERS.includes(abilityTier)) {
        return NextResponse.json({ error: 'Invalid ability tier.' }, { status: 400 })
      }

      const { data: schedule } = await supabase
        .from('challenge_schedules')
        .select('id, trainer_id, max_capacity, current_bookings, status, challenge:challenge_id(id, tier_capacity)')
        .eq('id', scheduleId)
        .single()

      if (!schedule) return NextResponse.json({ error: 'Challenge session not found.' }, { status: 404 })
      if (schedule.status === 'cancelled') return NextResponse.json({ error: 'This session has been cancelled.' }, { status: 400 })

      const { data: existing } = await supabase
        .from('challenge_bookings')
        .select('id, booking_status')
        .eq('client_id', clientId)
        .eq('challenge_schedule_id', scheduleId)
        .maybeSingle()

      if (existing && existing.booking_status !== 'cancelled') {
        return NextResponse.json({ error: 'Client is already booked for this session.' }, { status: 400 })
      }

      if (!bypass && tier) {
        // Resource capacity checks (same logic as book-challenge)
        const challenge = (schedule as any).challenge
        const tc = challenge?.tier_capacity as any

        if (tc) {
          const { data: existingBookings } = await supabase
            .from('challenge_bookings')
            .select('ability_tier, client_id')
            .eq('challenge_schedule_id', scheduleId)
            .neq('booking_status', 'cancelled')

          const bookedClientIds = (existingBookings || []).map((b: any) => b.client_id).filter(Boolean)
          const { data: clientProfiles } = bookedClientIds.length > 0
            ? await supabase.from('user_profiles').select('id, gender').in('id', bookedClientIds)
            : { data: [] }
          const genderMap: Record<string, string | null> = {}
          for (const p of clientProfiles || []) genderMap[(p as any).id] = (p as any).gender ?? null

          const { data: clientData } = await supabase
            .from('user_profiles').select('gender').eq('id', clientId).maybeSingle()
          const clientGender = (clientData as any)?.gender ?? null

          const counts: Record<Tier, number> = { grey: 0, blue: 0, black: 0 }
          let totalCount = 0
          const bookingsForCheck: Array<{ ability_tier: string | null; gender: string | null }> = []
          for (const b of existingBookings || []) {
            if ((b as any).ability_tier && VALID_TIERS.includes((b as any).ability_tier)) counts[(b as any).ability_tier as Tier]++
            totalCount++
            bookingsForCheck.push({ ability_tier: (b as any).ability_tier ?? null, gender: genderMap[(b as any).client_id] ?? null })
          }

          let blockMsg: string | null = null
          if (tc.mode === 'resource') {
            if (tc.kettlebells && tier) {
              const kbs = tc.kettlebells as Record<string, number>
              const tiers = tc.tiers as Record<Tier, { female: string; male: string }>
              const kbsPerPerson = tc.kbs_per_person ?? 1
              const weightUsage: Record<string, number> = {}
              for (const b of bookingsForCheck) {
                const t = b.ability_tier as Tier | null
                if (!t || !tiers[t]) continue
                const g = b.gender === 'male' ? 'male' : 'female'
                const w = tiers[t][g]
                weightUsage[w] = (weightUsage[w] || 0) + kbsPerPerson
              }
              const newGender = clientGender === 'male' ? 'male' : 'female'
              const newWeight = tiers[tier]?.[newGender]
              if (newWeight) {
                const stock = kbs[newWeight] ?? 0
                const used = weightUsage[newWeight] ?? 0
                if (used + kbsPerPerson > stock) {
                  blockMsg = `${tier} tier is full — not enough ${newWeight} kettlebells (${stock} available).`
                }
              }
            } else if (tc.total_ropes != null) {
              const maxPeople = tc.total_ropes * tc.people_per_rope
              if (totalCount + 1 > maxPeople) blockMsg = 'Session is full — all battle ropes are taken.'
            } else if (tc.total_risers != null) {
              // simplified riser check
              const maxCap = schedule.max_capacity ?? 0
              if (maxCap > 0 && totalCount >= maxCap) blockMsg = 'Session is full.'
            }
          } else if (!tc.mode && tier) {
            const tierMax = tc[tier] as number | null
            if (tierMax != null && counts[tier] >= tierMax) {
              blockMsg = `${tier} tier is full for this session.`
            }
          } else {
            const maxCap = schedule.max_capacity ?? 0
            if (maxCap > 0 && totalCount >= maxCap) blockMsg = 'Session is full.'
          }

          if (blockMsg) return NextResponse.json({ error: blockMsg, bypassable: true }, { status: 403 })
        }
      } else if (!bypass) {
        const maxCap = (schedule as any).max_capacity ?? 0
        const current = (schedule as any).current_bookings ?? 0
        if (maxCap > 0 && current >= maxCap) {
          return NextResponse.json({ error: 'Session is full.', bypassable: true }, { status: 403 })
        }
      }

      if (existing?.booking_status === 'cancelled') {
        await supabase
          .from('challenge_bookings')
          .update({ booking_status: 'confirmed', booking_date: new Date().toISOString(), ability_tier: tier ?? null })
          .eq('id', existing.id)
      } else {
        await supabase.from('challenge_bookings').insert({
          challenge_schedule_id: scheduleId,
          client_id: clientId,
          trainer_id: (schedule as any).trainer_id,
          booking_status: 'confirmed',
          booking_date: new Date().toISOString(),
          ability_tier: tier ?? null,
        })
      }

      const { count: newTotal } = await supabase
        .from('challenge_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_schedule_id', scheduleId)
        .neq('booking_status', 'cancelled')

      await supabase
        .from('challenge_schedules')
        .update({ current_bookings: newTotal ?? 0 })
        .eq('id', scheduleId)

      logger.log(`Trainer booked client ${clientId} into challenge ${scheduleId}${bypass ? ' (bypass)' : ''}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unhandled type' }, { status: 400 })
  } catch (error: any) {
    logger.error('trainer-book-client error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book' }, { status: 500 })
  }
}
