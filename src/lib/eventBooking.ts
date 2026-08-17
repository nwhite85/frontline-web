import type Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

// Columns added by 20260813_event_registrations_payment.sql. If that migration
// hasn't run, the booking still gets saved without them — money has already
// changed hands, so losing the record is the worst possible outcome.
const MISSING_COLUMN_CODES = ['PGRST204', '42703']

/**
 * A paid booking can be recorded twice — once by the Stripe webhook and once by
 * the confirmation page, whichever gets there first. Deliberately does its own
 * "is it already there?" check rather than an upsert: an upsert needs a unique
 * index on stripe_session_id, and if that index is missing the whole write
 * fails with 42P10 and the booking is lost after the customer has paid.
 */
export async function recordPaidEventBooking(session: Stripe.Checkout.Session): Promise<boolean> {
  const eventSlug = session.metadata?.event_slug
  const email = session.customer_email ?? session.customer_details?.email ?? ''

  if (!eventSlug || !email) {
    logger.error(`[event-booking] Session ${session.id} has no event_slug or email`)
    return false
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Already recorded by whichever path got here first.
  const { data: existing, error: lookupError } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existing) return true
  if (lookupError && !MISSING_COLUMN_CODES.includes(lookupError.code ?? '')) {
    logger.error('[event-booking] Lookup failed, writing anyway:', lookupError)
  }

  const booking = {
    event_slug: eventSlug,
    name: session.metadata?.customer_name ?? '',
    email: email.toLowerCase(),
    adults: 1,
    children: 0,
    notes: session.metadata?.customer_notes || null,
  }
  const extras = {
    amount_paid: (session.amount_total ?? 0) / 100,
    payment_status: session.metadata?.payment_kind === 'deposit' ? 'deposit_paid' : 'paid',
    stripe_session_id: session.id,
    is_vegetarian: session.metadata?.is_vegetarian === 'true',
    is_vegan: session.metadata?.is_vegan === 'true',
  }

  const { error } = await supabase.from('event_registrations').insert({ ...booking, ...extras })
  if (!error) return true

  if (MISSING_COLUMN_CODES.includes(error.code ?? '')) {
    logger.error('[event-booking] Payment columns missing — saving booking without them:', error.message)
    const { error: retryError } = await supabase.from('event_registrations').insert(booking)
    if (retryError) {
      logger.error('[event-booking] Fallback insert failed:', retryError)
      return false
    }
    return true
  }

  logger.error('[event-booking] Failed to record booking:', error)
  return false
}
