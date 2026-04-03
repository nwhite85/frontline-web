import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { success } = rateLimit(ip, { limit: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabaseAdmin = createServerSupabaseClient()

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://frontlinefitness.co.uk'}/update-password`

    // Use generateLink (admin API) — avoids Supabase's email service rate limits.
    // The link is returned to the dashboard so the trainer can copy/send it directly.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirectUrl },
    })

    if (error) {
      logger.error('Error generating reset link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const actionLink = data?.properties?.action_link
    return NextResponse.json({ success: true, link: actionLink })
  } catch (err) {
    logger.error('send-password-reset error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
