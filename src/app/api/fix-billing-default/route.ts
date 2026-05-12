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
// Finds the client's Stripe customer (falling back to email search if the DB-linked
// customer has no card), sets their payment method as invoice_settings.default_payment_method,
// updates the DB link if a different customer was found, then retries open invoices.

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    const [{ data: profile }, { data: scRow }] = await Promise.all([
      supabase.from('user_profiles').select('stripe_customer_id, first_name, last_name, email').eq('id', clientId).single(),
      supabase.from('stripe_customers').select('stripe_customer_id').eq('user_id', clientId).single(),
    ])

    if (!profile?.email) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    let stripeCustomerId: string | null = profile?.stripe_customer_id ?? scRow?.stripe_customer_id ?? null
    let pm = null

    // Try the DB-linked customer first
    if (stripeCustomerId) {
      const methods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card', limit: 1 })
      if (methods.data.length > 0) pm = methods.data[0]
    }

    // If no card found on the linked customer, search all Stripe customers by email
    // to find the one that actually has a card (can happen when mobile app and migration
    // created separate Stripe customers for the same person)
    if (!pm) {
      const allCustomers = await stripe.customers.list({ email: profile.email, limit: 10 })
      for (const customer of allCustomers.data) {
        if (customer.id === stripeCustomerId) continue // already checked
        const methods = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 })
        if (methods.data.length > 0) {
          pm = methods.data[0]
          // Update the DB to point to the customer that has the card
          const newCustomerId = customer.id
          logger.log(`Found card on different customer ${newCustomerId} vs DB-linked ${stripeCustomerId} — relinking`)
          await supabase.from('user_profiles').update({ stripe_customer_id: newCustomerId }).eq('id', clientId)
          stripeCustomerId = newCustomerId
          break
        }
      }
    }

    if (!pm || !stripeCustomerId) {
      return NextResponse.json({ error: 'No payment method found on any Stripe customer for this client' }, { status: 404 })
    }

    // Set as invoice default
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: pm.id },
    })
    logger.log(`Set default payment method ${pm.id} for customer ${stripeCustomerId}`)

    // Retry any open (unpaid) invoices
    const invoices = await stripe.invoices.list({ customer: stripeCustomerId, status: 'open', limit: 5 })
    const retried: string[] = []
    for (const inv of invoices.data) {
      if (!inv.id) continue
      try {
        await stripe.invoices.pay(inv.id, { payment_method: pm.id })
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
