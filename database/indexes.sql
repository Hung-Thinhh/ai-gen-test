-- Database Indexes for Performance Optimization
-- Run this script to create indexes for frequently queried columns

-- Gallery API - generation_history
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_created ON generation_history(user_id, created_at DESC);

-- Dashboard API - payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created ON payment_transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Guest sessions
CREATE INDEX IF NOT EXISTS idx_guest_sessions_id ON guest_sessions(guest_id);

-- Tool custom queries
CREATE INDEX IF NOT EXISTS idx_tool_custom_type ON tool_custom(tool_type_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tool_custom_slug ON tool_custom(slug);

-- Gallery queries
CREATE INDEX IF NOT EXISTS idx_user_gallery_user_id ON user_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_gallery_session ON guest_gallery(guest_session_id);

-- History queries
CREATE INDEX IF NOT EXISTS idx_generation_history_tool ON generation_history(tool_key);

-- Note: GIN index for JSONB columns if needed for complex queries
-- CREATE INDEX IF NOT EXISTS idx_generation_history_output_images ON generation_history USING GIN(output_images);
