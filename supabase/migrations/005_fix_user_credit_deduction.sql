-- ============================================
-- FIX USER CREDIT DEDUCTION
-- Guest credits work, but user credits don't
-- ============================================

-- Drop existing function if it exists (in case it's broken)
DROP FUNCTION IF EXISTS decrement_user_credits(UUID, INTEGER);

-- Recreate the function for authenticated users
CREATE OR REPLACE FUNCTION decrement_user_credits(
    p_user_id UUID,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Log for debugging
    RAISE NOTICE 'Decrementing credits for user: %, amount: %', p_user_id, p_amount;
    
    -- Update credits
    UPDATE users 
    SET current_credits = current_credits - p_amount 
    WHERE user_id = p_user_id;
    
    -- Check if update happened
    IF NOT FOUND THEN
        RAISE NOTICE 'User not found: %', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to ALL roles (very important!)
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO postgres;

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'decrement_user_credits';
