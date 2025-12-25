-- CHECK EVENT DETAILS AND POLICIES
-- 1. Get the ID of the event and see if it exists
SELECT id, event_name, slug, user_id FROM public.events WHERE slug = 'tharun-birthday-mjl31ijx';

-- 2. Check policies on specific tables (Informational, seeing if RLS is enabled)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('events', 'rsvps');

-- 3. Check specific RSVPs for the user and that event
SELECT * FROM public.rsvps 
WHERE guest_email ILIKE 'bshd3875@gmail.com' 
AND event_id = (SELECT id FROM public.events WHERE slug = 'tharun-birthday-mjl31ijx');
