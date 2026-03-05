import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { rateLimit } from '@/utils/rateLimit';
import { sendTransactionalEmail } from '@/utils/sendTransactionalEmail';
import { trialistBookingEmail, trainerNewTrialistEmail } from '@/utils/emailTemplates';

const trialistSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  classScheduleId: z.string().uuid('Invalid class schedule ID'),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const { success } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = trialistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { firstName, lastName, email, classScheduleId } = parsed.data;

    const supabase = createServerSupabaseClient();

    // Get trainer_id and class info from class_schedules table
    let scheduleData;
    try {
      const { data, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('trainer_id, scheduled_date, start_time')
        .eq('id', classScheduleId)
        .single();

      if (scheduleError) {
        logger.error('[Trialist Booking] Error fetching schedule:', scheduleError);
        return NextResponse.json({ error: 'Class not found' }, { status: 404 });
      }

      scheduleData = data;
    } catch (error) {
      logger.error('[Trialist Booking] Exception fetching schedule:', error);
      return NextResponse.json({ error: 'Failed to fetch class details' }, { status: 500 });
    }

    const trainerId = scheduleData.trainer_id;

    // Check if trialist has already booked this class
    try {
      const { data: existingBooking, error: existingError } = await supabase
        .from('trialist_bookings')
        .select('id')
        .eq('class_schedule_id', classScheduleId)
        .eq('email', email.toLowerCase())
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('[Trialist Booking] Error checking existing booking:', existingError);
      }

      if (existingBooking) {
        return NextResponse.json({ error: 'You have already booked this class' }, { status: 400 });
      }
    } catch (error) {
      logger.error('[Trialist Booking] Exception checking existing booking:', error);
      return NextResponse.json({ error: 'Failed to verify booking status' }, { status: 500 });
    }

    // Insert trialist booking
    const bookingData = {
      class_schedule_id: classScheduleId,
      trainer_id: trainerId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase().trim(),
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    logger.log('Server: Adding trialist booking:', bookingData);

    let data;
    try {
      const result = await supabase
        .from('trialist_bookings')
        .insert(bookingData)
        .select()
        .single();

      data = result.data;
      const error = result.error;

      if (error) {
        logger.error('[Trialist Booking] Insert error:', error);

        if (error.code === '42P01') {
          return NextResponse.json({ error: 'Trialist bookings not available. Please contact support.' }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
      }

      logger.log('Server: Successfully added trialist booking:', data);
    } catch (error) {
      logger.error('[Trialist Booking] Exception inserting booking:', error);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const classDate = new Date(scheduleData.scheduled_date);
    const formattedDate = classDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = scheduleData.start_time?.slice(0, 5) || scheduleData.start_time;

    // Send emails (must await on Vercel serverless or runtime kills before they send)
    const trialistEmail = trialistBookingEmail({
      firstName,
      lastName,
      date: formattedDate,
      time: formattedTime,
    });
    const trainerEmail = trainerNewTrialistEmail({
      firstName,
      lastName,
      email: email.toLowerCase(),
      date: formattedDate,
      time: formattedTime,
    });

    await Promise.allSettled([
      sendTransactionalEmail({
        to: email.toLowerCase(),
        subject: trialistEmail.subject,
        html: trialistEmail.html,
        text: trialistEmail.text,
        replyTo: 'nick@frontlinefitness.co.uk',
      }),
      sendTransactionalEmail({
        to: 'nick@frontlinefitness.co.uk',
        subject: trainerEmail.subject,
        html: trainerEmail.html,
        text: trainerEmail.text,
      }),
    ]);

    return NextResponse.json({
      success: true,
      booking: data,
      message: `You're booked for class on ${formattedDate} at ${formattedTime}. We'll see you there!`
    });

  } catch (err: unknown) {
    logger.error('Server: Error in trialist booking endpoint:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
