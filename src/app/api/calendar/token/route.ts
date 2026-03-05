import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { rateLimit } from '@/utils/rateLimit';

// Helper to get auth user from request
async function getAuthUser(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const authHeader = request.headers.get('authorization');
  const cookieStore = await cookies();

  let token = authHeader?.replace('Bearer ', '');

  if (!token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const sbCookie = cookieStore.get('sb-access-token') ||
                     cookieStore.get('supabase-auth-token') ||
                     cookieStore.get('sb-' + supabaseUrl.split('//')[1]?.split('.')[0] + '-auth-token');
    token = sbCookie?.value;
  }

  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET - Get user's calendar token
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data: existingToken, error } = await supabase
      .from('calendar_tokens')
      .select('token, created_at, last_accessed_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('[Calendar Token GET] Database error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (existingToken) {
      return NextResponse.json({
        token: existingToken.token,
        created_at: existingToken.created_at,
        last_accessed_at: existingToken.last_accessed_at,
      });
    }

    return NextResponse.json({ token: null });
  } catch (error: unknown) {
    logger.error('[Calendar Token GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Generate new calendar token
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const calendarToken = crypto.randomBytes(32).toString('hex');

    // Delete existing token if any
    await supabase.from('calendar_tokens').delete().eq('user_id', user.id);

    // Insert new token
    const { data, error } = await supabase
      .from('calendar_tokens')
      .insert({ user_id: user.id, token: calendarToken })
      .select('token, created_at')
      .single();

    if (error) {
      logger.error('[Calendar Token POST] Insert error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      token: data.token,
      created_at: data.created_at,
    });
  } catch (error: unknown) {
    logger.error('[Calendar Token POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Revoke calendar token
export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('calendar_tokens').delete().eq('user_id', user.id);

    if (error) {
      logger.error('[Calendar Token DELETE] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete calendar token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
