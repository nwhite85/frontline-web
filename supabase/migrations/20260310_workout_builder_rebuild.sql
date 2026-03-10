-- Workout Builder Rebuild — 2026-03-10
-- Spec: memory/projects/workout-builder-spec.md

-- 1. Workout type on program_workouts
ALTER TABLE program_workouts
  ADD COLUMN workout_type text NOT NULL DEFAULT 'strength'
  CHECK (workout_type IN ('strength', 'circuit'));

-- 2. Tracking field flags on workout_exercises
ALTER TABLE workout_exercises
  ADD COLUMN show_reps boolean NOT NULL DEFAULT true,
  ADD COLUMN show_weight boolean NOT NULL DEFAULT true,
  ADD COLUMN show_time boolean NOT NULL DEFAULT false,
  ADD COLUMN show_distance boolean NOT NULL DEFAULT false;

-- 3. Class sessions table
CREATE TABLE class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES program_workouts(id),
  trainer_id uuid,
  scheduled_at timestamptz NOT NULL,
  title text,
  location text,
  max_capacity integer,
  created_at timestamptz DEFAULT now()
);

-- 4. Class attendees table
CREATE TABLE class_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id uuid REFERENCES class_sessions(id),
  client_id uuid,
  attended boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);
