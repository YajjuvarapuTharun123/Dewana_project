-- 1. Create the increment_view_count RPC function (Fixes 404 error)
CREATE OR REPLACE FUNCTION public.increment_view_count(event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.events
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = event_id;
END;
$$;

-- 2. Ensure RLS is enabled on RSVPs
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- 3. Re-apply the case-insensitive select policy (Just to be safe)
DROP POLICY IF EXISTS "Allow users to view their own RSVPs" ON public.rsvps;

CREATE POLICY "Allow users to view their own RSVPs"
ON public.rsvps
FOR SELECT
TO authenticated
USING (
  lower(guest_email) = lower(auth.jwt() ->> 'email')
);
