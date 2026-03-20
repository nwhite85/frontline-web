ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz;
