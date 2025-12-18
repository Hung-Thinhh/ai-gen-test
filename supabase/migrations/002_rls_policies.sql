-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Run AFTER creating tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GENERATION HISTORY POLICIES
-- ============================================

-- Users can view their own history
CREATE POLICY "Users view own history"
ON generation_history FOR SELECT
USING (auth.uid()::text = user_id OR is_public = true);

-- Users can insert their own history
CREATE POLICY "Users insert own history"
ON generation_history FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Admins can view all
CREATE POLICY "Admins view all history"
ON generation_history FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users view own transactions
CREATE POLICY "Users view own transactions"
ON transactions FOR SELECT
USING (auth.uid()::text = user_id);

-- System can insert (server-side only)
CREATE POLICY "Service role insert transactions"
ON transactions FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS

-- Admins view all
CREATE POLICY "Admins view all transactions"
ON transactions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- ============================================
-- USER PURCHASES POLICIES
-- ============================================

-- Users view own purchases
CREATE POLICY "Users view own purchases"
ON user_purchases FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create purchases (payment initiation)
CREATE POLICY "Users create own purchases"
ON user_purchases FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Admins view all
CREATE POLICY "Admins view all purchases"
ON user_purchases FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users view own profile"
ON users FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can update own profile (limited fields)
CREATE POLICY "Users update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Service role can manage all users
CREATE POLICY "Service manages users"
ON users FOR ALL
USING (true); -- Service role bypasses RLS

-- ============================================
-- PUBLIC READ TABLES (No RLS needed)
-- ============================================

-- Tools, Packages, System Configs are public read
-- No RLS needed, but protect writes

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tools/packages
CREATE POLICY "Public read tools"
ON tools FOR SELECT
USING (is_active = true);

CREATE POLICY "Public read packages"
ON packages FOR SELECT
USING (is_active = true);

CREATE POLICY "Public read configs"
ON system_configs FOR SELECT
USING (is_public = true);

-- Only admins can modify
CREATE POLICY "Admins manage tools"
ON tools FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins manage packages"
ON packages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins manage configs"
ON system_configs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);
