import type Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

// A paid booking can be recorded twice — once by the Stripe webhook and once by
// the confirmation page, whichever gets there first. Both go through here so
// they write the same row, and the unique index on stripe_session_id turns the
// second write into a no-op update.
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

  const booking = {
    event_slug: eventSlug,
    name: session.metadata?.customer_name ?? '',
    email: email.toLowerCase(),
    adults: 1,
    children: 0,
    notes: session.metadata?.customer_notes || null,
  }
  // Everything from the migration that may not have been run yet.
  const extras = {
    amount_paid: (session.amount_total ?? 0) / 100,
    payment_status: 'paid',
    stripe_session_id: session.id,
    is_vegetarian: session.metadata?.is_vegetarian === 'true',
    is_vegan: session.metadata?.is_vegan === 'true',
  }

  const { error } = await supabase
    .from('event_registrations')
    .upsert({ ...booking, ...extras }, { onConflict: 'stripe_session_id' })

  if (!error) return true

  // Those columns not added yet (PGRST204 unknown column / 42703 undefined
  // column). Money has already changed hands, so keep the booking rather than
  // losing it — the Stripe dashboard still has the payment against the email.
  if (error.code === 'PGRST204' || error.code === '42703') {
    logger.error('[event-booking] Payment/diet columns missing — saving booking without them:', error.message)
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
