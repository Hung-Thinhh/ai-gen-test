-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- 1. Allow users to read their own data -> Critical for AuthContext
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
TO authenticated 
USING ( user_id = auth.uid()::text );

-- 2. Allow admins to read all users
CREATE POLICY "Admins can read all users" 
ON users FOR SELECT 
TO authenticated 
USING ( is_admin() );

-- 3. Allow admins to update users
CREATE POLICY "Admins can update users" 
ON users FOR UPDATE 
TO authenticated 
USING ( is_admin() )
WITH CHECK ( is_admin() );
