import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function GET() {
  try {
    // Fetch product lookup map (name → {product_code, category}) for enriching old orders
    // Only use name-unique products to avoid mis-labelling ambiguous items (e.g. "Member T-Shirt" in mens+womens)
    const supabase = createServerSupabaseClient()
    const { data: allProducts } = await (supabase as any)
      .from('shop_products')
      .select('name, product_code, category')

    // Build a map: lowercase name → product info, but only for names that are unique across categories
    const productMap: Record<string, { product_code: string | null; category: string }> = {}
    if (allProducts) {
      const nameCounts: Record<string, number> = {}
      for (const p of allProducts as any[]) nameCounts[p.name.toLowerCase()] = (nameCounts[p.name.toLowerCase()] ?? 0) + 1
      for (const p of allProducts as any[]) {
        if (nameCounts[p.name.toLowerCase()] === 1) {
          productMap[p.name.toLowerCase()] = { product_code: p.product_code, category: p.category }
        }
      }
    }

    // Fetch recent completed checkout sessions that have order_items in metadata (shop orders)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items'],
    })

    // Also fetch refunds to check which orders have been refunded
    const refunds = await stripe.refunds.list({ limit: 100 })
    const refundedPaymentIntents = new Set(
      refunds.data
        .filter(r => r.status === 'succeeded')
        .map(r => typeof r.payment_intent === 'string' ? r.payment_intent : r.payment_intent?.id)
        .filter(Boolean)
    )

    const shopOrders = await Promise.all(
      sessions.data
        .filter(s => s.metadata?.order_items && s.payment_status === 'paid')
        .map(async s => {
          let items: any[] = []
          try { items = JSON.parse(s.metadata?.order_items ?? '[]') } catch { /* ignore */ }
          // Enrich items missing product_code or category from the product lookup map
          items = items.map(item => {
            const lookup = productMap[item.name?.toLowerCase()]
            return {
              ...item,
              product_code: item.product_code ?? lookup?.product_code ?? null,
              category: item.category ?? lookup?.category ?? null,
            }
          })
          const piId = typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent as any)?.id
          const isRefunded = piId ? refundedPaymentIntents.has(piId) : false
          return {
            id: s.id,
            name: s.metadata?.customer_name ?? s.customer_details?.name ?? 'Unknown',
            email: s.customer_email ?? s.customer_details?.email ?? '',
            total: (s.amount_total ?? 0) / 100,
            items,
            created: s.created,
            payment_status: isRefunded ? 'refunded' : s.payment_status,
          }
        })
    )

    shopOrders.sort((a, b) => b.created - a.created)

    return NextResponse.json(shopOrders)
  } catch (err) {
    logger.error('[shop-orders] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
