
-- Function to decrement user credits
CREATE OR REPLACE FUNCTION decrement_user_credits(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET current_credits = current_credits - p_amount
  WHERE user_id = p_user_id AND current_credits >= p_amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql;
