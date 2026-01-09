-- Check user credits
SELECT user_id, email, current_credits FROM users WHERE user_id = 'ebf2d43f-3065-498b-b9e8-a27e07748b25';

-- Check if RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_schema = 'public'
AND routine_name IN ('decrement_user_credits', 'decrement_guest_credits');
