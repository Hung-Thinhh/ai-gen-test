-- Enable RLS on users table (just in case)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- 1. Allow users to read their own data
-- Note: users.user_id is TEXT, auth.uid() is UUID. matching with ::text
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
TO authenticated 
USING ( user_id = auth.uid()::text );

-- 2. Allow admins to read all users (for Admin Panel > Users)
-- We can use the is_admin() function we created earlier!
CREATE POLICY "Admins can read all users" 
ON users FOR SELECT 
TO authenticated 
USING ( is_admin() );

-- 3. Allow admins to update users (optional, for assigning roles etc)
CREATE POLICY "Admins can update users" 
ON packages FOR UPDATE 
TO authenticated 
USING ( is_admin() )
WITH CHECK ( is_admin() );
