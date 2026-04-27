-- Allow anonymous/public reads on challenge_schedules so the landing page
-- timetable can display checkpoints alongside classes.
CREATE POLICY "Public read challenge_schedules"
  ON challenge_schedules
  FOR SELECT
  TO anon
  USING (true);
