-- Run once on PostgreSQL (e.g. Railway) before starting the API with the updated schema.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash text;
