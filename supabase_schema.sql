-- 1. Add current_credits column to guest_sessions table
ALTER TABLE guest_sessions 
ADD COLUMN IF NOT EXISTS current_credits INTEGER DEFAULT 10;

-- 2. Add function to safely deduct credits (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_guest_credits(guest_id_param TEXT, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_credits INTEGER;
BEGIN
    UPDATE guest_sessions
    SET current_credits = current_credits - amount
    WHERE guest_id = guest_id_param AND current_credits >= amount
    RETURNING current_credits INTO new_credits;
    
    RETURN new_credits;
END;
$$ LANGUAGE plpgsql;

-- 3. Add function to help with user creation from guest
-- Ideally, Supabase JS client handles the logic, but a function can ensure atomicity if needed.
-- For now, we will handle the logic in the application layer (AuthContext) as planned.
