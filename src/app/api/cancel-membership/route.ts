import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/cancel-membership
// Body: { clientId: string, immediate?: boolean }
// Default: sets cancel_at_period_end on the Stripe subscription so the client
// keeps access until the end of the period they've paid for; the membership row
// gets an end_date and is marked cancelled by the subscription.deleted webhook
// when the period actually ends. With immediate: true the subscription is
// cancelled on Stripe right away and the membership marked cancelled now.

export async function POST(request: NextRequest) {
  try {
    const { clientId, immediate = false } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('client_memberships')
      .select('id, stripe_subscription_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'No active membership found' }, { status: 404 })
    }

    const subId = membership.stripe_subscription_id as string | null
    const today = new Date().toISOString().split('T')[0]

    // No Stripe subscription (cash/legacy membership) — just close it in the DB
    if (!subId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_memberships')
        .update({ status: 'cancelled', end_date: today, next_billing_date: null })
        .eq('id', membership.id)
      return NextResponse.json({ success: true, endsAt: today, stripe: false })
    }

    if (immediate) {
      try {
        await stripe.subscriptions.cancel(subId)
        logger.log(`Cancelled subscription ${subId} immediately for client ${clientId}`)
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Already gone on Stripe's side — still close it in the DB
        if (err?.code !== 'resource_missing') throw err
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_memberships')
        .update({ status: 'cancelled', end_date: today, next_billing_date: null })
        .eq('id', membership.id)
      return NextResponse.json({ success: true, endsAt: today, stripe: true })
    }

    // Default: let the paid-up period run out, then the subscription.deleted
    // webhook marks the membership cancelled
    let sub
    try {
      sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
      logger.log(`Set cancel_at_period_end on subscription ${subId} for client ${clientId}`)
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err?.code !== 'resource_missing') throw err
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('client_memberships')
        .update({ status: 'cancelled', end_date: today, next_billing_date: null })
        .eq('id', membership.id)
      return NextResponse.json({ success: true, endsAt: today, stripe: false })
    }

    // On the basil API version current_period_end lives on the subscription item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodEnd = (sub as any).items?.data?.[0]?.current_period_end ?? (sub as any).current_period_end
    const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString().split('T')[0] : null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('client_memberships')
      .update({ end_date: endsAt, next_billing_date: null })
      .eq('id', membership.id)

    return NextResponse.json({ success: true, endsAt, stripe: true })
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    logger.error('cancel-membership error:', err)
    return NextResponse.json({ error: err.message || 'Failed to cancel membership' }, { status: 500 })
  }
}
