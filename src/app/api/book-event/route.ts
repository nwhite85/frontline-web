import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, clientId } = await request.json()
    if (!eventId || !clientId) {
      return NextResponse.json({ error: 'eventId and clientId are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, price, max_capacity, current_bookings, trainer_id, start_date, start_time')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check capacity
    if (event.max_capacity && (event.current_bookings ?? 0) >= event.max_capacity) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 })
    }

    // Check not already booked
    const { data: existing } = await supabase
      .from('event_bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('client_id', clientId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already booked for this event' }, { status: 400 })
    }

    // Fetch client profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, name, email, stripe_customer_id')
      .eq('id', clientId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const price = event.price ?? 0

    // Free event — just book directly
    if (price === 0) {
      const { error: bookingError } = await supabase.from('event_bookings').insert({
        event_id: eventId,
        client_id: clientId,
        trainer_id: event.trainer_id,
        booking_status: 'confirmed',
        payment_status: 'free',
        amount_paid: 0,
        booking_date: new Date().toISOString().split('T')[0],
      })

      if (bookingError) throw bookingError

      await supabase
        .from('events')
        .update({ current_bookings: (event.current_bookings ?? 0) + 1 })
        .eq('id', eventId)

      logger.log(`Free event booking: ${clientId} → ${eventId}`)
      return NextResponse.json({ success: true, paymentRequired: false })
    }

    // Paid event — charge saved payment method
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No payment method on file. Please add a card in your profile before booking paid events.' },
        { status: 402 }
      )
    }

    // Get default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    if (customer.deleted) {
      return NextResponse.json({ error: 'Stripe customer not found. Please re-add your payment method.' }, { status: 402 })
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method
    if (!defaultPaymentMethod) {
      return NextResponse.json(
        { error: 'No default payment method found. Please add a card in your profile.' },
        { status: 402 }
      )
    }

    // Create and confirm PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // pence
      currency: 'gbp',
      customer: profile.stripe_customer_id,
      payment_method: typeof defaultPaymentMethod === 'string' ? defaultPaymentMethod : defaultPaymentMethod.id,
      confirm: true,
      off_session: true,
      description: `${event.name} — ${event.start_date}`,
      metadata: {
        event_id: eventId,
        client_id: clientId,
        trainer_id: event.trainer_id,
      },
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment failed. Please check your payment method.' },
        { status: 402 }
      )
    }

    // Insert booking
    const { error: bookingError } = await supabase.from('event_bookings').insert({
      event_id: eventId,
      client_id: clientId,
      trainer_id: event.trainer_id,
      booking_status: 'confirmed',
      payment_status: 'paid',
      amount_paid: price,
      booking_date: new Date().toISOString().split('T')[0],
    })

    if (bookingError) throw bookingError

    // Increment current_bookings
    await supabase
      .from('events')
      .update({ current_bookings: (event.current_bookings ?? 0) + 1 })
      .eq('id', eventId)

    logger.log(`Paid event booking: ${clientId} → ${eventId} (£${price}, PI: ${paymentIntent.id})`)
    return NextResponse.json({ success: true, paymentRequired: true, amountCharged: price })
  } catch (error: any) {
    // Handle Stripe authentication errors (card declined, requires action etc.)
    if (error?.type === 'StripeCardError' || error?.code === 'authentication_required') {
      return NextResponse.json(
        { error: 'Payment declined. Please check your card details or use a different payment method.' },
        { status: 402 }
      )
    }
    logger.error('book-event error:', error)
    return NextResponse.json({ error: error.message || 'Failed to book event' }, { status: 500 })
  }
}
