import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET /api/subscription-details?clientId=xxx
// Returns next billing date from Stripe for the client's active subscription.
export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

    const { data: membership } = await supabase
      .from('client_memberships')
      .select('stripe_subscription_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .maybeSingle()

    const subId = (membership as any)?.stripe_subscription_id
    if (!subId) return NextResponse.json({ nextBillingDate: null })

    // Stripe API 2025+ removed current_period_end from the top-level subscription object.
    // Use createPreview (formerly retrieveUpcoming) to get the next billing date.
    let nextBillingDate: string | null = null

    try {
      const upcoming = await stripe.invoices.createPreview({ subscription: subId })
      if (upcoming?.next_payment_attempt) {
        nextBillingDate = new Date(upcoming.next_payment_attempt * 1000).toISOString()
      } else if (upcoming?.period_end) {
        nextBillingDate = new Date(upcoming.period_end * 1000).toISOString()
      }
    } catch {
      // No upcoming invoice (e.g. subscription cancelled or past_due with no retry)
    }

    const sub = await stripe.subscriptions.retrieve(subId) as any

    return NextResponse.json({ nextBillingDate, status: (sub as any).status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
