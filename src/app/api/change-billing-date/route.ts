import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/change-billing-date
// Body: { clientId: string, newDate: string } — newDate is YYYY-MM-DD
export async function POST(request: NextRequest) {
  try {
    const { clientId, newDate, prorate = false } = await request.json()
    if (!clientId || !newDate) {
      return NextResponse.json({ error: 'clientId and newDate required' }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from('client_memberships')
      .select('stripe_subscription_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .maybeSingle()

    const subId = (membership as any)?.stripe_subscription_id
    if (!subId) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 404 })
    }

    // Build a UTC timestamp at midnight on the chosen date
    const anchor = Math.floor(new Date(newDate + 'T00:00:00Z').getTime() / 1000)
    const now = Math.floor(Date.now() / 1000)

    if (anchor <= now) {
      return NextResponse.json({ error: 'New billing date must be in the future' }, { status: 400 })
    }

    // Stripe API 2025+ doesn't allow a timestamp for billing_cycle_anchor on existing
    // subscriptions. Use trial_end instead — puts the sub in trial until the chosen date,
    // then bills normally from there as the new anchor.
    await stripe.subscriptions.update(subId, {
      trial_end: anchor as any,
      proration_behavior: prorate ? 'create_prorations' : 'none',
    } as any)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
