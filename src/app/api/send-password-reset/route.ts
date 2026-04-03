import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'
import { Resend } from 'resend'

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

    // Generate reset link via admin API — no Supabase email rate limits
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

    // Send via Resend if API key is configured
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && actionLink) {
      const resend = new Resend(resendKey)
      const fromDomain = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <onboarding@resend.dev>'

      const { error: emailError } = await resend.emails.send({
        from: fromDomain,
        to: email,
        subject: 'Set your Frontline Fitness password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <img src="https://frontlinefitness.co.uk/logos/frontline-logo-blue.png" alt="Frontline Fitness" style="height: 24px; margin-bottom: 32px;" />
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">Set your password</h2>
            <p style="color: #666; margin: 0 0 24px;">Click the button below to set your Frontline Fitness account password. This link expires in 24 hours.</p>
            <a href="${actionLink}" style="display: inline-block; background: #4982e8; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">Set Password</a>
            <p style="color: #999; font-size: 12px; margin: 24px 0 0;">If you didn't request this, you can ignore this email.</p>
          </div>
        `,
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
