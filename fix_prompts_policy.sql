-- First, disable RLS to reset state (optional, but good for debugging)
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON prompts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON prompts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON prompts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON prompts;

-- Re-enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create a SINGLE permissive policy for ALL users (Public)
-- This is useful for debugging to ensure RLS isn't the blocker due to auth state.
CREATE POLICY "Allow Full Access" 
ON prompts
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- FIX FOR CATEGORIES TABLE (If applicable)
-- ==========================================

-- Disable/Enable RLS for reset
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop potential conflicting policies on categories
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Allow Full Access" ON categories;

-- Create Permissive Policy for Categories
CREATE POLICY "Allow Full Access Categories" 
ON categories
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);