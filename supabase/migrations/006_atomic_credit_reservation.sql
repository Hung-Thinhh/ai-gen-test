-- ============================================
-- FIX NEGATIVE CREDITS RACE CONDITION
-- Prevent credits from going negative when generating multiple images
-- ============================================

-- Drop old functions
DROP FUNCTION IF EXISTS decrement_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS decrement_guest_credits(TEXT, INTEGER);

-- ============================================
-- NEW: Atomic credit reservation for users
-- Returns TRUE if credits were reserved, FALSE if insufficient
-- ============================================
CREATE OR REPLACE FUNCTION reserve_user_credits(
    p_user_id UUID,
    p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits INTEGER;
    v_updated_rows INTEGER;
BEGIN
    -- Try to decrement credits ONLY if sufficient (atomic operation)
    UPDATE users 
    SET current_credits = current_credits - p_amount 
    WHERE user_id = p_user_id 
      AND current_credits >= p_amount  -- CRITICAL: Only update if enough credits
    RETURNING current_credits INTO v_current_credits;
    
    -- Check if update happened
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    IF v_updated_rows > 0 THEN
        RAISE NOTICE 'Reserved % credits for user %. New balance: %', p_amount, p_user_id, v_current_credits;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Insufficient credits for user %. Requested: %', p_user_id, p_amount;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NEW: Atomic credit reservation for guests
-- Returns TRUE if credits were reserved, FALSE if insufficient
-- ============================================
CREATE OR REPLACE FUNCTION reserve_guest_credits(
    p_guest_id TEXT,
    p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits INTEGER;
    v_updated_rows INTEGER;
BEGIN
    -- Try to decrement credits ONLY if sufficient (atomic operation)
    UPDATE guest_sessions 
    SET credits = credits - p_amount 
    WHERE guest_id = p_guest_id 
      AND credits >= p_amount  -- CRITICAL: Only update if enough credits
    RETURNING credits INTO v_current_credits;
    
    -- Check if update happened
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    IF v_updated_rows > 0 THEN
        RAISE NOTICE 'Reserved % credits for guest %. New balance: %', p_amount, p_guest_id, v_current_credits;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Insufficient credits for guest %. Requested: %', p_guest_id, p_amount;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO service_role;

-- ============================================
-- KEEP old decrement functions for backward compatibility
-- But they should NOT be used for new code
-- ============================================
CREATE OR REPLACE FUNCTION decrement_user_credits(
    p_user_id UUID,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET current_credits = current_credits - p_amount 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

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

GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO service_role;
