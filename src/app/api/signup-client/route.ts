import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { welcomeEmail } from '@/utils/emailTemplates';
import { sendTransactionalEmail } from '@/utils/sendTransactionalEmail';
import { z } from 'zod';

const signupClientSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  planId: z.string().optional(),
  acceptMarketing: z.boolean().optional(),
});
import { rateLimit } from '@/utils/rateLimit';

// Clean and validate environment variables
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const urlMatch = rawUrl.match(/https:\/\/[^\s]+/);
const cleanUrl = urlMatch ? urlMatch[0] : rawUrl.trim();
const cleanKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Create a Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  cleanUrl,
  cleanKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  logger.log('=== SIGNUP CLIENT API START ===');
  try {
    const body = await req.json();
    logger.log('Request body:', body);

    const parsed = signupClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, name, phone, dateOfBirth, gender, planId: _planId, acceptMarketing } = parsed.data;
    // Auto-generate a secure password if not provided (trainer-added clients reset via email)
    const password = parsed.data.password || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!9';

    // Set default calorie goal based on gender (2500 for male, 2000 for others)
    const dailyCalorieGoal = gender === 'male' ? 2500 : 2000;

    // Validate environment variables
    if (!cleanUrl || !cleanKey) {
      logger.error('Missing environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if user already exists
    logger.log('Checking if user already exists with email:', email);
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      logger.log('User already exists with ID:', existingUser.id);
      return NextResponse.json({
        error: 'A user with this email already exists'
      }, { status: 400 });
    }

    // 1. Create the user with password
    logger.log('Step 1: Creating user with email:', email);

    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation for now
      user_metadata: {
        name: name
      }
    });

    if (createUserError) {
      logger.error('Create user error:', createUserError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 400 });
    }

    if (!createUserData.user) {
      logger.error('No user returned from create');
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const userId = createUserData.user.id;
    logger.log('User created successfully with ID:', userId);

    // 2. Create user profile with status 'lead'
    // Note: subscription_plan is set by webhook after payment, not here
    // planId may be a slug string, not a UUID, so we don't set it here
    logger.log('Step 2: Creating user profile for user:', userId);
    let profileData;
    try {
      const result = await supabaseAdmin
        .from('user_profiles')
        .upsert([{
          id: userId,
          name,
          email,
          phone,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          daily_calorie_goal: dailyCalorieGoal,
          user_type: 'client',
          status: 'lead', // Set as lead initially, will become active after payment
          join_date: new Date().toISOString().split('T')[0],
          is_active: false, // Not active until payment
          weight_unit: 'lbs',
          accept_marketing: acceptMarketing || false
        }])
        .select();

      profileData = result.data;
      const profileError = result.error;

      if (profileError || !profileData || profileData.length === 0) {
        logger.error('[Signup Client] Step 2 ERROR - Error creating user_profiles:', {
          error: profileError,
          userId: userId,
          profileData: profileData
        });
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      logger.log('Step 2 SUCCESS: Profile created with lead status');
    } catch (error) {
      logger.error('[Signup Client] Exception creating profile:', error);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // 3. Link to default trainer if configured
    const defaultTrainerId = process.env.DEFAULT_TRAINER_ID;
    if (defaultTrainerId) {
      logger.log('Step 3: Linking client to default trainer:', defaultTrainerId);
      try {
        const { error: trainerLinkError } = await supabaseAdmin
          .from('trainer_client')
          .upsert([{
            trainer_id: defaultTrainerId,
            client_id: userId,
            status: 'active'
          }], {
            onConflict: 'trainer_id,client_id'
          });

        if (trainerLinkError) {
          logger.error('[Signup Client] Step 3 WARNING - Error linking client to trainer:', trainerLinkError);
          // Don't fail the signup, just log the warning
        } else {
          logger.log('Step 3 SUCCESS: Client linked to default trainer');
        }
      } catch (error) {
        logger.error('[Signup Client] Exception linking to trainer:', error);
        // Don't fail the signup, just log the warning
      }
    } else {
      logger.log('Step 3 SKIPPED: No DEFAULT_TRAINER_ID configured');
    }

    // Send welcome email
    try {
      if (email) {
        const welcomeEmailContent = welcomeEmail({ clientName: name });
        await sendTransactionalEmail({
          to: email,
          subject: welcomeEmailContent.subject,
          html: welcomeEmailContent.html,
          text: welcomeEmailContent.text,
        });
      }
    } catch (emailError) {
      logger.error('[Signup Client] Welcome email failed (non-blocking):', emailError);
    }

    logger.log('Client created successfully as lead');
    return NextResponse.json({
      success: true,
      client: profileData[0],
      userId: userId,
      message: 'Client created successfully as lead. Awaiting payment to activate.',
    }, { status: 201 });
  } catch (err: unknown) {
    logger.error('Unexpected error in signup-client API route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
