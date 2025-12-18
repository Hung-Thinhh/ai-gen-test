-- ============================================
-- SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE (Guest + Registered)
-- ============================================

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('guest', 'registered')),
    
    -- Auth Info (NULL for guests)
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    
    -- Guest Info (NULL for registered)
    ip_address INET,
    device_fingerprint VARCHAR(100),
    
    -- Credits & Subscription
    current_credits INTEGER DEFAULT 10 CHECK (current_credits >= 0),
    total_spent_vnd NUMERIC(12,2) DEFAULT 0,
    
    -- Premium
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
    subscription_type VARCHAR(20) CHECK (subscription_type IN ('free', 'weekly', 'monthly', 'yearly')),
    subscription_expires_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    
    -- Guest Limitations
    guest_generation_count INTEGER DEFAULT 0,
    guest_last_generation_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_guest_has_ip CHECK (
        (user_type = 'guest' AND ip_address IS NOT NULL) OR
        (user_type = 'registered' AND email IS NOT NULL)
    )
);

CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_ip ON users(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 2. TOOLS TABLE
-- ============================================

CREATE TABLE tools (
    tool_id SERIAL PRIMARY KEY,
    tool_key VARCHAR(50) UNIQUE NOT NULL,
    display_name JSONB NOT NULL,
    description JSONB,
    
    -- Pricing
    base_credit_cost INTEGER NOT NULL DEFAULT 1,
    premium_credit_cost INTEGER,
    
    -- API Config
    api_model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.0-flash-image',
    max_resolution VARCHAR(10) DEFAULT '1K',
    
    -- Features
    is_active BOOLEAN DEFAULT true,
    is_premium_only BOOLEAN DEFAULT false,
    category VARCHAR(30),
    
    -- Display
    icon_url TEXT,
    preview_image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tools_active ON tools(is_active, sort_order);
CREATE INDEX idx_tools_category ON tools(category);

-- ============================================
-- 3. GENERATION HISTORY (NO INPUT STORAGE)
-- ============================================

CREATE TABLE generation_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES tools(tool_id),
    
    -- Output ONLY (no input_prompt, no input_images)
    output_images JSONB NOT NULL,
    generation_count INTEGER DEFAULT 1,
    
    -- Cost & Performance
    credits_used INTEGER NOT NULL,
    api_model_used VARCHAR(50),
    generation_time_ms INTEGER,
    
    -- Minimal Metadata (technical params only)
    parameters JSONB,
    
    error_message TEXT,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
    
    -- Analytics
    is_favorited BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_history_user ON generation_history(user_id, created_at DESC);
CREATE INDEX idx_history_tool ON generation_history(tool_id, created_at DESC);
CREATE INDEX idx_history_public ON generation_history(is_public, created_at DESC) WHERE is_public = true;

-- ============================================
-- 4. TRANSACTIONS
-- ============================================

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'usage', 'refund', 'bonus', 'admin_adjustment')),
    
    credits_delta INTEGER NOT NULL,
    credits_before INTEGER NOT NULL,
    credits_after INTEGER NOT NULL,
    
    -- Payment Info (for topup)
    amount_vnd NUMERIC(12,2),
    payment_method VARCHAR(30),
    payment_gateway_ref VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Usage Info
    tool_id INTEGER REFERENCES tools(tool_id),
    history_id UUID REFERENCES generation_history(history_id),
    
    note TEXT,
    admin_user_id VARCHAR(50) REFERENCES users(user_id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type, created_at DESC);

-- ============================================
-- 5. PACKAGES (Credit packs & Subscriptions)
-- ============================================

CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    package_key VARCHAR(50) UNIQUE NOT NULL,
    display_name JSONB NOT NULL,
    description JSONB,
    
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('credits', 'subscription')),
    
    price_vnd NUMERIC(10,2) NOT NULL,
    original_price_vnd NUMERIC(10,2),
    discount_percent INTEGER DEFAULT 0,
    
    credits_included INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    
    -- Subscription specific
    duration_days INTEGER,
    auto_renew BOOLEAN DEFAULT false,
    
    features JSONB,
    
    -- Display
    badge_text VARCHAR(30),
    badge_color VARCHAR(7),
    icon_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_packages_active ON packages(is_active, sort_order);

-- ============================================
-- 6. USER PURCHASES
-- ============================================

CREATE TABLE user_purchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES packages(package_id),
    
    package_snapshot JSONB NOT NULL,
    
    amount_paid_vnd NUMERIC(10,2) NOT NULL,
    credits_received INTEGER NOT NULL,
    bonus_credits_received INTEGER DEFAULT 0,
    
    payment_method VARCHAR(30),
    payment_gateway_ref VARCHAR(100) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Subscription
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    subscription_status VARCHAR(20),
    
    transaction_id UUID REFERENCES transactions(transaction_id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON user_purchases(user_id, created_at DESC);
CREATE INDEX idx_purchases_status ON user_purchases(payment_status);

-- ============================================
-- 7. SYSTEM CONFIGS
-- ============================================

CREATE TABLE system_configs (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    updated_by VARCHAR(50) REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed default configs
INSERT INTO system_configs (config_key, config_value, value_type, description, is_public) VALUES
('free_tier_credits', '10', 'integer', 'Credits tặng khi đăng ký mới', true),
('guest_generation_limit', '3', 'integer', 'Số lần generate tối đa cho guest', true),
('maintenance_mode', 'false', 'boolean', 'Bật chế độ bảo trì', true);
