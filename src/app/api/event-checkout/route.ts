import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { recordPaidEventBooking } from '@/lib/eventBooking'
import { rateLimit } from '@/utils/rateLimit'
import { logger } from '@/utils/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Priced here rather than taken from the browser, so the amount charged can't
// be edited by whoever is filling the form in.
const PAID_EVENTS: Record<string, { name: string; description: string; price: number; successPath: string; cancelPath: string }> = {
  splashdown: {
    name: 'Summer Splashdown',
    description: 'Saturday 5 September 2026 — a day at the lake',
    price: 29,
    successPath: '/splashdown/success',
    cancelPath: '/splashdown',
  },
}

const checkoutSchema = z.object({
  eventSlug: z.string().min(1).max(60),
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email format').max(150),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

// POST — start a paid booking. Nothing is written until Stripe confirms payment.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests — please try again shortly.' }, { status: 429 })
  }

  try {
    const parsed = checkoutSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    const { eventSlug, name, email, notes } = parsed.data

    const event = PAID_EVENTS[eventSlug]
    if (!event) return NextResponse.json({ error: 'Unknown event' }, { status: 400 })

    const origin = req.headers.get('origin') ?? 'https://frontlinefitness.co.uk'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: event.name, description: event.description },
          unit_amount: Math.round(event.price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        event_slug: eventSlug,
        customer_name: name,
        customer_notes: notes || '',
      },
      success_url: `${origin}${event.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${event.cancelPath}`,
    })

    logger.log('[event-checkout] Session created:', session.id)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('[event-checkout] Failed to create session:', err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 })
  }
}

// GET — the confirmation page checks its session here. The webhook normally
// records the booking first; this covers the case where it hasn't landed yet,
// and the unique index on stripe_session_id keeps the two from duplicating.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ paid: false }, { status: 200 })
    }

    await recordPaidEventBooking(session)

    return NextResponse.json({
      paid: true,
      name: session.metadata?.customer_name ?? '',
      amount: (session.amount_total ?? 0) / 100,
    })
  } catch (err) {
    logger.error('[event-checkout] Failed to confirm session:', err)
    return NextResponse.json({ error: 'Could not confirm payment' }, { status: 500 })
  }
}
