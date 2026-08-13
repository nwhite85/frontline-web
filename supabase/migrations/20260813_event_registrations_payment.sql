-- Paid events (Splashdown at £29 a head) record what was taken alongside the
-- free sign-ups already in this table. Free events simply leave these null.
-- Food is laid on at the Splashdown, so the diet flags drive the catering count.

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS amount_paid        numeric(10,2),
  ADD COLUMN IF NOT EXISTS payment_status     text,
  ADD COLUMN IF NOT EXISTS stripe_session_id  text,
  ADD COLUMN IF NOT EXISTS is_vegetarian      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegan           boolean NOT NULL DEFAULT false;

-- The webhook and the success page can both land the same booking. Making the
-- session id unique lets whichever arrives second upsert harmlessly instead of
-- writing a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_stripe_session_idx
  ON event_registrations (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
