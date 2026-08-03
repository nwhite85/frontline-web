-- Client consent to use their photos/videos on social media and marketing.
-- Captured as an optional tickbox on website signup. Off by default (no consent).
alter table user_profiles add column if not exists photo_consent boolean not null default false;
