-- Force RLS policy fix for packages table

-- 1. Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access" ON packages;
DROP POLICY IF EXISTS "Allow service role full access" ON packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;

-- 3. Re-create correct policies
-- Public Read (Anonymous + Authenticated)
CREATE POLICY "Allow public read access" 
ON packages 
FOR SELECT 
TO public 
USING (true);

-- Service Role (Full Access)
CREATE POLICY "Allow service role full access" 
ON packages 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 4. Verify (Optional, just ensuring data exists)
-- SELECT count(*) FROM packages;
