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

    const sub = await stripe.subscriptions.retrieve(subId) as any

    // current_period_end is the standard field; fall back to upcoming invoice
    let nextBillingDate: string | null = null

    if (sub.current_period_end) {
      nextBillingDate = new Date(sub.current_period_end * 1000).toISOString()
    } else {
      // Newer Stripe API versions may not include current_period_end directly —
      // retrieve the next upcoming invoice instead
      try {
        const upcoming = await (stripe.invoices as any).retrieveUpcoming({ subscription: subId })
        if (upcoming?.next_payment_attempt) {
          nextBillingDate = new Date(upcoming.next_payment_attempt * 1000).toISOString()
        } else if (upcoming?.period_end) {
          nextBillingDate = new Date(upcoming.period_end * 1000).toISOString()
        }
      } catch {
        // No upcoming invoice (e.g. subscription cancelled)
      }
    }

    return NextResponse.json({ nextBillingDate, status: sub.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
