ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_checkpoint boolean NOT NULL DEFAULT false;
