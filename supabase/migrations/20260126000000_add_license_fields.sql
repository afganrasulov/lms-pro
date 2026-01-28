-- Add license fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS license_key TEXT,
ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'inactive';

-- Add RLS policy to allow users to update their own license info
CREATE POLICY "Users can update their own license info" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
