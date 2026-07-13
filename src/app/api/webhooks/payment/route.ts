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

async function handleNewSignupAccount(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getAdminClient>
): Promise<string | null> {
  const email = session.metadata!.signup_email
  const name = session.metadata!.signup_name || ''
  const phone = session.metadata!.signup_phone || undefined
  const dateOfBirth = session.metadata!.signup_dob || undefined
  const gender = session.metadata!.signup_gender || undefined
  const acceptMarketing = session.metadata?.accept_marketing === 'true'
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

  const nameParts = name.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ') || null
  const dailyCalorieGoal = gender === 'male' ? 2500 : 2000

  // Guard: don't create duplicate if webhook fires twice
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    logger.log(`[new-signup] Account already exists for ${email}, skipping creation`)
    return existingProfile.id
  }

  const autoPassword =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2).toUpperCase() +
    '!9'

  const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password: autoPassword,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createUserError || !createUserData.user) {
    logger.error('[new-signup] Failed to create auth user:', createUserError)
    return null
  }

  const userId = createUserData.user.id

  const profileRow: Record<string, unknown> = {
    id: userId,
    name,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone ?? null,
    date_of_birth: dateOfBirth ?? null,
    gender: gender ?? null,
    daily_calorie_goal: dailyCalorieGoal,
    user_type: 'client',
    status: 'active',
    is_active: true,
    client_type: 'classes',
    join_date: new Date().toISOString().split('T')[0],
    weight_unit: 'lbs',
    accept_marketing: acceptMarketing,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
  }

  const { error: profileError } = await supabase.from('user_profiles').insert(profileRow)
  if (profileError) {
    logger.error('[new-signup] Failed to create profile:', profileError)
    return null
  }

  const defaultTrainerId = process.env.DEFAULT_TRAINER_ID
  if (defaultTrainerId) {
    await supabase.from('trainer_client').upsert(
      [{ trainer_id: defaultTrainerId, client_id: userId, status: 'active' }],
      { onConflict: 'trainer_id,client_id' }
    )
  }

  logger.log(`[new-signup] Account created for ${email} (${userId}) after payment`)
  return userId
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Trainer-created order — identified by trainer_order_id in metadata
  if (session.metadata?.trainer_order_id) {
    await handleTrainerOrderCompleted(session, session.metadata.trainer_order_id)
    return
  }

  // Shop order — identified by order_items in metadata
  if (session.metadata?.order_items) {
    await handleShopOrderCompleted(session)
    return
  }

  const supabase = getAdminClient()
  let userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const planType = session.metadata?.plan_type ?? 'recurring';
  const classCredits = parseInt(session.metadata?.class_credits ?? '0', 10) || 0;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  logger.log('Checkout completed:', { userId, planId, planType, classCredits, customerId });

  // New website signup — create account now that payment is confirmed
  if (!userId && session.metadata?.signup_email) {
    const newId = await handleNewSignupAccount(session, supabase)
    if (!newId) return
    userId = newId
  }

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
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null
      const membershipRow: Record<string, unknown> = {
        client_id: userId,
        membership_plan_id: planId,
        trainer_id: plan.trainer_id,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        ...(subscriptionId && !isCreditPackage ? { stripe_subscription_id: subscriptionId } : {}),
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

  // Send welcome email to client now that payment is confirmed
  try {
    const { welcomeEmail } = await import('@/utils/emailTemplates')
    const { sendTransactionalEmail } = await import('@/utils/sendTransactionalEmail')
    const { data: profileForWelcome } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle()

    const clientName = (profileForWelcome as any)?.name ?? 'there'
    const clientEmail = (profileForWelcome as any)?.email

    if (clientEmail) {
      // Generate a password setup link
      const supabaseAdmin = getAdminClient()
      let passwordSetupUrl: string | undefined
      try {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: clientEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://frontlinefitness.co.uk'}/update-password`,
          },
        })
        passwordSetupUrl = linkData?.properties?.action_link ?? undefined
      } catch { /* non-blocking */ }

      const welcomeContent = welcomeEmail({ clientName, passwordSetupUrl })
      await sendTransactionalEmail({
        to: clientEmail,
        subject: welcomeContent.subject,
        html: welcomeContent.html,
        text: welcomeContent.text,
      })
      logger.log(`Welcome email sent to ${clientEmail} after payment confirmed`)
    }
  } catch (err) {
    logger.error('Failed to send welcome email after checkout:', err)
  }

  // Notify Nick of new payment
  try {
    const { Resend } = await import('resend')
    const { trainerNewPaymentEmail } = await import('@/utils/emailTemplates')
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <nick@frontlinefitness.co.uk>'

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, email')
        .eq('id', userId)
        .maybeSingle()

      const clientName = (profile as any)?.name ?? 'Unknown'
      const clientEmail = (profile as any)?.email ?? ''
      const planName = session.metadata?.plan_name ?? 'Unknown plan'
      const planType = session.metadata?.plan_type ?? 'recurring'
      const amount = `£${((session.amount_total ?? 0) / 100).toFixed(2)}`

      const notif = trainerNewPaymentEmail({ clientName, clientEmail: clientEmail || undefined, planName, amount, planType })
      await resend.emails.send({
        from: fromEmail,
        to: 'nick@frontlinefitness.co.uk',
        replyTo: clientEmail || undefined,
        subject: notif.subject,
        html: notif.html,
        text: notif.text,
      })
    }
  } catch (err) {
    logger.error('Failed to send payment notification to Nick:', err)
  }
}

async function handleTrainerOrderCompleted(session: Stripe.Checkout.Session, orderId: string) {
  const supabase = getAdminClient()
  await supabase
    .from('trainer_shop_orders')
    .update({ payment_status: 'paid', stripe_session_id: session.id })
    .eq('id', orderId)
  logger.log(`[trainer-order] Order ${orderId} marked paid`)
  // Send the same shop emails
  await handleShopOrderCompleted(session)
}

async function handleShopOrderCompleted(session: Stripe.Checkout.Session) {
  const { Resend } = await import('resend')
  const { trainerShopOrderEmail, shopOrderCustomerEmail } = await import('@/utils/emailTemplates')
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <nick@frontlinefitness.co.uk>'

  const customerName = session.metadata?.customer_name ?? 'Customer'
  const customerEmail = session.customer_email ?? ''
  let items: Array<{ name: string; color?: string | null; size?: string | null; qty: number; price: number }> = []
  try { items = JSON.parse(session.metadata?.order_items ?? '[]') } catch { /* ignore */ }

  const total = (session.amount_total ?? 0) / 100

  // Notify Nick — branded template
  const notif = trainerShopOrderEmail({ customerName, customerEmail: customerEmail || undefined, items, total })
  await resend.emails.send({
    from: fromEmail,
    to: 'nick@frontlinefitness.co.uk',
    replyTo: customerEmail || undefined,
    subject: notif.subject,
    html: notif.html,
  })

  // Confirm to customer — branded
  if (customerEmail) {
    const confirm = shopOrderCustomerEmail({ customerName, items, total })
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: confirm.subject,
      html: confirm.html,
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

  // Close the membership tied to this subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('client_memberships')
    .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0], next_billing_date: null })
    .eq('stripe_subscription_id', subscription.id)
    .eq('status', 'active')

  if (userId) {
    await supabase.from('user_profiles').update({ status: 'inactive', is_active: false }).eq('id', userId);
    logger.log(`Subscription cancelled for user ${userId}`);
  } else if (customerId) {
    // Fallback: look up by stripe_customer_id if column exists
    logger.log(`Subscription cancelled for customer ${customerId} (no user_id in metadata)`);
  }
}
