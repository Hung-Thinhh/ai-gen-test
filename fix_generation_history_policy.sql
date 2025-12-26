-- Fix Generation History RLS Policy to Allow Guest Inserts
-- Run this in Supabase SQL Editor

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users insert own history" ON generation_history;

-- 2. Create new policy that allows both authenticated users AND anonymous (guests)
CREATE POLICY "Users and guests insert history"
ON generation_history FOR INSERT
WITH CHECK (
    -- Allow if authenticated user matches user_id
    (auth.uid()::text = user_id)
    OR
    -- Allow if anonymous user (guest) - they can insert with any user_id (usually NULL or guest_id)
    (auth.uid() IS NULL)
);

-- Verify the policy is active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'generation_history';
