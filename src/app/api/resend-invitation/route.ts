import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'
import { rateLimit } from '@/utils/rateLimit'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email format'),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { success } = rateLimit(ip, { limit: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email } = parsed.data

    const supabase = createServerSupabaseClient()

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      logger.error('[resend-invitation] Failed to list users:', usersError)
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 })
    }

    const existingUser = users.users?.find(u => u.email === email)
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://frontlinefitness.co.uk'
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/client/setup`,
    })

    if (resetError) {
      logger.error('[resend-invitation] Error sending reset email:', resetError)
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' })
  } catch (error: unknown) {
    logger.error('[resend-invitation] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
