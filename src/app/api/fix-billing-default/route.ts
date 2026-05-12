import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/fix-billing-default
// Body: { clientId: string }
// Finds the card attached to this client (searching all Stripe customers by email),
// attaches it to the subscription's customer if needed, sets it as the invoice default,
// and retries any open invoices.

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    const [{ data: profile }, { data: scRow }, { data: membership }] = await Promise.all([
      supabase.from('user_profiles').select('stripe_customer_id, email').eq('id', clientId).single(),
      supabase.from('stripe_customers').select('stripe_customer_id').eq('user_id', clientId).single(),
      supabase.from('client_memberships').select('stripe_subscription_id').eq('client_id', clientId).eq('status', 'active').maybeSingle(),
    ])

    if (!profile?.email) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // ── Find the customer that owns the subscription ──────────────────────────
    let subscriptionCustomerId: string | null = null
    const subscriptionId = (membership as any)?.stripe_subscription_id ?? null

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      subscriptionCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    }

    // Fall back to DB-linked customer if no subscription found
    if (!subscriptionCustomerId) {
      subscriptionCustomerId = profile?.stripe_customer_id ?? scRow?.stripe_customer_id ?? null
    }

    if (!subscriptionCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found for this client' }, { status: 404 })
    }

    // ── Find the card — check subscription customer first, then search by email ─
    let pm = null
    const directMethods = await stripe.paymentMethods.list({ customer: subscriptionCustomerId, type: 'card', limit: 1 })
    if (directMethods.data.length > 0) {
      pm = directMethods.data[0]
    } else {
      // Card may be on a different customer (e.g. mobile app created its own customer)
      const allCustomers = await stripe.customers.list({ email: profile.email, limit: 10 })
      for (const customer of allCustomers.data) {
        if (customer.id === subscriptionCustomerId) continue
        const methods = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 })
        if (methods.data.length > 0) {
          pm = methods.data[0]
          // Attach this card to the subscription's customer
          try {
            await stripe.paymentMethods.attach(pm.id, { customer: subscriptionCustomerId })
            logger.log(`Attached pm ${pm.id} from customer ${customer.id} to subscription customer ${subscriptionCustomerId}`)
          } catch (attachErr: any) {
            // Already attached is fine
            if (!attachErr.message?.includes('already been attached')) throw attachErr
          }
          break
        }
      }
    }

    if (!pm) {
      return NextResponse.json({ error: 'No payment method found for this client' }, { status: 404 })
    }

    // ── Set as invoice default on the subscription customer ──────────────────
    await stripe.customers.update(subscriptionCustomerId, {
      invoice_settings: { default_payment_method: pm.id },
    })

    // Update DB to point at the subscription customer
    await supabase.from('user_profiles').update({ stripe_customer_id: subscriptionCustomerId }).eq('id', clientId)
    logger.log(`Set default payment method ${pm.id} for customer ${subscriptionCustomerId}`)

    // ── Retry open invoices using the default payment method we just set ──────
    const invoices = await stripe.invoices.list({ customer: subscriptionCustomerId, status: 'open', limit: 5 })
    const retried: string[] = []
    for (const inv of invoices.data) {
      if (!inv.id) continue
      try {
        await stripe.invoices.pay(inv.id)
        retried.push(inv.id)
        logger.log(`Retried invoice ${inv.id}`)
      } catch (err: any) {
        logger.error(`Failed to retry invoice ${inv.id}:`, err.message)
      }
    }

    return NextResponse.json({
      success: true,
      paymentMethodId: pm.id,
      card: `${pm.card?.brand} ····${pm.card?.last4}`,
      retriedInvoices: retried.length,
    })
  } catch (err: any) {
    logger.error('fix-billing-default error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fix billing default' }, { status: 500 })
  }
}
