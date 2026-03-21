ALTER TABLE membership_plans
  ADD COLUMN IF NOT EXISTS is_comp boolean DEFAULT false;
