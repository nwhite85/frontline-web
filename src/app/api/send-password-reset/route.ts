import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'
import { Resend } from 'resend'
import { passwordResetEmail } from '@/utils/emailTemplates'

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

    const redirectUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://frontlinefitness.co.uk').replace(/\/$/, '')}/update-password`

    // Call Supabase admin API directly — the JS library sends redirectTo as camelCase
    // in the body which the server ignores; direct fetch sends redirect_to (snake_case) correctly.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
    const generateRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ type: 'recovery', email, redirect_to: redirectUrl }),
    })

    if (!generateRes.ok) {
      const errBody = await generateRes.json().catch(() => ({}))
      logger.error('Error generating reset link:', errBody)
      return NextResponse.json({ error: errBody?.message ?? 'Failed to generate link' }, { status: 500 })
    }

    const generateData = await generateRes.json()
    const actionLink: string | undefined = generateData?.action_link

    // Send via Resend if API key is configured
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && actionLink) {
      const resend = new Resend(resendKey)
      const fromDomain = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <onboarding@resend.dev>'

      // Look up client name for personalised greeting
      let clientName: string | undefined
      try {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('name, first_name')
          .eq('email', email)
          .maybeSingle()
        clientName = (profile as any)?.first_name || (profile as any)?.name || undefined
      } catch { /* non-blocking */ }

      const emailContent = passwordResetEmail({ clientName, resetUrl: actionLink })

      const { error: emailError } = await resend.emails.send({
        from: fromDomain,
        to: email,
        subject: 'Set your Frontline Fitness password',
        html: emailContent.html,
        text: emailContent.text,
      })

      if (emailError) {
        logger.error('Resend error:', emailError)
        // Still return the link so dashboard can copy/paste as fallback
        return NextResponse.json({ success: true, link: actionLink, emailError: emailError.message })
      }

      return NextResponse.json({ success: true, emailSent: true })
    }

    // No Resend key — return link for manual sending
    return NextResponse.json({ success: true, link: actionLink })
  } catch (err) {
    logger.error('send-password-reset error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
