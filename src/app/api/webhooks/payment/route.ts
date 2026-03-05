// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Stripe webhook: table names differ between old/new schema; fix when Stripe goes live
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/utils/logger';
import { paymentReceiptEmail } from '@/utils/emailTemplates';
import { sendTransactionalEmail } from '@/utils/sendTransactionalEmail';
import { getErrorMessage } from '@/utils/errorHandling';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type ClientPackagePurchase = Tables['client_package_purchases']['Insert'];

const supabase = createServerSupabaseClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: unknown) {
      logger.error('Webhook signature verification failed:', getErrorMessage(err));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { type, data } = event;

    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(data.object);
        break;
      default:
        logger.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { 
    id: payment_id, 
    amount,
    metadata 
  } = paymentIntent;

  const {
    client_id: _client_id,
    package_id,
    event_id,
    trainer_id: _trainer_id
  } = metadata;

  try {
    if (package_id) {
      // Handle package payment
      await handlePackagePayment(payment_id, amount, metadata);
    } else if (event_id) {
      // Handle event booking payment
      await handleEventPayment(payment_id, amount, metadata);
    } else {
      throw new Error('Payment metadata missing both package_id and event_id');
    }
  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePackagePayment(payment_id: string, amount: number, metadata: Stripe.Metadata) {
  const { client_id, package_id, trainer_id } = metadata;

  // Get package details
  try {
    const { data: packageData, error: packageError } = await supabase
      .from('session_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (packageError) {
      logger.error('[Webhook Payment] Failed to fetch package:', packageError);
      throw packageError;
    }

    // Create package purchase record
    const purchaseData: ClientPackagePurchase = {
      client_id,
      trainer_id,
      package_id,
      sessions_remaining: packageData.is_unlimited ? 999999 : packageData.session_count,
      sessions_total: packageData.is_unlimited ? 999999 : packageData.session_count,
      amount_paid: amount / 100, // Convert from cents
      status: 'active',
      payment_method: 'card',
      payment_reference: payment_id,
      purchase_date: new Date().toISOString(),
    };

    // Set expiry date if package has validity
    if (packageData.validity_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + packageData.validity_days);
      purchaseData.expiry_date = expiryDate.toISOString();
    }

    const { error: insertError } = await supabase
      .from('client_package_purchases')
      .insert(purchaseData);

    if (insertError) {
      logger.error('[Webhook Payment] Failed to insert package purchase:', insertError);
      throw insertError;
    }

    logger.log(`Package purchase created for client ${client_id}`);

    // Send payment receipt email
    try {
      const { data: clientUser } = await createServerSupabaseClient().auth.admin.getUserById(client_id);
      if (clientUser?.user?.email) {
        const email = paymentReceiptEmail({
          clientName: clientUser.user.user_metadata?.full_name || clientUser.user.user_metadata?.name || 'there',
          amount: `£${(amount / 100).toFixed(2)}`,
          description: packageData.name || 'Session Package',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          paymentMethod: 'Card',
          referenceId: payment_id,
        });
        await sendTransactionalEmail({ to: clientUser.user.email, subject: email.subject, html: email.html, text: email.text });
      }
    } catch (emailErr) {
      logger.error('[Webhook Payment] Receipt email failed (non-blocking):', emailErr);
    }
  } catch (error) {
    logger.error('[Webhook Payment] Exception in handlePackagePayment:', error);
    throw error;
  }
}

async function handleEventPayment(payment_id: string, amount: number, metadata: Stripe.Metadata) {
  const { client_id, event_id, trainer_id } = metadata;

  try {
    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError) {
      logger.error('[Webhook Payment] Failed to fetch event:', eventError);
      throw eventError;
    }

    // Create event booking record
    const bookingData = {
      client_id,
      trainer_id,
      event_id,
      booking_status: 'confirmed',
      payment_status: 'paid',
      amount_paid: amount / 100, // Convert from cents
      payment_method: 'card',
      payment_reference: payment_id,
      booking_date: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('event_bookings')
      .insert(bookingData);

    if (insertError) {
      logger.error('[Webhook Payment] Failed to insert event booking:', insertError);
      throw insertError;
    }

    logger.log(`Event booking created for client ${client_id} for event ${event_id}`);

    // Send payment receipt email
    try {
      const { data: clientUser } = await createServerSupabaseClient().auth.admin.getUserById(client_id);
      if (clientUser?.user?.email) {
        const email = paymentReceiptEmail({
          clientName: clientUser.user.user_metadata?.full_name || clientUser.user.user_metadata?.name || 'there',
          amount: `£${(amount / 100).toFixed(2)}`,
          description: eventData.title || eventData.name || 'Event Booking',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          paymentMethod: 'Card',
          referenceId: payment_id,
        });
        await sendTransactionalEmail({ to: clientUser.user.email, subject: email.subject, html: email.html, text: email.text });
      }
    } catch (emailErr) {
      logger.error('[Webhook Payment] Receipt email failed (non-blocking):', emailErr);
    }
  } catch (error) {
    logger.error('[Webhook Payment] Exception in handleEventPayment:', error);
    throw error;
  }
}

async function handlePaymentFailure(data: Stripe.PaymentIntent) {
  const _payment_id = data.id;
  const client_id = data.metadata?.client_id;
  const reason = data.last_payment_error?.message || 'Unknown';

  // Log payment failure for tracking
  logger.log(`Payment failed for client ${client_id}: ${reason}`);

  // Could send notification to client about failed payment
  // await sendPaymentFailureNotification(client_id, reason);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // This fires when a Stripe Checkout session is completed
  const { id, metadata, mode } = session;
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const subscription = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

  logger.log('Checkout completed:', { id, customer, subscription, mode, metadata });

  const userId = metadata?.user_id;
  const planId = metadata?.plan_id;

  if (!userId) {
    logger.error('No user_id in checkout session metadata');
    return;
  }

  try {
    // Save/update stripe customer mapping
    if (customer) {
      try {
        const { error: customerError } = await supabase
          .from('stripe_customers')
          .upsert({
            user_id: userId,
            stripe_customer_id: customer,
          }, { onConflict: 'user_id' });

        if (customerError) {
          logger.error('[Webhook Payment] Could not save stripe customer:', customerError);
        }
      } catch (error) {
        logger.error('[Webhook Payment] Exception saving stripe customer:', error);
      }
    }

    // Check if planId is a valid UUID before using it
    const isValidUUID = planId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);

    // Activate the user - change status from 'lead' to 'active'
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          status: 'active',
          is_active: true,
          stripe_customer_id: customer || null,
          subscription_status: 'active',
          subscription_plan: isValidUUID ? planId : null,
        })
        .eq('id', userId);

      if (profileError) {
        logger.error('[Webhook Payment] Error activating user profile:', profileError);
      } else {
        logger.log(`Activated user ${userId} - changed status from lead to active`);
      }
    } catch (error) {
      logger.error('[Webhook Payment] Exception activating user profile:', error);
    }

    // If this is a subscription checkout, create user_subscriptions record
    if (mode === 'subscription' && subscription && planId) {
      // Get subscription details from Stripe
      const subscriptionResponse = await stripe.subscriptions.retrieve(subscription as string);

      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: subscription,
        stripe_customer_id: customer,
        status: 'active',
        current_period_end: new Date(subscriptionResponse.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      // Try to create subscription record
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (subError) {
        // Try class_memberships as fallback
        const { error: membershipError } = await supabase
          .from('class_memberships')
          .upsert({
            client_id: userId,
            plan_id: planId,
            subscription_id: subscription,
            status: 'active',
            next_billing_date: new Date(subscriptionResponse.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'client_id,plan_id' });

        if (membershipError) {
          logger.error('Error creating membership record:', membershipError);
        } else {
          logger.log(`Created class_memberships record for user ${userId}`);
        }
      } else {
        logger.log(`Created user_subscriptions record for user ${userId}`);
      }
    }

    logger.log(`Checkout completed: Activated user ${userId} with plan ${planId}`);
  } catch (error) {
    logger.error('Error in checkout completed handler:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = subscription.current_period_end;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  logger.log('Subscription updated:', { subscriptionId, status, cancelAtPeriodEnd });

  try {
    // Update the subscription status in database
    const updateData: { status: string; current_period_end: string; cancel_at_period_end?: boolean } = {
      status: status,
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    };

    if (cancelAtPeriodEnd) {
      updateData.cancel_at_period_end = true;
    }

    // Try user_subscriptions first
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        logger.error('[Webhook Payment] Failed to update user_subscriptions, trying class_memberships:', error);
        // Try class_memberships as fallback
        const { error: fallbackError } = await supabase
          .from('class_memberships')
          .update({
            status: status,
            next_billing_date: new Date(currentPeriodEnd * 1000).toISOString(),
          })
          .eq('subscription_id', subscriptionId);
        
        if (fallbackError) {
          logger.error('[Webhook Payment] Failed to update class_memberships:', fallbackError);
        }
      }
    } catch (error) {
      logger.error('[Webhook Payment] Exception updating subscription:', error);
    }

    logger.log(`Subscription ${subscriptionId} updated to status: ${status}`);
  } catch (error) {
    logger.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Stripe subscription object structure
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? '';
  const status = subscription.status;
  const currentPeriodEnd = subscription.current_period_end;
  const metadata = subscription.metadata || {};

  // Get plan info from the subscription items
  const planId = metadata.plan_id;
  const userId = metadata.user_id;

  // Get amount from the subscription
  const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;

  logger.log('Handling subscription created:', { subscriptionId, customerId, planId, userId, status });

  try {
    // Look up user by Stripe customer ID if userId not in metadata
    let clientId = userId;
    if (!clientId) {
      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      clientId = customerData?.user_id;
    }

    if (!clientId) {
      logger.error('Could not find user for customer:', customerId);
      return;
    }

    // Create or update membership record
    const membershipData = {
      user_id: clientId,
      plan_id: planId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: status === 'active' ? 'active' : 'pending',
      monthly_fee: amount / 100, // Convert from pence
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    // Try to upsert into user_subscriptions table (or class_memberships if that's what exists)
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(membershipData, { onConflict: 'user_id' });

    if (error) {
      // If user_subscriptions doesn't exist, try class_memberships
      logger.log('Trying class_memberships table instead...');
      const { error: altError } = await supabase
        .from('class_memberships')
        .upsert({
          client_id: clientId,
          plan_id: planId,
          subscription_id: subscriptionId,
          status: status === 'active' ? 'active' : 'pending',
          monthly_fee: amount / 100,
          next_billing_date: new Date(currentPeriodEnd * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }, { onConflict: 'client_id,plan_id' });

      if (altError) throw altError;
    }

    // Also update user_profiles with subscription info
    await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: planId,
        stripe_customer_id: customerId,
      })
      .eq('id', clientId);

    logger.log(`Subscription created for user ${clientId}, plan ${planId}`);
  } catch (error) {
    logger.error('Error handling subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? '';

  logger.log('Subscription cancelled:', { subscriptionId, customerId });

  try {
    // Try user_subscriptions first
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        logger.error('[Webhook Payment] Failed to update user_subscriptions, trying class_memberships:', error);
        // Try class_memberships as fallback
        const { error: fallbackError } = await supabase
          .from('class_memberships')
          .update({ status: 'cancelled' })
          .eq('subscription_id', subscriptionId);

        if (fallbackError) {
          logger.error('[Webhook Payment] Failed to update class_memberships:', fallbackError);
        }
      }
    } catch (error) {
      logger.error('[Webhook Payment] Exception updating subscription:', error);
    }

    // Update user profile subscription status
    if (customerId) {
      await supabase
        .from('user_profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', customerId);
    }

    logger.log(`Subscription ${subscriptionId} cancelled`);
  } catch (error) {
    logger.error('Error handling subscription cancellation:', error);
    throw error;
  }
}