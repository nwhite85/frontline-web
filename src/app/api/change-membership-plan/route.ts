import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/change-membership-plan
// Body: { clientId: string, newPlanId: string }
// Changes a client's membership plan. If they have a live Stripe subscription,
// updates it to the new plan's price (Stripe handles proration). Otherwise
// just swaps the DB record (for manual/Push Press members).

export async function POST(request: NextRequest) {
  try {
    const { clientId, newPlanId } = await request.json()
    if (!clientId || !newPlanId) {
      return NextResponse.json({ error: 'clientId and newPlanId are required' }, { status: 400 })
    }

    // ── Load current membership and new plan ──────────────────────────────────
    const [{ data: currentMembership }, { data: newPlan }] = await Promise.all([
      (supabase as any).from('client_memberships')
        .select('id, stripe_subscription_id, membership_plan_id, trainer_id')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle(),
      (supabase as any).from('membership_plans')
        .select('id, name, price, plan_type')
        .eq('id', newPlanId)
        .single(),
    ])

    if (!newPlan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const stripeSubId = currentMembership?.stripe_subscription_id ?? null

    // ── Stripe subscription update (for members who signed up via landing page) ─
    if (stripeSubId) {
      // Find an existing active Stripe price for this plan, or create one
      const existingPrices = await stripe.prices.list({ limit: 100, active: true })
      let newPriceId = existingPrices.data.find(
        (p: any) => p.metadata?.plan_id === newPlan.id && p.recurring?.interval === 'month'
      )?.id ?? null

      if (!newPriceId) {
        const products = await stripe.products.list({ limit: 100 })
        let product = (products.data as any[]).find((p: any) => p.name === newPlan.name && p.active)
        if (!product) {
          product = await stripe.products.create({ name: newPlan.name, metadata: { plan_id: newPlan.id } })
        }
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(newPlan.price * 100),
          currency: 'gbp',
          recurring: { interval: 'month' },
          metadata: { plan_id: newPlan.id },
        })
        newPriceId = price.id
        logger.log(`Created Stripe price ${newPriceId} for plan ${newPlan.name}`)
      }

      // Retrieve the subscription to confirm it's still active and get the item ID
      const sub = await stripe.subscriptions.retrieve(stripeSubId)
      const subStatus = (sub as any).status
      const itemId = (sub as any).items?.data?.[0]?.id

      if (subStatus === 'canceled' || subStatus === 'cancelled' || !itemId) {
        // Subscription is dead in Stripe — clear it from DB and fall through to DB-only swap
        logger.log(`Subscription ${stripeSubId} is ${subStatus} — clearing from DB and doing DB-only swap`)
        await (supabase as any).from('client_memberships')
          .update({ stripe_subscription_id: null })
          .eq('id', currentMembership.id)
      } else {
        // Update the live subscription — prorate immediately
        await stripe.subscriptions.update(stripeSubId, {
          items: [{ id: itemId, price: newPriceId }],
          proration_behavior: 'always_invoice',
        })
        logger.log(`Updated Stripe subscription ${stripeSubId} to price ${newPriceId} (plan: ${newPlan.name})`)

        // Update DB membership plan (keep same record and subscription ID)
        await (supabase as any).from('client_memberships')
          .update({ membership_plan_id: newPlanId })
          .eq('id', currentMembership.id)

        return NextResponse.json({ success: true, stripeUpdated: true, planName: newPlan.name })
      }
    }

    // ── DB-only swap (Push Press / manual members, or cancelled Stripe sub) ────
    const trainerId = currentMembership?.trainer_id ?? null

    await (supabase as any).from('client_memberships')
      .update({ status: 'cancelled' })
      .eq('client_id', clientId)
      .eq('status', 'active')

    await (supabase as any).from('client_memberships').insert({
      client_id: clientId,
      membership_plan_id: newPlanId,
      trainer_id: trainerId,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    })

    logger.log(`Changed membership plan for ${clientId} to ${newPlan.name} (DB only)`)
    return NextResponse.json({ success: true, stripeUpdated: false, planName: newPlan.name })

  } catch (err: any) {
    logger.error('change-membership-plan error:', err)
    return NextResponse.json({ error: err.message || 'Failed to change membership plan' }, { status: 500 })
  }
}
