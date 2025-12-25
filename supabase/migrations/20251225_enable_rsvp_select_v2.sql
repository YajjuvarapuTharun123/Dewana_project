-- Enable RLS on rsvps table if not already enabled
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to handle re-runs or updates)
DROP POLICY IF EXISTS "Allow users to view their own RSVPs" ON public.rsvps;

-- Policy to allow authenticated users to view RSVPs that match their email (Case Insensitive)
CREATE POLICY "Allow users to view their own RSVPs"
ON public.rsvps
FOR SELECT
TO authenticated
USING (
  lower(guest_email) = lower(auth.jwt() ->> 'email')
);
