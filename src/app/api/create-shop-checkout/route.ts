import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { logger } from '@/utils/logger'
import { rateLimit } from '@/utils/rateLimit'

interface OrderItem {
  product: { id: string; name: string; price: number }
  size: string | null
  color: string | null
  qty: number
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const { name, email, items }: { name: string; email: string; items: OrderItem[] } = await req.json()

    if (!name || !email || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const origin = req.headers.get('origin') ?? 'https://frontlinefitness.co.uk'

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.product.name,
          description: [item.color, item.size].filter(Boolean).join(' / ') || undefined,
          metadata: { product_id: item.product.id },
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.qty,
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      metadata: {
        customer_name: name,
        order_items: JSON.stringify(items.map(i => ({
          name: i.product.name,
          color: i.color,
          size: i.size,
          qty: i.qty,
          price: i.product.price,
        }))),
      },
      success_url: `${origin}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/checkout`,
      custom_text: {
        submit: { message: 'You will collect your order from Nick at the park.' },
      },
    })

    logger.log('[create-shop-checkout] Session created:', session.id)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('[create-shop-checkout] Error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
