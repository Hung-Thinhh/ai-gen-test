-- ============================================
-- DATABASE HELPER FUNCTIONS
-- Run AFTER all tables and policies
-- ============================================

-- ============================================
-- 1. Deduct Credits (with validation)
-- ============================================

CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id VARCHAR(50),
    p_amount INTEGER,
    p_tool_id INTEGER DEFAULT NULL,
    p_history_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get current credits with row lock
    SELECT current_credits INTO v_current_credits
    FROM users
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check sufficient credits
    IF v_current_credits < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_credits', v_current_credits,
            'required', p_amount
        );
    END IF;
    
    -- Calculate new balance
    v_new_credits := v_current_credits - p_amount;
    
    -- Update user credits
    UPDATE users
    SET current_credits = v_new_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        type,
        credits_delta,
        credits_before,
        credits_after,
        tool_id,
        history_id
    ) VALUES (
        p_user_id,
        'usage',
        -p_amount,
        v_current_credits,
        v_new_credits,
        p_tool_id,
        p_history_id
    ) RETURNING transaction_id INTO v_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'credits_before', v_current_credits,
        'credits_after', v_new_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Add Credits (topup, bonus, refund)
-- ============================================

CREATE OR REPLACE FUNCTION add_credits(
    p_user_id VARCHAR(50),
    p_amount INTEGER,
    p_type VARCHAR(20) DEFAULT 'bonus',
    p_amount_vnd NUMERIC DEFAULT NULL,
    p_payment_ref VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get current credits
    SELECT current_credits INTO v_current_credits
    FROM users
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    v_new_credits := v_current_credits + p_amount;
    
    -- Update user
    UPDATE users
    SET current_credits = v_new_credits,
        total_spent_vnd = CASE 
            WHEN p_type = 'topup' THEN total_spent_vnd + COALESCE(p_amount_vnd, 0)
            ELSE total_spent_vnd
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create transaction
    INSERT INTO transactions (
        user_id,
        type,
        credits_delta,
        credits_before,
        credits_after,
        amount_vnd,
        payment_gateway_ref,
        payment_status
    ) VALUES (
        p_user_id,
        p_type,
        p_amount,
        v_current_credits,
        v_new_credits,
        p_amount_vnd,
        p_payment_ref,
        CASE WHEN p_type = 'topup' THEN 'success' ELSE NULL END
    ) RETURNING transaction_id INTO v_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'credits_after', v_new_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Get or Create Guest User
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_guest_user(
    p_ip_address INET,
    p_device_fingerprint VARCHAR DEFAULT NULL
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_user_id VARCHAR(50);
BEGIN
    v_user_id := 'G_' || host(p_ip_address);
    
    -- Try to insert, ignore if exists
    INSERT INTO users (
        user_id,
        user_type,
        ip_address,
        device_fingerprint,
        current_credits,
        created_at
    ) VALUES (
        v_user_id,
        'guest',
        p_ip_address,
        p_device_fingerprint,
        10, -- Free tier credits
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Generate 9-char User ID for Registered Users
-- ============================================

CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS VARCHAR(9) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(9) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..9 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Auto-update updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at
    BEFORE UPDATE ON tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configs_updated_at
    BEFORE UPDATE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
