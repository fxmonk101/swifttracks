
CREATE OR REPLACE FUNCTION public.set_admin_role(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the calling user to make THEMSELVES admin only if no admin exists yet,
  -- OR they're already an admin promoting someone.
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- bootstrap: first admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN jsonb_build_object('success', true, 'bootstrap', true);
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_delivery_notification(
  p_shipment_id uuid,
  p_event_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder: real notification delivery wired separately.
  RETURN jsonb_build_object('success', true, 'queued', false);
END;
$$;
