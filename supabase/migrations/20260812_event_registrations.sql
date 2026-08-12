-- Public registrations for social events (Family Fun Day, Splashdown, Bowling, etc).
-- Separate from event_bookings because these are open to the public — partners,
-- kids, friends — not just existing clients with a user_profiles row.

CREATE TABLE IF NOT EXISTS event_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug        text NOT NULL,
  name              text NOT NULL,
  email             text NOT NULL,
  phone             text,
  adults            integer NOT NULL DEFAULT 1 CHECK (adults >= 1 AND adults <= 20),
  children          integer NOT NULL DEFAULT 0 CHECK (children >= 0 AND children <= 20),
  child_ages        text,
  waiver_accepted   boolean NOT NULL DEFAULT false,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_registrations_slug_idx
  ON event_registrations (event_slug, created_at DESC);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Public sign-up form inserts via the anon key. Reads stay closed: the API
-- route lists registrations with the service role after checking the session.
-- The waiver only applies to people bringing children, so adults coming on
-- their own can register without it.
DROP POLICY IF EXISTS "Public can register for events" ON event_registrations;
CREATE POLICY "Public can register for events"
  ON event_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (children = 0 OR waiver_accepted = true);
