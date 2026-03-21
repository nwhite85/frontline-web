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
  const supabase = getAdminClient()
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  logger.log('Checkout completed:', { userId, planId, customerId });

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
    // Fetch trainer_id from the plan
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('id, trainer_id')
      .eq('id', planId)
      .single()

    if (plan) {
      // Cancel any existing active memberships
      await supabase
        .from('client_memberships')
        .update({ status: 'cancelled' })
        .eq('client_id', userId)
        .eq('status', 'active')

      // Insert new membership
      const { error: memError } = await supabase
        .from('client_memberships')
        .insert({
          client_id: userId,
          membership_plan_id: planId,
          trainer_id: plan.trainer_id,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
        })

      if (memError) {
        logger.error('Error creating client_membership:', memError)
      } else {
        logger.log(`Membership plan ${planId} assigned to user ${userId}`)
      }
    } else {
      logger.error(`Plan ${planId} not found — membership not assigned`)
    }
  }
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
