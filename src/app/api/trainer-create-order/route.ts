import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface OrderItem {
  product_id: string
  name: string
  price: number
  product_code?: string | null
  category?: string | null
  color?: string | null
  size?: string | null
  qty: number
}

export async function POST(req: NextRequest) {
  try {
    const { trainerId, clientName, clientEmail, items }: {
      trainerId: string
      clientName: string
      clientEmail: string
      items: OrderItem[]
    } = await req.json()

    if (!trainerId || !clientName || !clientEmail || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const supabase = getAdminClient()
    const origin = req.headers.get('origin') ?? 'https://frontlinefitness.co.uk'

    // Insert pending order first so we have the ID for metadata
    const { data: order, error: insertError } = await supabase
      .from('trainer_shop_orders')
      .insert({
        trainer_id: trainerId,
        client_name: clientName,
        client_email: clientEmail,
        items,
        total,
        payment_status: 'awaiting_payment',
      })
      .select('id')
      .single()

    if (insertError || !order) {
      logger.error('[trainer-create-order] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 })
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          description: [item.color, item.size].filter(Boolean).join(' / ') || undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail,
      line_items: lineItems,
      metadata: {
        customer_name: clientName,
        trainer_order_id: order.id,
        order_items: JSON.stringify(items.map(i => ({
          name: i.name,
          product_code: i.product_code ?? null,
          category: i.category ?? null,
          color: i.color ?? null,
          size: i.size ?? null,
          qty: i.qty,
          price: i.price,
        }))),
      },
      success_url: `${origin}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    })

    // Store the Stripe session ID against the order
    await supabase
      .from('trainer_shop_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    // Email the client the payment link
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <noreply@frontlinefitness.co.uk>'
      const itemLines = items.map(i => {
        const variant = [i.color, i.size].filter(Boolean).join(' / ')
        return `${i.name}${variant ? ` — ${variant}` : ''}${i.qty > 1 ? ` ×${i.qty}` : ''} — £${(i.price * i.qty).toFixed(2)}`
      }).join('<br>')
      await resend.emails.send({
        from: fromEmail,
        to: clientEmail,
        subject: `Your Frontline Fitness order — £${total.toFixed(2)}`,
        html: `
          <p>Hi ${clientName},</p>
          <p>Your trainer has put together an order for you. Click the link below to pay securely:</p>
          <p><a href="${session.url}" style="background:#111;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Pay Now — £${total.toFixed(2)}</a></p>
          <p style="margin-top:16px;color:#666;font-size:14px;">${itemLines}</p>
          <p style="color:#666;font-size:12px;">This link expires in 24 hours. If you have any questions, reply to this email.</p>
        `,
      })
    } catch (emailErr) {
      logger.error('[trainer-create-order] Email error:', emailErr)
      // Don't fail the request — order and session are created
    }

    logger.log(`[trainer-create-order] Order ${order.id} created, session ${session.id}`)
    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err) {
    logger.error('[trainer-create-order] Error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
