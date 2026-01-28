-- Enable RLS on organizations check (idempotent)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own organization
CREATE POLICY "Allow users to view their organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users (instructors/admins) to update their own organization
CREATE POLICY "Allow users to update their organization"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('instructor', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
    AND role IN ('instructor', 'admin')
  )
);

-- Allow new organization creation if needed (optional, handled by triggers usually)
-- But ensuring they can read/update it is critical.
