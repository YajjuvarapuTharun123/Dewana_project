-- Update RLS policies for event-covers storage bucket
-- Fix the INSERT policy to not check owner (owner is set automatically by Supabase)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated User Upload" ON storage.objects;

-- Create new INSERT policy without owner check (Supabase sets owner automatically)
CREATE POLICY "Authenticated User Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'event-covers' );

-- Ensure the bucket exists and is public (for SELECT)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;
