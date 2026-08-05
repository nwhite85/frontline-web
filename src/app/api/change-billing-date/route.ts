/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/change-billing-date
// Body: { clientId, newDate (YYYY-MM-DD) }
// Moves the client's next billing date to newDate. Stripe won't let us set an
// arbitrary future billing_cycle_anchor on an existing sub, so we use trial_end
// to land on the new date — but that alone makes the gap FREE (a trial). To avoid
// gifting free time when moving a date forward, we charge a pro-rata amount for the
// days the client isn't already paid up for (from their current paid-through date to
// the new date), billed immediately. Moving a date to before they're paid up costs
// nothing (they've prepaid it).
export async function POST(request: NextRequest) {
  try {
    const { clientId, newDate } = await request.json()
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

    const anchor = Math.floor(new Date(newDate + 'T00:00:00Z').getTime() / 1000)
    const now = Math.floor(Date.now() / 1000)
    if (anchor <= now) {
      return NextResponse.json({ error: 'New billing date must be in the future' }, { status: 400 })
    }

    // What the client is currently paid up to, and their monthly rate
    const sub = await stripe.subscriptions.retrieve(subId)
    const item = (sub as any).items.data[0]
    const paidThrough = item.current_period_end as number
    const unitAmount = item.price?.unit_amount ?? 0
    const currency = item.price?.currency ?? 'gbp'
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

    // Pro-rata charge for genuinely unpaid days between paid-through and the new date
    const gapDays = Math.ceil((anchor - paidThrough) / 86400)
    const proRataAmount = gapDays > 0 ? Math.round((unitAmount * gapDays) / 30) : 0

    // Move the next billing date to the chosen date (no auto proration/credits)
    await stripe.subscriptions.update(subId, {
      trial_end: anchor as any,
      proration_behavior: 'none',
    } as any)

    // Charge the pro-rata gap now, if any. Create the invoice first, attach the
    // item to it explicitly, then finalize + pay — otherwise the pending item
    // isn't reliably pulled into a freshly-created invoice.
    if (proRataAmount > 0) {
      const invoice = await stripe.invoices.create({ customer: customerId, auto_advance: false })
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: proRataAmount,
        currency,
        description: `Pro-rata to move billing date to ${newDate} (${gapDays} day${gapDays === 1 ? '' : 's'})`,
      })
      if (invoice.id) {
        await stripe.invoices.finalizeInvoice(invoice.id)
        await stripe.invoices.pay(invoice.id)
      }
    }

    return NextResponse.json({
      success: true,
      proRataCharged: proRataAmount / 100,
      gapDays: Math.max(0, gapDays),
    })
  } catch (err: any) {
    logger.error('change-billing-date error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
