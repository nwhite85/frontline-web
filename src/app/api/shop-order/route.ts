import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { logger } from '@/utils/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface OrderItem {
  product: { id: string; name: string; price: number }
  size: string | null
  color: string | null
  qty: number
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, items }: { name: string; email: string; items: OrderItem[] } = await req.json()

    if (!name || !email || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total = items.reduce((s, i) => s + i.product.price * i.qty, 0)

    // Save to DB
    const { error: dbError } = await supabase.from('shop_orders').insert({
      name,
      email,
      items,
      total,
      status: 'pending',
    })

    if (dbError) {
      // Table may not exist yet — log but don't fail the order
      logger.warn('[shop-order] DB insert failed (table may not exist):', dbError.message)
    }

    // Notify Nick via email
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <nick@frontlinefitness.co.uk>'

      const itemsHtml = items.map(i =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${i.product.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">${[i.color, i.size].filter(Boolean).join(' / ') || '—'}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center">${i.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right">£${(i.product.price * i.qty).toFixed(2)}</td>
        </tr>`
      ).join('')

      await resend.emails.send({
        from: fromEmail,
        to: 'nick@frontlinefitness.co.uk',
        replyTo: email,
        subject: `New shop order from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px">New shop order</h2>
            <p style="color:#666;margin:0 0 24px"><strong>${name}</strong> — ${email}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
              <thead>
                <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">
                  <th style="text-align:left;padding-bottom:8px">Item</th>
                  <th style="text-align:left;padding-bottom:8px">Options</th>
                  <th style="text-align:center;padding-bottom:8px">Qty</th>
                  <th style="text-align:right;padding-bottom:8px">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="font-weight:700;margin:16px 0 0;text-align:right">Total: £${total.toFixed(2)}</p>
            <p style="color:#999;font-size:12px;margin:24px 0 0">Reply to this email to contact ${name} directly.</p>
          </div>
        `,
      })

      // Also send confirmation to the customer
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Your Frontline Fitness order',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px">Order received!</h2>
            <p style="color:#666;margin:0 0 24px">Hi ${name}, thanks for your order. Nick will be in touch to arrange collection and payment.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
              <thead>
                <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">
                  <th style="text-align:left;padding-bottom:8px">Item</th>
                  <th style="text-align:left;padding-bottom:8px">Options</th>
                  <th style="text-align:center;padding-bottom:8px">Qty</th>
                  <th style="text-align:right;padding-bottom:8px">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="font-weight:700;margin:16px 0 0;text-align:right">Total: £${total.toFixed(2)}</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[shop-order] Error:', err)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
