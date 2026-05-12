import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/migrate-to-stripe
// Body: { clientId: string, billingDate: string } // billingDate = "YYYY-MM-DD"
// Creates a Stripe subscription for an existing member, anchored to their billing date.
// Works whether or not they already have a Stripe customer ID.

export async function POST(request: NextRequest) {
  try {
    const { clientId, billingDate } = await request.json()

    if (!clientId || !billingDate) {
      return NextResponse.json({ error: 'clientId and billingDate are required' }, { status: 400 })
    }

    // ── Fetch client profile ──────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, stripe_customer_id')
      .eq('id', clientId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // ── Fetch current active membership + plan ────────────────────────────────
    const { data: membership } = await supabase
      .from('client_memberships')
      .select('id, membership_plan_id, membership_plans(id, name, price)')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()

    if (!membership) return NextResponse.json({ error: 'No active membership found for this client' }, { status: 404 })

    const plan = (membership as any).membership_plans
    if (!plan) return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })

    // ── Get or create Stripe price ────────────────────────────────────────────
    // Look up an existing active price for this plan by metadata, or create one
    const existingPrices = await stripe.prices.list({ limit: 100, active: true })
    let stripePriceId = existingPrices.data.find(
      p => p.metadata?.plan_id === plan.id && p.recurring?.interval === 'month'
    )?.id ?? null

    if (!stripePriceId) {
      // Find or create Stripe product + price
      const products = await stripe.products.list({ limit: 100 })
      let product = products.data.find(p => p.name === plan.name && p.active)
      if (!product) {
        product = await stripe.products.create({
          name: plan.name,
          metadata: { plan_id: plan.id },
        })
      }
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100),
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: { plan_id: plan.id },
      })
      stripePriceId = price.id
      logger.log(`Created Stripe price ${stripePriceId} for plan ${plan.name}`)
    }

    // ── Get or create Stripe customer ─────────────────────────────────────────
    let stripeCustomerId = profile.stripe_customer_id as string | null

    if (!stripeCustomerId) {
      // Check stripe_customers table (used by client app signups)
      const { data: scRow } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', clientId)
        .single()
      stripeCustomerId = scRow?.stripe_customer_id ?? null
    }

    if (!stripeCustomerId) {
      // No Stripe customer yet — create one
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        metadata: { user_id: clientId },
      })
      stripeCustomerId = customer.id
      // Store on user_profiles
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', clientId)
      logger.log(`Created Stripe customer ${stripeCustomerId} for ${profile.email}`)
    }

    // ── Check for existing active subscription ────────────────────────────────
    const { data: existingMembership } = await supabase
      .from('client_memberships')
      .select('stripe_subscription_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()

    if ((existingMembership as any)?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Client already has an active Stripe subscription' }, { status: 400 })
    }

    // ── Create Stripe subscription ────────────────────────────────────────────
    // If billing date is in the future, use trial_end to delay the first charge.
    // Stripe will then bill on that date every month going forward.
    const billingTs = Math.floor(new Date(billingDate + 'T00:00:00Z').getTime() / 1000)
    const nowTs = Math.floor(Date.now() / 1000)
    const isFuture = billingTs > nowTs + 86400 // more than a day away

    const subscriptionParams: any = {
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      metadata: { user_id: clientId, plan_id: plan.id },
    }

    if (isFuture) {
      // Free trial until billing date — first charge on that day, then monthly
      subscriptionParams.trial_end = billingTs
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)
    logger.log(`Created Stripe subscription ${subscription.id} for ${profile.email}, billing from ${billingDate}`)

    // ── Set invoice default payment method if one exists ─────────────────────
    // Required for subscription billing to succeed — without this Stripe won't
    // charge the attached card automatically.
    try {
      let pm = null
      const directMethods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card', limit: 1 })
      if (directMethods.data.length > 0) {
        pm = directMethods.data[0]
      } else {
        // Card may be on a different Stripe customer (e.g. mobile app created its own)
        const allCustomers = await stripe.customers.list({ email: profile.email, limit: 10 })
        for (const c of allCustomers.data) {
          if (c.id === stripeCustomerId) continue
          const methods = await stripe.paymentMethods.list({ customer: c.id, type: 'card', limit: 1 })
          if (methods.data.length > 0) {
            pm = methods.data[0]
            try {
              await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId })
            } catch (e: any) {
              if (!e.message?.includes('already been attached')) throw e
            }
            break
          }
        }
      }
      if (pm) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: pm.id },
        })
        logger.log(`Set default payment method ${pm.id} for customer ${stripeCustomerId}`)
      }
    } catch (pmErr: any) {
      logger.error('Could not set default payment method:', pmErr.message)
      // Non-fatal — subscription was still created
    }

    // ── Update membership record ──────────────────────────────────────────────
    await supabase
      .from('client_memberships')
      .update({
        stripe_subscription_id: subscription.id,
        next_billing_date: billingDate,
        last_billing_date: null,
      })
      .eq('id', membership.id)

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      billingDate,
      trialUntil: isFuture ? billingDate : null,
    })

  } catch (err: any) {
    logger.error('migrate-to-stripe error:', err)
    return NextResponse.json({ error: err.message || 'Failed to migrate to Stripe billing' }, { status: 500 })
  }
}
