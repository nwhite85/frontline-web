import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Returns the first day of a month as a Date (UTC) */
function firstDayOfMonth(yearMonth: string): Date {
  return new Date(`${yearMonth}-01T00:00:00Z`)
}

/** Returns the last day of a month as a Date (UTC) */
function lastDayOfMonth(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number)
  const d = new Date(Date.UTC(year, month, 0)) // day 0 = last day of prev month, so month (not month-1) gives last day
  return d
}

/** Format a Date as YYYY-MM-DD */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Given a date string (YYYY-MM-DD), find which occurrence of its DOW it is
 * within its month (e.g. 1 = first Monday, 2 = second Monday, etc.)
 */
function getOccurrenceInMonth(dateStr: string): { dow: number; occurrence: number } {
  const d = new Date(`${dateStr}T00:00:00Z`)
  const dow = d.getUTCDay()
  const dayOfMonth = d.getUTCDate()
  const occurrence = Math.ceil(dayOfMonth / 7)
  return { dow, occurrence }
}

/**
 * Find the date of the Nth occurrence of a DOW in a given yearMonth.
 * Returns null if that occurrence doesn't exist.
 */
function getNthDowInMonth(yearMonth: string, dow: number, occurrence: number): string | null {
  const [year, month] = yearMonth.split('-').map(Number)
  // Find first occurrence of dow in this month
  const first = new Date(Date.UTC(year, month - 1, 1))
  const firstDow = first.getUTCDay()
  let offset = dow - firstDow
  if (offset < 0) offset += 7
  const firstOccDate = 1 + offset
  const targetDate = firstOccDate + (occurrence - 1) * 7

  // Check if targetDate is within the month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (targetDate > lastDay) return null

  const result = new Date(Date.UTC(year, month - 1, targetDate))
  return toDateStr(result)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      trainerId,
      sourceMonth,
      targetMonth,
      includeAppointments = true,
      includeClasses = true,
      includeEvents = true,
      includeChallenges = true,
      includeAvailable = false,
    } = body

    if (!trainerId || !sourceMonth || !targetMonth) {
      return NextResponse.json({ error: 'trainerId, sourceMonth, and targetMonth are required' }, { status: 400 })
    }

    if (sourceMonth === targetMonth) {
      return NextResponse.json({ error: 'Source and target month must be different' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const sourceStart = toDateStr(firstDayOfMonth(sourceMonth))
    const sourceEnd = toDateStr(lastDayOfMonth(sourceMonth))

    const summary = {
      copied: { appointments: 0, classes: 0, events: 0, challenges: 0 },
      skipped: { appointments: 0, classes: 0, events: 0, challenges: 0 },
    }

    // ── APPOINTMENTS ──────────────────────────────────────────────────────────
    if (includeAppointments) {
      let aptQuery = supabase
        .from('appointments')
        .select('id, appointment_date, start_time, end_time, duration_minutes, appointment_type, location, notes, client_id, status, price, template_id')
        .eq('trainer_id', trainerId)
        .gte('appointment_date', sourceStart)
        .lte('appointment_date', sourceEnd)
        .neq('status', 'cancelled')

      if (!includeAvailable) {
        aptQuery = aptQuery.eq('status', 'scheduled')
      }

      const { data: apts, error: aptErr } = await aptQuery
      if (aptErr) {
        return NextResponse.json({ error: aptErr.message }, { status: 500 })
      }

      for (const apt of apts ?? []) {
        const { dow, occurrence } = getOccurrenceInMonth(apt.appointment_date)
        const targetDate = getNthDowInMonth(targetMonth, dow, occurrence)
        if (!targetDate) { summary.skipped.appointments++; continue }

        // Conflict check
        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('trainer_id', trainerId)
          .eq('appointment_date', targetDate)
          .eq('start_time', apt.start_time)
          .limit(1)
        if (existing && existing.length > 0) { summary.skipped.appointments++; continue }

        const { error: insertErr } = await supabase.from('appointments').insert({
          trainer_id: trainerId,
          appointment_date: targetDate,
          start_time: apt.start_time,
          end_time: apt.end_time,
          duration_minutes: apt.duration_minutes,
          appointment_type: apt.appointment_type,
          location: apt.location,
          notes: apt.notes,
          client_id: apt.client_id,
          template_id: apt.template_id,
          price: apt.price,
          status: apt.status,
          payment_status: 'unbilled',
        })
        if (insertErr) { summary.skipped.appointments++; continue }
        summary.copied.appointments++
      }
    }

    // ── CLASS SCHEDULES ───────────────────────────────────────────────────────
    if (includeClasses) {
      const { data: classes, error: classErr } = await supabase
        .from('class_schedules')
        .select('id, scheduled_date, start_time, end_time, class_id, location, max_capacity, status')
        .eq('trainer_id', trainerId)
        .gte('scheduled_date', sourceStart)
        .lte('scheduled_date', sourceEnd)
        .neq('status', 'cancelled')
      if (classErr) {
        return NextResponse.json({ error: classErr.message }, { status: 500 })
      }

      for (const cls of classes ?? []) {
        const { dow, occurrence } = getOccurrenceInMonth(cls.scheduled_date)
        const targetDate = getNthDowInMonth(targetMonth, dow, occurrence)
        if (!targetDate) { summary.skipped.classes++; continue }

        const { data: existing } = await supabase
          .from('class_schedules')
          .select('id')
          .eq('trainer_id', trainerId)
          .eq('scheduled_date', targetDate)
          .eq('start_time', cls.start_time)
          .limit(1)
        if (existing && existing.length > 0) { summary.skipped.classes++; continue }

        const { error: insertErr } = await supabase.from('class_schedules').insert({
          trainer_id: trainerId,
          scheduled_date: targetDate,
          start_time: cls.start_time,
          end_time: cls.end_time,
          class_id: cls.class_id,
          location: cls.location,
          max_capacity: cls.max_capacity,
          status: cls.status,
          current_bookings: 0,
        })
        if (insertErr) { summary.skipped.classes++; continue }
        summary.copied.classes++
      }
    }

    // ── EVENTS ────────────────────────────────────────────────────────────────
    if (includeEvents) {
      const { data: events, error: eventsErr } = await supabase
        .from('events')
        .select('id, name, description, start_date, end_date, start_time, end_time, location, max_capacity, price, status')
        .eq('trainer_id', trainerId)
        .gte('start_date', sourceStart)
        .lte('start_date', sourceEnd)
        .neq('status', 'cancelled')
      if (eventsErr) {
        return NextResponse.json({ error: eventsErr.message }, { status: 500 })
      }

      for (const evt of events ?? []) {
        const { dow, occurrence } = getOccurrenceInMonth(evt.start_date)
        const targetDate = getNthDowInMonth(targetMonth, dow, occurrence)
        if (!targetDate) { summary.skipped.events++; continue }

        // Recalculate end_date
        let targetEndDate: string | null = null
        if (evt.end_date) {
          const startMs = new Date(`${evt.start_date}T00:00:00Z`).getTime()
          const endMs = new Date(`${evt.end_date}T00:00:00Z`).getTime()
          const durationDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))
          const newEnd = new Date(new Date(`${targetDate}T00:00:00Z`).getTime() + durationDays * 24 * 60 * 60 * 1000)
          targetEndDate = toDateStr(newEnd)
        }

        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('trainer_id', trainerId)
          .eq('start_date', targetDate)
          .eq('start_time', evt.start_time)
          .limit(1)
        if (existing && existing.length > 0) { summary.skipped.events++; continue }

        const { error: insertErr } = await supabase.from('events').insert({
          trainer_id: trainerId,
          start_date: targetDate,
          end_date: targetEndDate,
          start_time: evt.start_time,
          end_time: evt.end_time,
          name: evt.name,
          description: evt.description,
          location: evt.location,
          max_capacity: evt.max_capacity,
          price: evt.price,
          status: 'scheduled',
          current_bookings: 0,
        })
        if (insertErr) { summary.skipped.events++; continue }
        summary.copied.events++
      }
    }

    // ── CHALLENGE SCHEDULES ───────────────────────────────────────────────────
    if (includeChallenges) {
      const { data: challenges, error: chalErr } = await supabase
        .from('challenge_schedules')
        .select('id, scheduled_date, start_time, end_time, challenge_id, max_capacity, status')
        .eq('trainer_id', trainerId)
        .gte('scheduled_date', sourceStart)
        .lte('scheduled_date', sourceEnd)
        .neq('status', 'cancelled')
      if (chalErr) {
        return NextResponse.json({ error: chalErr.message }, { status: 500 })
      }

      for (const ch of challenges ?? []) {
        const { dow, occurrence } = getOccurrenceInMonth(ch.scheduled_date)
        const targetDate = getNthDowInMonth(targetMonth, dow, occurrence)
        if (!targetDate) { summary.skipped.challenges++; continue }

        const { data: existing } = await supabase
          .from('challenge_schedules')
          .select('id')
          .eq('trainer_id', trainerId)
          .eq('scheduled_date', targetDate)
          .eq('start_time', ch.start_time)
          .limit(1)
        if (existing && existing.length > 0) { summary.skipped.challenges++; continue }

        const { error: insertErr } = await supabase.from('challenge_schedules').insert({
          trainer_id: trainerId,
          scheduled_date: targetDate,
          start_time: ch.start_time,
          end_time: ch.end_time,
          challenge_id: ch.challenge_id,
          max_capacity: ch.max_capacity,
          status: 'scheduled',
          current_bookings: 0,
        })
        if (insertErr) { summary.skipped.challenges++; continue }
        summary.copied.challenges++
      }
    }

    const total =
      summary.copied.appointments +
      summary.copied.classes +
      summary.copied.events +
      summary.copied.challenges

    return NextResponse.json({ ...summary, total })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
