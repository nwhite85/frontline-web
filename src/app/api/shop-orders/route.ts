import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { logger } from '@/utils/logger'

export async function GET() {
  try {
    // Fetch recent completed checkout sessions that have order_items in metadata (shop orders)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items'],
    })

    const shopOrders = sessions.data
      .filter(s => s.metadata?.order_items && s.payment_status === 'paid')
      .map(s => {
        let items = []
        try { items = JSON.parse(s.metadata?.order_items ?? '[]') } catch { /* ignore */ }
        return {
          id: s.id,
          name: s.metadata?.customer_name ?? s.customer_details?.name ?? 'Unknown',
          email: s.customer_email ?? s.customer_details?.email ?? '',
          total: (s.amount_total ?? 0) / 100,
          items,
          created: s.created,
          payment_status: s.payment_status,
        }
      })
      .sort((a, b) => b.created - a.created)

    return NextResponse.json(shopOrders)
  } catch (err) {
    logger.error('[shop-orders] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
