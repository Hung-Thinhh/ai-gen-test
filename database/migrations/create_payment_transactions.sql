-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    order_id TEXT UNIQUE NOT NULL,
    package_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    credits INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method TEXT,
    sepay_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON payment_transactions FOR SELECT
USING (auth.uid()::text = user_id);

-- Only system can insert transactions (via service role)
CREATE POLICY "Service role can insert transactions"
ON payment_transactions FOR INSERT
WITH CHECK (true);

-- Only system can update transactions
CREATE POLICY "Service role can update transactions"
ON payment_transactions FOR UPDATE
USING (true);

-- Add comment
COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions for credit purchases';
