
-- Shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL DEFAULT 'STANDARD',
  status TEXT NOT NULL DEFAULT 'LABEL_CREATED',
  sender_name TEXT NOT NULL,
  sender_street TEXT,
  sender_city TEXT NOT NULL,
  sender_state TEXT NOT NULL,
  sender_zip TEXT,
  sender_country TEXT DEFAULT 'US',
  receiver_name TEXT NOT NULL,
  receiver_street TEXT,
  receiver_city TEXT NOT NULL,
  receiver_state TEXT NOT NULL,
  receiver_zip TEXT,
  receiver_country TEXT DEFAULT 'US',
  weight NUMERIC DEFAULT 0,
  dimensions_length NUMERIC DEFAULT 0,
  dimensions_width NUMERIC DEFAULT 0,
  dimensions_height NUMERIC DEFAULT 0,
  requires_signature BOOLEAN DEFAULT false,
  estimated_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  current_lat NUMERIC,
  current_lng NUMERIC,
  assigned_driver TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Anyone can view shipments (public tracking)
CREATE POLICY "Anyone can view shipments"
  ON public.shipments FOR SELECT
  USING (true);

-- Admins can insert shipments
CREATE POLICY "Admins can insert shipments"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update shipments
CREATE POLICY "Admins can update shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete shipments
CREATE POLICY "Admins can delete shipments"
  ON public.shipments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Shipment events table
CREATE TABLE public.shipment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipment events"
  ON public.shipment_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert shipment events"
  ON public.shipment_events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on shipments
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update shipment status + create event in one call
CREATE OR REPLACE FUNCTION public.update_shipment_status(
  p_shipment_id UUID,
  p_new_status TEXT,
  p_description TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update shipment status
  UPDATE public.shipments
  SET status = p_new_status,
      actual_delivery_date = CASE WHEN p_new_status = 'DELIVERED' THEN now() ELSE actual_delivery_date END
  WHERE id = p_shipment_id;

  -- Create event
  INSERT INTO public.shipment_events (shipment_id, status, description, location)
  VALUES (p_shipment_id, p_new_status, COALESCE(p_description, p_new_status), p_location);

  RETURN jsonb_build_object('success', true);
END;
$$;
