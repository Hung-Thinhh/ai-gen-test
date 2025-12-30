-- ============================================
-- COMPLETE SQL MIGRATION - RUN ALL AT ONCE
-- Fix all credit and user creation issues
-- ============================================

-- ============================================
-- PART 1: Allow User Self-Registration
-- ============================================
DO $$
BEGIN
    -- Check if policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can self-register'
    ) THEN
        CREATE POLICY "Users can self-register"
        ON users FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid()::text = user_id);
        
        RAISE NOTICE 'Created policy: Users can self-register';
    ELSE
        RAISE NOTICE 'Policy already exists: Users can self-register';
    END IF;
END $$;

-- ============================================
-- PART 2: Atomic Credit Reservation Functions
-- ============================================

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS decrement_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS decrement_guest_credits(TEXT, INTEGER);
DROP FUNCTION IF EXISTS reserve_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS reserve_guest_credits(TEXT, INTEGER);

-- Create atomic reservation function for users
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

-- Create atomic reservation function for guests
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

-- Create backward-compatible decrement functions (for old code)
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

-- ============================================
-- PART 3: Grant Permissions
-- ============================================

-- Reserve functions (new)
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION reserve_user_credits(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION reserve_guest_credits(TEXT, INTEGER) TO service_role;

-- Decrement functions (backward compatibility)
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_user_credits(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_guest_credits(TEXT, INTEGER) TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if policy exists
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Users can self-register';

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('reserve_user_credits', 'reserve_guest_credits', 'decrement_user_credits', 'decrement_guest_credits')
ORDER BY routine_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ User self-registration enabled';
    RAISE NOTICE '✅ Atomic credit reservation functions created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '1. Test Google login with new email';
    RAISE NOTICE '2. Test image generation';
    RAISE NOTICE '3. Verify credits are deducted correctly';
    RAISE NOTICE '4. Verify credits NEVER go negative';
END $$;
