-- ============================================
-- CLEAN AND RECREATE RPC FUNCTIONS
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Step 1: DROP ALL VERSIONS of the functions
DROP FUNCTION IF EXISTS decrement_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS decrement_user_credits(TEXT, INTEGER);
DROP FUNCTION IF EXISTS decrement_guest_credits(TEXT, INTEGER);

-- Step 2: CREATE with correct signature matching the code
-- The code passes userId as TEXT, but we need to handle UUID column
CREATE OR REPLACE FUNCTION decrement_user_credits(
    p_user_id TEXT,  -- Accept TEXT from code
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Cast TEXT to UUID when comparing
    UPDATE users 
    SET current_credits = GREATEST(current_credits - p_amount, 0)
    WHERE user_id::text = p_user_id;
    
    -- Alternative: Cast parameter to UUID
    -- WHERE user_id = p_user_id::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_guest_credits(
    p_guest_id TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE guest_sessions 
    SET credits = GREATEST(credits - p_amount, 0)
    WHERE guest_id = p_guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions to service_role (used by supabaseAdmin)
GRANT EXECUTE ON FUNCTION decrement_user_credits(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO service_role;

-- Step 4: Verify
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('decrement_user_credits', 'decrement_guest_credits')
ORDER BY p.proname;
