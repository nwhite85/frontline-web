// Shared helpers for assigning / rolling over client training programmes.
//
// Programme queue model (uses the existing client_programs.status check constraint,
// which allows only 'active' | 'paused' | 'completed'):
//   active    → the programme the client is currently working through (the app shows this one)
//   paused    → a QUEUED programme waiting to auto-start when the active one finishes
//               (we reuse 'paused' as "queued" because the status constraint has no
//               'queued' value and 'paused' is otherwise unused for programmes)
//   completed → a finished programme the client has rolled past
//
// A programme rolls over only when the active one's end_date has passed AND a queued
// programme is waiting. A lone programme has no successor, so it just stays active —
// i.e. exactly the pre-existing behaviour.
//
// The app renders the active programme's workouts straight from the program_workouts
// template (keyed by the active client_programs.program_id) and derives the current
// week from assigned_at, so switching which row is 'active' is all that's needed to
// hand a client from one programme to the next — no per-client workout copies involved.

export const QUEUED_STATUS = 'paused'

// end_date = start + duration_weeks * 7 days, as a YYYY-MM-DD date string.
export function addWeeks(startISODate: string, weeks: number): string {
  const d = new Date(startISODate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + Math.max(1, weeks) * 7)
  return d.toISOString().split('T')[0]
}
