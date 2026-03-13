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
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  logger.log('Checkout completed:', { userId, planId, customer });

  if (!userId) {
    logger.error('No user_id in checkout session metadata');
    return;
  }

  // Activate the user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      status: 'active',
      is_active: true,
    })
    .eq('id', userId);

  if (profileError) {
    logger.error('Error activating user profile:', profileError);
  } else {
    logger.log(`Activated user ${userId}`);
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
