-- ============================================
-- ALLOW USER SELF-REGISTRATION
-- Fix for Google OAuth login flow
-- ============================================

-- Allow authenticated users to create their own user record
-- This is needed when a new user logs in with Google OAuth
-- The ensureUserExists() function runs client-side and needs
-- permission to insert the user's own record

CREATE POLICY "Users can self-register"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);
