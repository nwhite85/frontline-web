import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/utils/rateLimit'
import { logger } from '@/utils/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registrationSchema = z.object({
  eventSlug: z.string().min(1).max(60),
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email format').max(150),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  childAges: z.string().trim().max(100).optional().or(z.literal('')),
  waiverAccepted: z.literal(true, { message: 'The waiver must be accepted' }),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

// POST — public registration form. Inserts with the anon key so the RLS policy
// (which requires waiver_accepted) is the final gate, not just this validation.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests — please try again shortly.' }, { status: 429 })
  }

  try {
    const parsed = registrationSchema.safeParse(await req.json())
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    const { eventSlug, name, email, phone, adults, children, childAges, waiverAccepted, notes } = parsed.data

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await supabaseAnon.from('event_registrations').insert({
      event_slug: eventSlug,
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      adults,
      children,
      child_ages: childAges || null,
      waiver_accepted: waiverAccepted,
      notes: notes || null,
    })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[event-registrations] Failed to save registration:', err)
    return NextResponse.json({ error: 'Failed to save your registration' }, { status: 500 })
  }
}

// GET — trainer-only list, e.g. /api/event-registrations?eventSlug=family-fun-day
export async function GET(req: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createServerClient } = await import('@supabase/ssr')
    const cookieStore = await cookies()
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventSlug = req.nextUrl.searchParams.get('eventSlug')
    // Untyped service client — event_registrations isn't in the generated types yet
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    let query = supabase
      .from('event_registrations')
      .select('*')
      .order('created_at', { ascending: false })
    if (eventSlug) query = query.eq('event_slug', eventSlug)

    const { data, error } = await query
    if (error) throw error

    const totals = (data ?? []).reduce(
      (acc, r) => ({ adults: acc.adults + (r.adults ?? 0), children: acc.children + (r.children ?? 0) }),
      { adults: 0, children: 0 }
    )
    return NextResponse.json({ registrations: data ?? [], totals })
  } catch (err) {
    logger.error('[event-registrations] Failed to list registrations:', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
