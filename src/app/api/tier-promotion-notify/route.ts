import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { logger } from '@/utils/logger';
import { tierPromotionEmail } from '@/utils/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientName, currentTier, nextTier } = await req.json();

    if (!clientId || !nextTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch trainer email
    const { data: trainerProfile, error } = await supabase
      .from('user_profiles')
      .select('email, name')
      .eq('user_type', 'trainer')
      .limit(1)
      .maybeSingle();

    if (error || !trainerProfile?.email) {
      logger.error('tier-promotion-notify: could not find trainer email', error);
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const fromDomain = process.env.RESEND_FROM_EMAIL ?? 'Frontline Fitness <onboarding@resend.dev>';

    const emailContent = tierPromotionEmail({
      clientName: clientName || 'A client',
      currentTier,
      nextTier,
    });

    const { error: emailError } = await resend.emails.send({
      from: fromDomain,
      to: trainerProfile.email,
      subject: `${clientName || 'A client'} is ready to move up to ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}`,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailError) {
      logger.error('tier-promotion-notify Resend error:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('tier-promotion-notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
