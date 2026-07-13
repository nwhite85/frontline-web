import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/resubscribe-client
// Body: { clientId: string }
// Cancels the client's existing broken Stripe subscription, then creates a new one
// on the customer that already has their card attached. Use when a migration created
// the subscription on a customer that has no payment method.

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    // ── Load client data ──────────────────────────────────────────────────────
    const [{ data: profile }, { data: scRow }, { data: membership }] = await Promise.all([
      supabase.from('user_profiles').select('stripe_customer_id, email').eq('id', clientId).single(),
      supabase.from('stripe_customers').select('stripe_customer_id').eq('user_id', clientId).single(),
      (supabase as any).from('client_memberships')
        .select('id, stripe_subscription_id, membership_plan_id')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (!profile?.email) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    if (!membership) {
      // Fetch without status filter to diagnose
      const { data: anyMembership, error: diagError } = await (supabase as any)
        .from('client_memberships')
        .select('id, status, stripe_subscription_id, membership_plan_id')
        .eq('client_id', clientId)
        .maybeSingle()
      return NextResponse.json({
        error: 'No active membership found',
        debug: { anyMembership, diagError, clientId },
      }, { status: 404 })
    }

    const planId = (membership as any).membership_plan_id
    if (!planId) return NextResponse.json({ error: 'No membership plan linked' }, { status: 404 })

    const { data: plan } = await supabase
      .from('membership_plans')
      .select('id, name, price')
      .eq('id', planId)
      .single()

    if (!plan) return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })

    // ── Find the customer that has a card ─────────────────────────────────────
    let cardCustomerId: string | null = null
    let pm = null

    const allCustomers = await stripe.customers.list({ email: profile.email, limit: 10 })
    for (const customer of allCustomers.data) {
      const methods = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 })
      if (methods.data.length > 0) {
        cardCustomerId = customer.id
        pm = methods.data[0]
        break
      }
    }

    if (!cardCustomerId || !pm) {
      return NextResponse.json({ error: 'No payment method found on any Stripe customer for this client' }, { status: 404 })
    }

    // ── Cancel the existing broken subscription ───────────────────────────────
    const oldSubId = (membership as any).stripe_subscription_id
    if (oldSubId) {
      try {
        await stripe.subscriptions.cancel(oldSubId)
        logger.log(`Cancelled old subscription ${oldSubId}`)
      } catch (err: any) {
        // Already cancelled is fine
        if (!err.message?.includes('No such subscription')) throw err
      }
    }

    // ── Get or create a Stripe price for this plan ────────────────────────────
    const existingPrices = await stripe.prices.list({ limit: 100, active: true })
    let stripePriceId = existingPrices.data.find(
      (p) => p.metadata?.plan_id === plan.id && p.recurring?.interval === 'month'
    )?.id ?? null
    if (!stripePriceId) {
      const products = await stripe.products.list({ limit: 100 })
      let product = products.data.find((p: any) => p.name === plan.name && p.active)
      if (!product) {
        product = await stripe.products.create({ name: plan.name, metadata: { plan_id: plan.id } })
      }
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100),
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: { plan_id: plan.id },
      })
      stripePriceId = price.id
    }

    // ── Set card as default on the card customer ──────────────────────────────
    await stripe.customers.update(cardCustomerId, {
      invoice_settings: { default_payment_method: pm.id },
    })

    // ── Create new subscription on the customer that has the card ─────────────
    const newSub = await stripe.subscriptions.create({
      customer: cardCustomerId,
      items: [{ price: stripePriceId }],
      metadata: { user_id: clientId, plan_id: plan.id },
    })
    logger.log(`Created new subscription ${newSub.id} on customer ${cardCustomerId}`)

    // ── Update DB ─────────────────────────────────────────────────────────────
    await Promise.all([
      (supabase as any).from('client_memberships').update({
        stripe_subscription_id: newSub.id,
        next_billing_date: new Date((newSub as any).current_period_end * 1000).toISOString().split('T')[0],
      }).eq('id', (membership as any).id),
      supabase.from('user_profiles').update({ stripe_customer_id: cardCustomerId }).eq('id', clientId),
    ])

    return NextResponse.json({
      success: true,
      subscriptionId: newSub.id,
      card: `${pm.card?.brand} ····${pm.card?.last4}`,
    })
  } catch (err: any) {
    logger.error('resubscribe-client error:', err)
    return NextResponse.json({ error: err.message || 'Failed to resubscribe' }, { status: 500 })
  }
}
