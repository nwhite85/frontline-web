-- Per-client opt-in for automated monthly Stripe payment receipts. Off by default.
alter table user_profiles add column if not exists monthly_receipts_enabled boolean not null default false;
