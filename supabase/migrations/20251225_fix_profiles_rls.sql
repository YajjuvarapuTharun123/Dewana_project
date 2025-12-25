-- Fix 1: Ensure columns exist (in case previous migration wasn't run)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Fix 2: Enable RLS Policy for INSERT
-- By default, profiles might only have SELECT/UPDATE policies.
-- We need to allow users to INSERT their own profile if it doesn't exist.

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = id );

-- Fix 3: Ensure UPDATE policy allows these new columns
-- (Usually UPDATE policies are just "auth.uid() = id" which covers all columns, but good to double check)
-- Re-creating the update policy to be safe
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id );
