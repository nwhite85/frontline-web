import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabaseAdmin = createServerSupabaseClient()

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'}/client/setup`
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
