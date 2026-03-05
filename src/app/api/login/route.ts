import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/utils/logger';
import { rateLimit } from '@/utils/rateLimit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { email, password } = parsed.data;

    logger.log('Server-side login attempt for:', email?.substring(0, 10) + '...');

    // Use anon key for user auth (service role key doesn't work for signInWithPassword)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, anonKey);

    // Use Supabase auth to sign in and get session
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Login error:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 400 });
    }

    // Fetch user profile to get full name and user type
    let profileName = data.user?.user_metadata?.name;
    let userType = 'client';
    if (data.user?.id) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('name, first_name, last_name, user_type')
        .eq('id', data.user.id)
        .single();

      if (profileData) {
        // Prefer first_name + last_name, fall back to name field
        if (profileData.first_name || profileData.last_name) {
          profileName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        } else if (profileData.name) {
          profileName = profileData.name;
        }
        userType = profileData.user_type || 'client';
      }
    }

    // Return session data for client to use
    return NextResponse.json({
      success: true,
      session: data.session,
      user: {
        ...data.user,
        profile_name: profileName,
        user_type: userType
      },
      message: 'Login successful'
    });

  } catch (error: unknown) {
    logger.error('Login failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}