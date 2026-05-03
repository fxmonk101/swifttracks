
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS sender_phone text,
  ADD COLUMN IF NOT EXISTS receiver_email text,
  ADD COLUMN IF NOT EXISTS receiver_phone text,
  ADD COLUMN IF NOT EXISTS pickup_date timestamptz,
  ADD COLUMN IF NOT EXISTS package_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS packages_meta jsonb;
