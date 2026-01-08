-- 1. Helper Function: is_admin()
-- Using SECURITY DEFINER to ensure we can read users table regardless of its RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  -- Cast auth.uid() to text to match users.user_id type
  SELECT role INTO current_role
  FROM users
  WHERE user_id = auth.uid()::text;
  
  RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up old policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON packages;
DROP POLICY IF EXISTS "Allow service role full access" ON packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;
DROP POLICY IF EXISTS "Allow admins to update packages" ON packages;
DROP POLICY IF EXISTS "Admin Update Access" ON packages;
DROP POLICY IF EXISTS "Admin Insert Access" ON packages;
DROP POLICY IF EXISTS "Admin Delete Access" ON packages;
DROP POLICY IF EXISTS "Public Read Access" ON packages;
DROP POLICY IF EXISTS "Service Role Full Access" ON packages;

-- 3. Create Simplified Policies using is_admin()

-- Read: Public
CREATE POLICY "Public Read" 
ON packages FOR SELECT 
TO public 
USING (true);

-- Update: Admin Only
CREATE POLICY "Admin Update" 
ON packages FOR UPDATE 
TO authenticated 
USING ( is_admin() )
WITH CHECK ( is_admin() );

-- Insert: Admin Only
CREATE POLICY "Admin Insert" 
ON packages FOR INSERT 
TO authenticated 
WITH CHECK ( is_admin() );

-- Delete: Admin Only
CREATE POLICY "Admin Delete" 
ON packages FOR DELETE 
TO authenticated 
USING ( is_admin() );

-- 4. Reload permissions
NOTIFY pgrst, 'reload config';
