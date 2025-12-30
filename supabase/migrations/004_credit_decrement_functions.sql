-- ============================================
-- ATOMIC CREDIT DECREMENT FUNCTIONS
-- Required for credit deduction in image generation
-- ============================================

-- Function for authenticated users
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

-- Function for guest users
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

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO service_role;
