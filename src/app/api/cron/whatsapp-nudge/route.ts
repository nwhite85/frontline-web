import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { whatsappNudgeEmail } from '@/utils/emailTemplates'
import { sendTransactionalEmail } from '@/utils/sendTransactionalEmail'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET /api/cron/whatsapp-nudge
// Called daily by Vercel Cron. Finds members who signed up 7+ days ago
// and haven't had the WhatsApp nudge sent yet, then sends it once.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, name, email')
    .lte('created_at', sevenDaysAgo)
    .is('whatsapp_nudge_sent_at', null)
    .not('email', 'is', null)
    .limit(100)

  if (error) {
    logger.error('whatsapp-nudge cron error fetching profiles:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const profile of profiles ?? []) {
    try {
      const content = whatsappNudgeEmail({ clientName: (profile as any).name ?? 'there' })
      await sendTransactionalEmail({
        to: (profile as any).email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      })
      await supabase
        .from('user_profiles')
        .update({ whatsapp_nudge_sent_at: new Date().toISOString() })
        .eq('id', profile.id)
      sent++
    } catch (err: any) {
      logger.error(`whatsapp-nudge failed for ${(profile as any).email}:`, err.message)
      failed++
    }
  }

  logger.log(`whatsapp-nudge cron: sent=${sent} failed=${failed}`)
  return NextResponse.json({ sent, failed })
}
