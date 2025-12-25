-- Add first_name and last_name to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Update name column to be a generated column or keep it as full name for backward compatibility
-- For now, we'll keep name as is, but we might want to update it when first/last name changes
