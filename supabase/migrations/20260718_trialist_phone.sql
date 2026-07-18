-- Capture phone numbers on trial class bookings
alter table trialist_bookings add column if not exists phone text;
