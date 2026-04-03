import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/utils/errorHandling';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', getErrorMessage(err));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      default:
        logger.log(`Unhandled webhook type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Shop order — identified by order_items in metadata
  if (session.metadata?.order_items) {
    await handleShopOrderCompleted(session)
    return
  }

  const supabase = getAdminClient()
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const planType = session.metadata?.plan_type ?? 'recurring';
  const classCredits = parseInt(session.metadata?.class_credits ?? '0', 10) || 0;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  logger.log('Checkout completed:', { userId, planId, planType, classCredits, customerId });

  if (!userId) {
    logger.error('No user_id in checkout session metadata');
    return;
  }

  // Activate the user profile and store stripe_customer_id
  const profileUpdate: Record<string, unknown> = { status: 'active', is_active: true }
  if (customerId) profileUpdate.stripe_customer_id = customerId

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (profileError) {
    logger.error('Error activating user profile:', profileError);
  } else {
    logger.log(`Activated user ${userId}`);
  }

  // Assign membership plan if plan_id is in metadata
  if (planId) {
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('id, trainer_id, plan_type, class_credits, credits_expire_in_days')
      .eq('id', planId)
      .single()

    if (plan) {
      const isCreditPackage = (plan as any).plan_type === 'credit_package'

      if (!isCreditPackage) {
        // Recurring subscription — cancel existing and insert fresh
        await supabase
          .from('client_memberships')
          .update({ status: 'cancelled' })
          .eq('client_id', userId)
          .eq('status', 'active')
      }

      // Build membership row
      const membershipRow: Record<string, unknown> = {
        client_id: userId,
        membership_plan_id: planId,
        trainer_id: plan.trainer_id,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      }

      // For credit packages: set credits and expiry
      if (isCreditPackage) {
        const credits = (plan as any).class_credits ?? classCredits
        membershipRow.class_credits_remaining = credits
        if ((plan as any).credits_expire_in_days) {
          const expiry = new Date()
          expiry.setDate(expiry.getDate() + (plan as any).credits_expire_in_days)
          membershipRow.end_date = expiry.toISOString().split('T')[0]
        }
        logger.log(`Credit package: granting ${credits} class credits to user ${userId}`)
      }

      const { error: memError } = await supabase
        .from('client_memberships')
        .insert(membershipRow)

      if (memError) {
        logger.error('Error creating client_membership:', memError)
      } else {
        logger.log(`Membership plan ${planId} (${(plan as any).plan_type}) assigned to user ${userId}`)
      }
    } else {
      logger.error(`Plan ${planId} not found — membership not assigned`)
    }
  }
}

async function handleShopOrderCompleted(session: Stripe.Checkout.Session) {
  const { Resend } = await import('resend')
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <nick@frontlinefitness.co.uk>'

  const customerName = session.metadata?.customer_name ?? 'Customer'
  const customerEmail = session.customer_email ?? ''
  let items: Array<{ name: string; color?: string | null; size?: string | null; qty: number; price: number }> = []
  try { items = JSON.parse(session.metadata?.order_items ?? '[]') } catch { /* ignore */ }

  const total = (session.amount_total ?? 0) / 100

  const itemsHtml = items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">${[i.color, i.size].filter(Boolean).join(' / ') || '—'}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right">£${(i.price * i.qty).toFixed(2)}</td>
    </tr>`
  ).join('')

  const tableHtml = `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
    <thead><tr style="color:#6b7280;font-size:12px;text-transform:uppercase">
      <th style="text-align:left;padding-bottom:8px">Item</th>
      <th style="text-align:left;padding-bottom:8px">Options</th>
      <th style="text-align:center;padding-bottom:8px">Qty</th>
      <th style="text-align:right;padding-bottom:8px">Price</th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <p style="font-weight:700;margin:16px 0 0;text-align:right">Total: £${total.toFixed(2)}</p>`

  // Notify Nick
  await resend.emails.send({
    from: fromEmail,
    to: 'nick@frontlinefitness.co.uk',
    replyTo: customerEmail || undefined,
    subject: `New shop order from ${customerName} — £${total.toFixed(2)}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 8px">New shop order — paid</h2>
      <p style="color:#666;margin:0 0 24px"><strong>${customerName}</strong>${customerEmail ? ` — ${customerEmail}` : ''}</p>
      ${tableHtml}
    </div>`,
  })

  // Confirm to customer
  if (customerEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: 'Your Frontline Fitness order — payment confirmed',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Payment confirmed!</h2>
        <p style="color:#666;margin:0 0 24px">Hi ${customerName}, your order is confirmed. Nick will be in touch to arrange collection at the park.</p>
        ${tableHtml}
      </div>`,
    })
  }

  logger.log(`[shop-order] Emails sent for session ${session.id}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getAdminClient()
  const userId = subscription.metadata?.user_id;
  const status = subscription.status;

  if (!userId) return;

  if (status === 'active') {
    await supabase.from('user_profiles').update({ status: 'active', is_active: true }).eq('id', userId);
  } else if (status === 'canceled' || status === 'unpaid') {
    await supabase.from('user_profiles').update({ status: 'inactive', is_active: false }).eq('id', userId);
  }

  logger.log(`Subscription updated for user ${userId}: ${status}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = getAdminClient()
  const invoiceId = invoice.id
  const clientId = invoice.metadata?.client_id

  // Mark all appointments on this invoice as paid
  const { error } = await supabase
    .from('appointments')
    .update({ payment_status: 'paid' })
    .eq('stripe_invoice_id', invoiceId)

  if (error) {
    logger.error('Error marking appointments paid:', error)
  } else {
    logger.log(`Invoice ${invoiceId} paid — appointments marked paid for client ${clientId}`)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const supabase = getAdminClient()
  const userId = subscription.metadata?.user_id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;

  if (userId) {
    await supabase.from('user_profiles').update({ status: 'inactive', is_active: false }).eq('id', userId);
    logger.log(`Subscription cancelled for user ${userId}`);
  } else if (customerId) {
    // Fallback: look up by stripe_customer_id if column exists
    logger.log(`Subscription cancelled for customer ${customerId} (no user_id in metadata)`);
  }
}
