import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { logger } from '@/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    // Get the payment intent from the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'No payment found for this session' }, { status: 400 })
    }

    // Issue full refund
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId })

    logger.log(`[shop-refund] Refunded ${sessionId} → refund ${refund.id} status: ${refund.status}`)
    return NextResponse.json({ success: true, refundId: refund.id, status: refund.status })
  } catch (err: any) {
    logger.error('[shop-refund] Error:', err)
    return NextResponse.json({ error: err.message || 'Refund failed' }, { status: 500 })
  }
}
