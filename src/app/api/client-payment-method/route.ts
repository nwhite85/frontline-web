import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId')
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Look up the Stripe customer ID — new signups store it on user_profiles,
    // client-app signups store it in stripe_customers table
    const [{ data: profile }, { data: stripeCustomerRow }] = await Promise.all([
      supabase.from('user_profiles').select('stripe_customer_id').eq('id', clientId).single(),
      supabase.from('stripe_customers').select('stripe_customer_id').eq('user_id', clientId).single(),
    ])

    const stripeCustomerId = profile?.stripe_customer_id ?? stripeCustomerRow?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      return NextResponse.json({ paymentMethod: null })
    }

    // Fetch default payment method from Stripe
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (stripeCustomer.deleted) {
      return NextResponse.json({ paymentMethod: null })
    }

    const defaultPm = stripeCustomer.invoice_settings?.default_payment_method

    if (!defaultPm || typeof defaultPm === 'string') {
      // No default — try listing payment methods instead
      const methods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 1,
      })
      const pm = methods.data[0]
      if (!pm) return NextResponse.json({ paymentMethod: null })
      return NextResponse.json({
        paymentMethod: {
          id: pm.id,
          cardType: pm.card?.brand ?? 'card',
          lastFour: pm.card?.last4 ?? '····',
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        },
      })
    }

    return NextResponse.json({
      paymentMethod: {
        id: defaultPm.id,
        cardType: defaultPm.card?.brand ?? 'card',
        lastFour: defaultPm.card?.last4 ?? '····',
        expMonth: defaultPm.card?.exp_month,
        expYear: defaultPm.card?.exp_year,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
