
-- 1. Drop old 3-arg version, recreate with optional p_source
DROP FUNCTION IF EXISTS public.update_shipment_location(uuid, numeric, numeric);

-- 2. GPS history table
CREATE TABLE IF NOT EXISTS public.shipment_location_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  source text DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_shipment_time
  ON public.shipment_location_snapshots (shipment_id, created_at);

ALTER TABLE public.shipment_location_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location snapshots"
  ON public.shipment_location_snapshots FOR SELECT USING (true);

CREATE POLICY "Admins can insert location snapshots"
  ON public.shipment_location_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.shipment_location_snapshots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_location_snapshots;

-- 3. New update_shipment_location with source + auto-snapshot
CREATE OR REPLACE FUNCTION public.update_shipment_location(
  p_shipment_id uuid,
  p_lat numeric,
  p_lng numeric,
  p_source text DEFAULT 'admin_manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE public.shipments
  SET current_lat = p_lat,
      current_lng = p_lng,
      updated_at = now()
  WHERE id = p_shipment_id;

  INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source)
  VALUES (p_shipment_id, p_lat, p_lng, COALESCE(p_source, 'unknown'));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Analytics: current speed (mph) from last 2 snapshots
CREATE OR REPLACE FUNCTION public.get_shipment_analytics(p_shipment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev RECORD;
  v_last RECORD;
  v_dist_m numeric;
  v_secs numeric;
  v_mph numeric := NULL;
BEGIN
  SELECT lat, lng, created_at INTO v_last
    FROM public.shipment_location_snapshots
    WHERE shipment_id = p_shipment_id
    ORDER BY created_at DESC LIMIT 1;

  SELECT lat, lng, created_at INTO v_prev
    FROM public.shipment_location_snapshots
    WHERE shipment_id = p_shipment_id
    ORDER BY created_at DESC OFFSET 1 LIMIT 1;

  IF v_last IS NOT NULL AND v_prev IS NOT NULL THEN
    -- Haversine in meters
    v_dist_m := 2 * 6371008 * asin(
      sqrt(
        sin(radians((v_last.lat - v_prev.lat)/2))^2 +
        cos(radians(v_prev.lat)) * cos(radians(v_last.lat)) *
        sin(radians((v_last.lng - v_prev.lng)/2))^2
      )
    );
    v_secs := GREATEST(EXTRACT(EPOCH FROM (v_last.created_at - v_prev.created_at)), 1);
    -- meters/sec -> mph
    v_mph := (v_dist_m / v_secs) * 2.23694;
  END IF;

  RETURN jsonb_build_object(
    'current_speed_mph', v_mph,
    'snapshot_count', (SELECT COUNT(*) FROM public.shipment_location_snapshots WHERE shipment_id = p_shipment_id)
  );
END;
$$;

-- 5. Simulator: linear interpolation origin->destination
CREATE OR REPLACE FUNCTION public.simulate_trip_step(
  p_shipment_id uuid,
  p_step integer,
  p_origin_lat numeric,
  p_origin_lng numeric,
  p_dest_lat numeric,
  p_dest_lng numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t numeric;
  new_lat numeric;
  new_lng numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  t := LEAST(GREATEST(p_step, 0), 100) / 100.0;
  new_lat := p_origin_lat + (p_dest_lat - p_origin_lat) * t;
  new_lng := p_origin_lng + (p_dest_lng - p_origin_lng) * t;

  UPDATE public.shipments
  SET current_lat = new_lat,
      current_lng = new_lng,
      updated_at = now()
  WHERE id = p_shipment_id;

  INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source)
  VALUES (p_shipment_id, new_lat, new_lng, 'simulator');

  RETURN jsonb_build_object('success', true, 'lat', new_lat, 'lng', new_lng, 'progress', t);
END;
$$;

-- 6. Backfill: snapshot any current GPS so the test shipment has a starting trail point if set
INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source, created_at)
SELECT id, current_lat, current_lng, 'backfill', updated_at
FROM public.shipments
WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.shipment_location_snapshots s WHERE s.shipment_id = shipments.id
  );

-- 7. Fix Los angele typo in test data
UPDATE public.shipments SET sender_city = 'Los Angeles' WHERE sender_city = 'Los angele';
