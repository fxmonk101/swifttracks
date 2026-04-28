-- Simulate trip: move truck along route from origin to destination
-- Parameters: shipment_id, step (0-100 representing % progress)
-- Returns: new coordinates, distance remaining, estimated seconds to destination

CREATE OR REPLACE FUNCTION public.simulate_trip_step(
  p_shipment_id UUID,
  p_step NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment RECORD;
  v_origin_lat NUMERIC;
  v_origin_lng NUMERIC;
  v_dest_lat NUMERIC;
  v_dest_lng NUMERIC;
  v_new_lat NUMERIC;
  v_new_lng NUMERIC;
  v_progress NUMERIC;
  v_distance_m NUMERIC;
  v_distance_km NUMERIC;
  v_haversine NUMERIC;
  v_lat_diff NUMERIC;
  v_lng_diff NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Fetch shipment and geocoded coordinates
  SELECT s.id, s.tracking_id, s.current_lat, s.current_lng,
         s.sender_city, s.sender_state,
         s.receiver_city, s.receiver_state
  INTO v_shipment
  FROM public.shipments s
  WHERE s.id = p_shipment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  -- Step 1: Get origin coordinates (starting city center)
  -- Using approximate US city coordinates
  -- Los Angeles: 34.0522, -118.2437
  -- Tampa: 27.9506, -82.4572
  -- For MVP, support these two common locations
  IF (v_shipment.sender_city ILIKE '%Los Angeles%' OR v_shipment.sender_city ILIKE '%LA%') THEN
    v_origin_lat := 34.0522;
    v_origin_lng := -118.2437;
  ELSIF (v_shipment.sender_city ILIKE '%Tampa%') THEN
    v_origin_lat := 27.9506;
    v_origin_lng := -82.4572;
  ELSIF (v_shipment.sender_city ILIKE '%New York%' OR v_shipment.sender_city ILIKE '%NYC%') THEN
    v_origin_lat := 40.7128;
    v_origin_lng := -74.0060;
  ELSIF (v_shipment.sender_city ILIKE '%San Francisco%' OR v_shipment.sender_city ILIKE '%SF%') THEN
    v_origin_lat := 37.7749;
    v_origin_lng := -122.4194;
  ELSIF (v_shipment.sender_city ILIKE '%Chicago%') THEN
    v_origin_lat := 41.8781;
    v_origin_lng := -87.6298;
  ELSE
    -- Default to sender coordinates if available, else US center (39.8283, -98.5795)
    v_origin_lat := COALESCE(v_shipment.current_lat, 39.8283);
    v_origin_lng := COALESCE(v_shipment.current_lng, -98.5795);
  END IF;

  -- Step 2: Get destination coordinates (destination city center)
  IF (v_shipment.receiver_city ILIKE '%Los Angeles%' OR v_shipment.receiver_city ILIKE '%LA%') THEN
    v_dest_lat := 34.0522;
    v_dest_lng := -118.2437;
  ELSIF (v_shipment.receiver_city ILIKE '%Tampa%') THEN
    v_dest_lat := 27.9506;
    v_dest_lng := -82.4572;
  ELSIF (v_shipment.receiver_city ILIKE '%New York%' OR v_shipment.receiver_city ILIKE '%NYC%') THEN
    v_dest_lat := 40.7128;
    v_dest_lng := -74.0060;
  ELSIF (v_shipment.receiver_city ILIKE '%San Francisco%' OR v_shipment.receiver_city ILIKE '%SF%') THEN
    v_dest_lat := 37.7749;
    v_dest_lng := -122.4194;
  ELSIF (v_shipment.receiver_city ILIKE '%Chicago%') THEN
    v_dest_lat := 41.8781;
    v_dest_lng := -87.6298;
  ELSE
    -- Default to US center
    v_dest_lat := 39.8283;
    v_dest_lng := -98.5795;
  END IF;

  -- Step 3: Clamp progress to 0-1
  v_progress := GREATEST(0, LEAST(1, p_step / 100.0));

  -- Step 4: Linear interpolation between origin and destination
  v_new_lat := v_origin_lat + (v_dest_lat - v_origin_lat) * v_progress;
  v_new_lng := v_origin_lng + (v_dest_lng - v_origin_lng) * v_progress;

  -- Step 5: Calculate haversine distance between origin and destination (meters)
  v_lat_diff := (v_dest_lat - v_origin_lat) * 0.017453292519943295; -- Convert to radians
  v_lng_diff := (v_dest_lng - v_origin_lng) * 0.017453292519943295;
  v_haversine := 2 * 6371008 * asin(
    sqrt(
      power(sin(v_lat_diff / 2), 2) +
      cos(v_origin_lat * 0.017453292519943295) *
      cos(v_dest_lat * 0.017453292519943295) *
      power(sin(v_lng_diff / 2), 2)
    )
  );

  v_distance_m := v_haversine * (1 - v_progress);
  v_distance_km := v_distance_m / 1000;

  -- Step 6: Update shipment GPS coordinates
  UPDATE public.shipments
  SET current_lat = v_new_lat, current_lng = v_new_lng
  WHERE id = p_shipment_id;

  -- Step 7: Insert location snapshot
  INSERT INTO public.shipment_location_snapshots (shipment_id, lat, lng, source)
  VALUES (p_shipment_id, v_new_lat, v_new_lng, 'simulator');

  -- Step 8: Return response with calculated values
  RETURN jsonb_build_object(
    'success', true,
    'current_lat', v_new_lat,
    'current_lng', v_new_lng,
    'distance_remaining_km', ROUND(v_distance_km::NUMERIC, 2),
    'progress_percent', ROUND(v_progress * 100, 1),
    'origin_lat', v_origin_lat,
    'origin_lng', v_origin_lng,
    'destination_lat', v_dest_lat,
    'destination_lng', v_dest_lng
  );
END;
$$;

-- Helper function to calculate speed and ETA from snapshots
CREATE OR REPLACE FUNCTION public.get_shipment_analytics(
  p_shipment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_snapshot RECORD;
  v_prev_snapshot RECORD;
  v_current_snapshot RECORD;
  v_distance_m NUMERIC;
  v_time_seconds NUMERIC;
  v_speed_mph NUMERIC;
  v_avg_speed_mph NUMERIC;
  v_lat_diff NUMERIC;
  v_lng_diff NUMERIC;
  v_haversine NUMERIC;
BEGIN
  -- Get last 2 snapshots for speed calculation
  SELECT lat, lng, created_at
  INTO v_current_snapshot
  FROM public.shipment_location_snapshots
  WHERE shipment_id = p_shipment_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No location snapshots found');
  END IF;

  -- Get previous snapshot
  SELECT lat, lng, created_at
  INTO v_prev_snapshot
  FROM public.shipment_location_snapshots
  WHERE shipment_id = p_shipment_id
  AND created_at < v_current_snapshot.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Only one snapshot, use default speed estimate (60 mph)
    RETURN jsonb_build_object(
      'success', true,
      'current_speed_mph', 60.0,
      'avg_speed_mph', 60.0,
      'snapshots_count', 1,
      'time_since_last_update_seconds', 0
    );
  END IF;

  -- Calculate distance using haversine formula
  v_lat_diff := (v_current_snapshot.lat - v_prev_snapshot.lat) * 0.017453292519943295;
  v_lng_diff := (v_current_snapshot.lng - v_prev_snapshot.lng) * 0.017453292519943295;
  v_haversine := 2 * 6371008 * asin(
    sqrt(
      power(sin(v_lat_diff / 2), 2) +
      cos(v_prev_snapshot.lat * 0.017453292519943295) *
      cos(v_current_snapshot.lat * 0.017453292519943295) *
      power(sin(v_lng_diff / 2), 2)
    )
  );

  v_distance_m := v_haversine;
  v_time_seconds := EXTRACT(EPOCH FROM (v_current_snapshot.created_at - v_prev_snapshot.created_at));

  -- Avoid division by zero
  IF v_time_seconds <= 0 THEN
    v_speed_mph := 0;
  ELSE
    -- Convert m/s to mph: (distance_m / time_s) * 2.237
    v_speed_mph := (v_distance_m / v_time_seconds) * 2.237;
  END IF;

  -- Average should be around 60 mph for highway, 30 mph for city
  v_avg_speed_mph := CASE
    WHEN v_speed_mph > 75 THEN 65.0  -- Cap at reasonable highway speed
    WHEN v_speed_mph < 5 THEN 60.0   -- If too slow, use default
    ELSE v_speed_mph
  END;

  RETURN jsonb_build_object(
    'success', true,
    'current_speed_mph', ROUND(v_avg_speed_mph::NUMERIC, 1),
    'avg_speed_mph', ROUND(v_avg_speed_mph::NUMERIC, 1),
    'distance_since_last_m', ROUND(v_distance_m::NUMERIC, 0),
    'time_since_last_seconds', v_time_seconds,
    'snapshots_count', (SELECT COUNT(*) FROM public.shipment_location_snapshots WHERE shipment_id = p_shipment_id)
  );
END;
$$;

-- Trigger to send delivery notifications (for future email integration)
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'status_change', 'delivery_attempt', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue REPLICA IDENTITY FULL;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification queue"
  ON public.notification_queue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sent notifications"
  ON public.notification_queue FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to queue delivery notifications
CREATE OR REPLACE FUNCTION public.queue_delivery_notification(
  p_shipment_id UUID,
  p_event_type TEXT DEFAULT 'status_change'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment RECORD;
  v_subject TEXT;
  v_body TEXT;
  v_recipient_email TEXT;
  v_status_label TEXT;
BEGIN
  -- Fetch shipment info
  SELECT s.id, s.tracking_id, s.status, s.receiver_name, s.receiver_city,
         s.receiver_state, s.estimated_delivery_date,
         (SELECT description FROM public.shipment_events 
          WHERE shipment_id = s.id 
          ORDER BY created_at DESC LIMIT 1) as last_description
  INTO v_shipment
  FROM public.shipments s
  WHERE s.id = p_shipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  -- For now, queue to receiver email (in production, would be from form submission)
  -- Using a placeholder domain - update with real email if available
  v_recipient_email := LOWER(v_shipment.receiver_name) || '@delivery.notification';

  -- Generate status label
  v_status_label := CASE v_shipment.status
    WHEN 'LABEL_CREATED' THEN 'Label Created'
    WHEN 'PICKED_UP' THEN 'Picked Up'
    WHEN 'IN_TRANSIT' THEN 'In Transit'
    WHEN 'AT_FACILITY' THEN 'At Facility'
    WHEN 'OUT_FOR_DELIVERY' THEN 'Out for Delivery'
    WHEN 'DELIVERED' THEN 'Delivered'
    WHEN 'DELIVERY_ATTEMPTED' THEN 'Delivery Attempted'
    WHEN 'EXCEPTION' THEN 'Exception/On Hold'
    WHEN 'RETURNED' THEN 'Returned'
    ELSE v_shipment.status
  END;

  -- Build email content
  v_subject := 'Your package ' || v_shipment.tracking_id || ' is ' || LOWER(v_status_label);
  v_body := 'Hello ' || v_shipment.receiver_name || ',' || E'\n\n' ||
    'Your shipment ' || v_shipment.tracking_id || ' is now ' || LOWER(v_status_label) || '.' || E'\n\n' ||
    'Delivery to: ' || v_shipment.receiver_city || ', ' || v_shipment.receiver_state || E'\n' ||
    'Estimated Delivery: ' || COALESCE(v_shipment.estimated_delivery_date::text, 'TBD') || E'\n\n' ||
    'Track your package at: https://swifttracks.com/track/' || v_shipment.tracking_id || E'\n\n' ||
    'SwiftTrack Team';

  -- Insert into notification queue
  INSERT INTO public.notification_queue (
    shipment_id, event_type, recipient_email, subject, body
  ) VALUES (
    p_shipment_id, p_event_type, v_recipient_email, v_subject, v_body
  );

  RETURN jsonb_build_object(
    'success', true,
    'notification_queued', true,
    'recipient', v_recipient_email,
    'subject', v_subject
  );
END;
$$;

-- Trigger function to auto-queue notifications on status changes
CREATE OR REPLACE FUNCTION public.on_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.queue_delivery_notification(NEW.id, 'status_change');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS shipment_status_change_trigger ON public.shipments;
CREATE TRIGGER shipment_status_change_trigger
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.on_shipment_status_change();

-- Role assignment helper (for admin account setup)
CREATE OR REPLACE FUNCTION public.set_admin_role(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only superadmin can set roles (for now, allow from authenticated users, improve later)
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;

  -- Update user metadata to mark as admin
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
  )
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Admin role assigned');
END;
$$;
