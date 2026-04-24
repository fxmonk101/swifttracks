-- Location history for tracking map polylines + extended GPS RPC with source.
-- submit_driver_location: drivers (or admins) can push coordinates; tighten assigned_driver checks later.

CREATE TABLE public.shipment_location_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'admin_manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_location_snapshots_shipment_created
  ON public.shipment_location_snapshots (shipment_id, created_at ASC);

ALTER TABLE public.shipment_location_snapshots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_location_snapshots;

ALTER TABLE public.shipment_location_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipment location snapshots"
  ON public.shipment_location_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert shipment location snapshots"
  ON public.shipment_location_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Replace GPS RPC: optional source label + history row when coordinates change
CREATE OR REPLACE FUNCTION public.update_shipment_location(
  p_shipment_id UUID,
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_source TEXT DEFAULT 'admin_manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_lat NUMERIC;
  v_old_lng NUMERIC;
  v_src TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT s.current_lat, s.current_lng
  INTO v_old_lat, v_old_lng
  FROM public.shipments s
  WHERE s.id = p_shipment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  v_src := COALESCE(NULLIF(trim(p_source), ''), 'admin_manual');

  UPDATE public.shipments
  SET current_lat = p_lat, current_lng = p_lng
  WHERE id = p_shipment_id;

  IF (v_old_lat IS DISTINCT FROM p_lat) OR (v_old_lng IS DISTINCT FROM p_lng) THEN
    INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source)
    VALUES (p_shipment_id, p_lat, p_lng, v_src);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Driver-facing GPS ping (stub: any user with driver role may update any shipment;
-- replace with assigned_driver = profile id when driver accounts are linked.)
CREATE OR REPLACE FUNCTION public.submit_driver_location(
  p_shipment_id UUID,
  p_lat NUMERIC,
  p_lng NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_lat NUMERIC;
  v_old_lng NUMERIC;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'driver')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT s.current_lat, s.current_lng
  INTO v_old_lat, v_old_lng
  FROM public.shipments s
  WHERE s.id = p_shipment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  UPDATE public.shipments
  SET current_lat = p_lat, current_lng = p_lng
  WHERE id = p_shipment_id;

  IF (v_old_lat IS DISTINCT FROM p_lat) OR (v_old_lng IS DISTINCT FROM p_lng) THEN
    INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source)
    VALUES (p_shipment_id, p_lat, p_lng, 'driver');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION public.submit_driver_location IS
  'Stub for driver devices: call with authenticated driver (or admin). Link drivers to shipments via assigned_driver before production.';

GRANT EXECUTE ON FUNCTION public.submit_driver_location(UUID, NUMERIC, NUMERIC) TO authenticated;
