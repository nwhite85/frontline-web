import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const subscribeSchema = z.object({
  token: z.string().min(1, 'Token is required').max(128),
});

interface CalendarScheduleItem {
  type: string;
  id: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  title: string;
  location?: string | null;
  description?: string | null;
  status?: string | null;
}

// Database row interfaces
// Types inferred from Supabase queries

// Helper: Format date for ICS
function formatICSDate(date: string, time?: string): string {
  if (!time) {
    return date.replace(/-/g, '');
  }
  const dateStr = date.replace(/-/g, '');
  const timeStr = time.replace(/:/g, '').substring(0, 6);
  return `${dateStr}T${timeStr}`;
}

function escapeICS(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function generateUID(type: string, id: string): string {
  return `${type}-${id}@frontlinefitness.co.uk`;
}

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICS(items: CalendarScheduleItem[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Frontline Fitness//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Frontline Schedule',
    'X-WR-TIMEZONE:Europe/London',
    'X-WR-CALDESC:Your Frontline Fitness schedule',
  ];

  const timestamp = getCurrentTimestamp();

  items.forEach((item) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${generateUID(item.type, item.id)}`);
    lines.push(`DTSTAMP:${timestamp}`);

    lines.push('BEGIN:VTIMEZONE');
    lines.push('TZID:Europe/London');
    lines.push('BEGIN:STANDARD');
    lines.push('DTSTART:19701025T020000');
    lines.push('TZOFFSETFROM:+0100');
    lines.push('TZOFFSETTO:+0000');
    lines.push('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
    lines.push('END:STANDARD');
    lines.push('BEGIN:DAYLIGHT');
    lines.push('DTSTART:19700329T010000');
    lines.push('TZOFFSETFROM:+0000');
    lines.push('TZOFFSETTO:+0100');
    lines.push('RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU');
    lines.push('END:DAYLIGHT');
    lines.push('END:VTIMEZONE');

    const dtstart = formatICSDate(item.date, item.start_time);
    const dtend = formatICSDate(item.date, item.end_time ?? undefined);

    lines.push(`DTSTART;TZID=Europe/London:${dtstart}`);
    lines.push(`DTEND;TZID=Europe/London:${dtend}`);
    lines.push(`SUMMARY:${escapeICS(item.title)}`);

    if (item.description) {
      lines.push(`DESCRIPTION:${escapeICS(item.description)}`);
    }
    if (item.location) {
      lines.push(`LOCATION:${escapeICS(item.location)}`);
    }

    const status = item.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
    lines.push(`STATUS:${status}`);

    if (item.type) {
      lines.push(`CATEGORIES:${item.type.toUpperCase()}`);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const parsed = subscribeSchema.safeParse({ token });
    if (!parsed.success) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Validate token and get user_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('calendar_tokens')
      .select('user_id')
      .eq('token', parsed.data.token)
      .single();

    if (tokenError || !tokenData) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const userId = tokenData.user_id;

    // Update last accessed timestamp
    await supabase
      .from('calendar_tokens')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', parsed.data.token);

    const scheduleItems: CalendarScheduleItem[] = [];

    // 1. Fetch appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, end_time, location, appointment_type, status, client:user_profiles!client_id(name)')
      .eq('trainer_id', userId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true });

    if (appointments) {
      appointments.forEach((apt: any) => {
        const clientName = Array.isArray(apt.client) ? apt.client[0]?.name : apt.client?.name;
        scheduleItems.push({
          type: 'appointment',
          id: apt.id,
          date: apt.appointment_date,
          start_time: apt.start_time,
          end_time: apt.end_time,
          title: `${(apt.appointment_type || 'Appointment').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}${clientName ? ' - ' + clientName : ''}`,
          description: `Type: ${(apt.appointment_type || 'Appointment').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
          location: apt.location,
          status: apt.status,
        });
      });
    }

    // 2. Fetch class schedules
    try {
      const { data: classSchedules, error: classError } = await supabase
        .from('class_schedules')
        .select(`id, scheduled_date, start_time, end_time, location, status, max_capacity, current_bookings, classes!inner(name, description, trainer_id)`)
        .eq('classes.trainer_id', userId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (classError) {
        logger.error('[Calendar Subscribe] Error fetching class schedules:', classError);
      } else if (classSchedules) {
        classSchedules.forEach((cls: any) => {
          const classInfo = Array.isArray(cls.classes) ? cls.classes[0] : cls.classes;
          const bookingInfo = `${cls.current_bookings || 0}/${cls.max_capacity} booked`;
          scheduleItems.push({
            type: 'class',
            id: cls.id,
            date: cls.scheduled_date,
            start_time: cls.start_time,
            end_time: cls.end_time,
            title: `${classInfo?.name || 'Class'} (${bookingInfo})`,
            description: classInfo?.description || '',
            location: cls.location,
            status: cls.status,
          });
        });
      }
    } catch (error) {
      logger.error('[Calendar Subscribe] Exception fetching class schedules:', error);
    }

    // 3. Fetch events
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name, description, start_date, end_date, start_time, end_time, location, status')
        .eq('trainer_id', userId)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (eventsError) {
        logger.error('[Calendar Subscribe] Error fetching events:', eventsError);
      } else if (events) {
        events.forEach((evt: any) => {
          scheduleItems.push({
            type: 'event',
            id: evt.id,
            date: evt.start_date,
            start_time: evt.start_time,
            end_time: evt.end_time,
            title: evt.name,
            description: evt.description,
            location: evt.location,
            status: evt.status,
          });
        });
      }
    } catch (error) {
      logger.error('[Calendar Subscribe] Exception fetching events:', error);
    }

    // 4. Fetch challenge schedules
    try {
      const { data: challengeSchedules, error: challengeError } = await supabase
        .from('challenge_schedules')
        .select(`id, scheduled_date, start_time, end_time, location, status, challenges!inner(name, description, trainer_id)`)
        .eq('challenges.trainer_id', userId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (challengeError) {
        logger.error('[Calendar Subscribe] Error fetching challenge schedules:', challengeError);
      } else if (challengeSchedules) {
        challengeSchedules.forEach((chal: any) => {
          const chalInfo = Array.isArray(chal.challenges) ? chal.challenges[0] : chal.challenges;
          scheduleItems.push({
            type: 'challenge',
            id: chal.id,
            date: chal.scheduled_date,
            start_time: chal.start_time,
            end_time: chal.end_time,
            title: `Challenge: ${chalInfo?.name || 'Challenge'}`,
            description: chalInfo?.description,
            location: chal.location,
            status: chal.status,
          });
        });
      }
    } catch (error) {
      logger.error('[Calendar Subscribe] Exception fetching challenge schedules:', error);
    }

    scheduleItems.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    const icsContent = generateICS(scheduleItems);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="frontline-schedule.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Calendar subscription error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
