-- Create a secure function to handle anonymous RSVPs
-- This functions allows guests to insert an RSVP and get the ID back, 
-- bypassing the RLS restriction that prevents them from SELECTing the row they just inserted.

CREATE OR REPLACE FUNCTION public.create_guest_rsvp(
  p_event_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_status TEXT,
  p_num_guests INTEGER,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (postgres), bypassing RLS
SET search_path = public
AS $$
DECLARE
  v_rsvp_id UUID;
  v_event_status TEXT;
BEGIN
  -- 1. Validate that the event exists and is published
  SELECT status INTO v_event_status
  FROM public.events
  WHERE id = p_event_id;

  IF v_event_status IS NULL OR v_event_status != 'published' THEN
    RAISE EXCEPTION 'Event is not available for RSVP';
  END IF;

  -- 2. Insert the RSVP
  INSERT INTO public.rsvps (
    event_id,
    guest_name,
    guest_email,
    guest_phone,
    status,
    num_guests,
    message
  )
  VALUES (
    p_event_id,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_status,
    p_num_guests,
    p_message
  )
  RETURNING id INTO v_rsvp_id;

  -- 3. Return the ID so the frontend can generate the specific QR code
  RETURN v_rsvp_id;
END;
$$;
