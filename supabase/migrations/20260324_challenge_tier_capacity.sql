-- Add tier capacity config to challenges
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS tier_capacity jsonb DEFAULT '{"grey": null, "blue": null, "black": null}'::jsonb;

-- Add ability tier to challenge_bookings
ALTER TABLE challenge_bookings
  ADD COLUMN IF NOT EXISTS ability_tier text CHECK (ability_tier IN ('grey', 'blue', 'black'));
