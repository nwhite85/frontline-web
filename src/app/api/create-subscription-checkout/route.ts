import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { rateLimit } from '@/utils/rateLimit';
import { z } from 'zod';

const subscriptionCheckoutSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1).optional(),
  planPrice: z.number().positive('Price must be positive'),
  userId: z.string().optional(),
  acceptMarketing: z.boolean().optional(),
});

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = subscriptionCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { email, name, phone, dateOfBirth, gender, planId, planName, planPrice, userId, acceptMarketing } = parsed.data;

    // New website signups have no userId — they arrive unauthenticated.
    // Existing users (re-subscribing from dashboard) pass a userId and must be authenticated.
    if (userId) {
      const { cookies } = await import('next/headers');
      const { createServerClient } = await import('@supabase/ssr');
      const cookieStore = await cookies();
      const authSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user: authUser } } = await authSupabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    logger.log('Create subscription checkout:', { email, planId, planName, planPrice });

    // Check if we have a Stripe price ID for this plan and get plan type
    const { data: planData } = await supabaseAdmin
      .from('membership_plans')
      .select('stripe_price_id, plan_type, class_credits')
      .eq('id', planId)
      .single();

    const planType = planData?.plan_type ?? 'recurring'
    const isCreditPackage = planType === 'credit_package'
    let stripePriceId = planData?.stripe_price_id;

    // If the saved price ID is the wrong type for this plan (e.g. a recurring price cached
    // before the plan was changed to credit_package), discard it and create a fresh one.
    if (stripePriceId && isCreditPackage) {
      try {
        const existingPrice = await stripe.prices.retrieve(stripePriceId)
        if (existingPrice.recurring) {
          logger.log('Discarding recurring price for credit_package plan, will create one-time price')
          stripePriceId = undefined
        }
      } catch {
        stripePriceId = undefined
      }
    }

    // If no Stripe price ID exists, create the product and price in Stripe
    if (!stripePriceId) {
      logger.log('Creating Stripe product and price for plan:', planName);

      // Create or find product
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.name === planName && p.active);

      if (!product) {
        product = await stripe.products.create({
          name: planName || 'Membership Plan',
          metadata: {
            plan_id: planId,
          },
        });
        logger.log('Created Stripe product:', product.id);
      }

      // Create price — recurring for subscription plans, one_time for credit packages
      const priceData: any = {
        product: product.id,
        unit_amount: Math.round(planPrice * 100),
        currency: 'gbp',
        metadata: { plan_id: planId },
      }
      if (!isCreditPackage) {
        priceData.recurring = { interval: 'month' }
      }
      const price = await stripe.prices.create(priceData);
      logger.log('Created Stripe price:', price.id);

      stripePriceId = price.id;

      // Save price ID to database for future use
      try {
        await supabaseAdmin
          .from('membership_plans')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', planId);
      } catch (error) {
        logger.error('[Create Subscription Checkout] Failed to save stripe_price_id:', error);
        // Don't fail the request, just log the error
      }
    }

    // Create or retrieve Stripe customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      logger.log('Found existing Stripe customer:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        phone: phone,
        metadata: {
          user_id: userId || '',
          accept_marketing: acceptMarketing ? 'true' : 'false',
        },
      });
      customerId = customer.id;
      logger.log('Created Stripe customer:', customerId);
    }

    // Create Stripe Checkout session
    const sessionParams: any = {
      customer: customerId as string,
      mode: isCreditPackage ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId as string, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://frontlinefitness.co.uk'}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://frontlinefitness.co.uk'}/signup?plan=${planId}&cancelled=true`,
      metadata: {
        user_id: userId || '',
        plan_id: planId,
        plan_name: planName || '',
        plan_type: planType,
        class_credits: String(planData?.class_credits ?? 0),
        accept_marketing: acceptMarketing ? 'true' : 'false',
        // New website signups — account is created by the webhook after payment
        ...(userId ? {} : {
          signup_email: email,
          signup_name: name || '',
          signup_phone: phone || '',
          signup_dob: dateOfBirth || '',
          signup_gender: gender || '',
        }),
      },
    }
    // Add subscription metadata only for recurring plans
    if (!isCreditPackage) {
      sessionParams.subscription_data = {
        metadata: { user_id: userId || '', plan_id: planId },
      }
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.log('Created checkout session:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: unknown) {
    logger.error('Error creating subscription checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
