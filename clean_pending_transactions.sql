-- Xóa các giao dịch pending (có transaction_id = NULL)
-- Chỉ giữ lại các giao dịch completed
DELETE FROM payment_transactions WHERE transaction_id IS NULL;

-- Kiểm tra kết quả
SELECT status, COUNT(*) as count 
FROM payment_transactions 
GROUP BY status;
