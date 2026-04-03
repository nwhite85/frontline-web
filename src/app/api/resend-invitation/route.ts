import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'
import { rateLimit } from '@/utils/rateLimit'
import { z } from 'zod'
import { Resend } from 'resend'
import { passwordResetEmail } from '@/utils/emailTemplates'

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
    const redirectTo = `${siteUrl}/client/setup`

    // Generate link via admin API — no Supabase email rate limits
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (linkError) {
      logger.error('[resend-invitation] Error generating link:', linkError)
      return NextResponse.json({ error: 'Failed to generate invitation link' }, { status: 500 })
    }

    const actionLink = linkData?.properties?.action_link
    if (!actionLink) {
      return NextResponse.json({ error: 'Failed to generate invitation link' }, { status: 500 })
    }

    // Look up client name
    let clientName: string | undefined
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, first_name')
        .eq('email', email)
        .maybeSingle()
      clientName = (profile as any)?.first_name || (profile as any)?.name || undefined
    } catch { /* non-blocking */ }

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const fromDomain = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <onboarding@resend.dev>'
      const emailContent = passwordResetEmail({ clientName, resetUrl: actionLink })

      const { error: emailError } = await resend.emails.send({
        from: fromDomain,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      if (emailError) {
        logger.error('[resend-invitation] Resend error:', emailError)
        return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' })
  } catch (error: unknown) {
    logger.error('[resend-invitation] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
