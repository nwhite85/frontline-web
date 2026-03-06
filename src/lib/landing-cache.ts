import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Public anon client — no auth needed for landing page data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Membership plans — rarely change, cache for 1 hour
export const getCachedMembershipPlans = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('membership_plans')
      .select('id, name, price, description, features, stripe_price_id, period')
      .eq('is_active', true)
    return data ?? []
  },
  ['membership-plans'],
  { revalidate: 3600 }
)

// Class templates — rarely change, cache for 1 hour
export const getCachedClasses = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, description, duration_minutes, image_url')
      .limit(20)
    return data ?? []
  },
  ['classes'],
  { revalidate: 3600 }
)

// Schedule for current week — revalidate every 5 minutes
export const getCachedSchedule = unstable_cache(
  async (startDate: string, endDate: string) => {
    const { data } = await supabase
      .from('class_schedules')
      .select('id, scheduled_date, start_time, end_time, location, max_capacity, current_bookings, status, class:class_id(name, description, skill_level, duration_minutes)')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .in('status', ['scheduled', 'active'])
      .order('scheduled_date')
      .order('start_time')
      .limit(100)
    return data ?? []
  },
  ['schedule'],
  { revalidate: 300 }
)

// Upcoming classes for booking form — revalidate every 5 minutes
export const getCachedBookingOptions = unstable_cache(
  async (startDate: string, endDate: string) => {
    const { data } = await supabase
      .from('class_schedules')
      .select('id, scheduled_date, start_time, class:class_id(name)')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .in('status', ['scheduled', 'active'])
      .order('scheduled_date')
      .order('start_time')
      .limit(50)
    return data ?? []
  },
  ['booking-options'],
  { revalidate: 300 }
)
