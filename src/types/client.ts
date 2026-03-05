// Shared client-facing types used across client portal pages

export interface ClassSchedule {
  id: string
  scheduled_date: string
  start_time: string
  status: string
  current_bookings?: number
  trainer_id?: string
  class: {
    name: string
    description: string | null
    location: string
    duration_minutes: number
    skill_level: string
    max_capacity: number
  } | null
}

export interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  status: string
  appointment_type: { name: string } | null
}

export interface ChallengeSchedule {
  id: string
  scheduled_date: string
  status: string
  trainer_id?: string
  challenge: { name: string; description: string | null } | null
}

export interface ClientEvent {
  id: string
  name: string
  event_date: string
  location: string | null
}

export interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  email: string
  user_type: string
  join_date: string
  is_active: boolean
  status?: string
}
