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

    // ── Attach payment method BEFORE creating subscription ────────────────────
    // Stripe 2025 API rejects subscription creation if no default payment method.
    // Find the card (may be on a different Stripe customer if added via mobile app)
    // and attach it to this customer first.
    let defaultPmId: string | null = null
    let pmDiagnostic = ''
    try {
      // Verify the customer exists in this Stripe account
      let customerExists = false
      try {
        const cus = await stripe.customers.retrieve(stripeCustomerId) as any
        customerExists = !cus.deleted
        logger.log(`Customer ${stripeCustomerId} exists=${customerExists}`)
      } catch (e: any) {
        pmDiagnostic = `Customer ${stripeCustomerId} not found in Stripe (${e.message})`
        logger.error(pmDiagnostic)
      }

      if (customerExists) {
        const directMethods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card', limit: 1 })
        logger.log(`Direct payment methods for ${stripeCustomerId}: ${directMethods.data.length}`)
        if (directMethods.data.length > 0) {
          defaultPmId = directMethods.data[0].id
        } else {
          pmDiagnostic = `Customer ${stripeCustomerId} exists but has no card payment methods attached`
          // Search other Stripe customers with the same email
          const allCustomers = await stripe.customers.list({ email: profile.email, limit: 10 })
          logger.log(`Customers by email ${profile.email}: ${allCustomers.data.map(c => c.id).join(', ')}`)
          for (const c of allCustomers.data) {
            if (c.id === stripeCustomerId) continue
            const methods = await stripe.paymentMethods.list({ customer: c.id, type: 'card', limit: 1 })
            if (methods.data.length > 0) {
              const pm = methods.data[0]
              try {
                await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId })
              } catch (e: any) {
                if (!e.message?.includes('already been attached')) throw e
              }
              defaultPmId = pm.id
              pmDiagnostic = ''
              break
            }
          }
        }
      }

      if (defaultPmId) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: defaultPmId },
        })
        logger.log(`Set default payment method ${defaultPmId} for customer ${stripeCustomerId}`)
      }
    } catch (pmErr: any) {
      pmDiagnostic = pmDiagnostic || pmErr.message
      logger.error('Could not set default payment method:', pmErr.message)
    }

    if (!defaultPmId) {
      const detail = pmDiagnostic ? ` (${pmDiagnostic})` : ''
      return NextResponse.json({ error: `This client has no payment method on file. Ask them to add a card in the app first.${detail}` }, { status: 400 })
    }

    // ── Create Stripe subscription ────────────────────────────────────────────
    const billingTs = Math.floor(new Date(billingDate + 'T00:00:00Z').getTime() / 1000)
    const nowTs = Math.floor(Date.now() / 1000)
    const isFuture = billingTs > nowTs + 86400

    const subscriptionParams: any = {
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      default_payment_method: defaultPmId,
      metadata: { user_id: clientId, plan_id: plan.id },
    }

    if (isFuture) {
      subscriptionParams.trial_end = billingTs
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)
    logger.log(`Created Stripe subscription ${subscription.id} for ${profile.email}, billing from ${billingDate}`)

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
