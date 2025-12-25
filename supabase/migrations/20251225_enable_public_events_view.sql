-- Enable RLS on events table (if not already)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/authenticated) to view events that are 'published'
-- This ensures guests can see the event details in their dashboard even if they are not the host.
CREATE POLICY "Allow view access to published events"
ON public.events
FOR SELECT
USING (
  status = 'published' OR 
  auth.uid() = user_id -- Host can always see their own events
);
