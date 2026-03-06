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

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://frontlinefitness.co.uk'}/client/setup`
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })

    if (error) {
      logger.error('Error sending setup link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('send-password-reset error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
