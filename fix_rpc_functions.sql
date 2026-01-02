-- ============================================
-- FIX RPC CREDIT DECREMENT FUNCTIONS
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Drop old functions
DROP FUNCTION IF EXISTS decrement_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS decrement_guest_credits(TEXT, INTEGER);

-- Recreate with proper type handling
CREATE OR REPLACE FUNCTION decrement_user_credits(
    p_user_id TEXT,  -- Changed from UUID to TEXT
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET current_credits = current_credits - p_amount 
    WHERE user_id = p_user_id::uuid;  -- Cast TEXT to UUID
END;
$$ LANGUAGE plpgsql;

-- Function for guest users (no change needed)
CREATE OR REPLACE FUNCTION decrement_guest_credits(
    p_guest_id TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE guest_sessions 
    SET credits = credits - p_amount 
    WHERE guest_id = p_guest_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION decrement_user_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_user_credits(TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO service_role;

-- Verify
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name IN ('decrement_user_credits', 'decrement_guest_credits')
ORDER BY routine_name;
