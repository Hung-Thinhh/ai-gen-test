-- Supabase Database Schema Export
-- Generated: 2026-01-09T08:52:00.534Z
-- Compatible with PostgreSQL (Neon, Supabase, etc.)
-- NOTE: Schema inferred from sample data. Please verify column types and add constraints.

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Table: users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id uuid NOT NULL,
    user_type text,
    email text,
    display_name text,
    avatar_url text,
    ip_address text,
    device_fingerprint text,
    current_credits integer,
    total_spent_vnd integer,
    role text,
    subscription_type text,
    subscription_expires_at text,
    is_active boolean,
    is_banned boolean,
    ban_reason text,
    guest_generation_count integer,
    guest_last_generation_at text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_active_at text
);

-- Indexes for users
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_user_id ON users(user_id);

-- Table: categories
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id uuid NOT NULL,
    name text,
    slug text,
    description text,
    image_url text,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Indexes for categories
ALTER TABLE categories ADD PRIMARY KEY (id);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Table: tools
DROP TABLE IF EXISTS tools CASCADE;
CREATE TABLE tools (
    tool_id integer NOT NULL,
    tool_key text,
    name text,
    description jsonb,
    base_credit_cost integer,
    api_model text,
    max_resolution text,
    is_active boolean,
    is_premium_only boolean,
    status text,
    preview_image_url text,
    sort_order integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    usage integer,
    id_parent text
);

-- Indexes for tools
CREATE INDEX idx_tools_created_at ON tools(created_at);

-- Table: studio
DROP TABLE IF EXISTS studio CASCADE;
CREATE TABLE studio (
    id uuid NOT NULL,
    id_parent text,
    name text,
    description text,
    preview_image_url text,
    prompts jsonb,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    category uuid,
    slug text
);

-- Indexes for studio
ALTER TABLE studio ADD PRIMARY KEY (id);
CREATE INDEX idx_studio_created_at ON studio(created_at);

-- Table: prompts
DROP TABLE IF EXISTS prompts CASCADE;
CREATE TABLE prompts (
    id integer NOT NULL,
    created_at timestamp with time zone,
    avt_url text,
    content text,
    usage text,
    category_ids jsonb
);

-- Indexes for prompts
ALTER TABLE prompts ADD PRIMARY KEY (id);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);

-- Table: hero_banners
DROP TABLE IF EXISTS hero_banners CASCADE;
CREATE TABLE hero_banners (
    id integer NOT NULL,
    title jsonb,
    description jsonb,
    image_url text,
    button_text jsonb,
    button_link text,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Indexes for hero_banners
ALTER TABLE hero_banners ADD PRIMARY KEY (id);
CREATE INDEX idx_hero_banners_created_at ON hero_banners(created_at);

-- Table: system_configs
DROP TABLE IF EXISTS system_configs CASCADE;
CREATE TABLE system_configs (
    config_key text,
    config_value text,
    value_type text,
    description text,
    is_public boolean,
    updated_by text,
    updated_at timestamp with time zone
);

-- Indexes for system_configs

-- Table: generation_history
DROP TABLE IF EXISTS generation_history CASCADE;
CREATE TABLE generation_history (
    history_id uuid NOT NULL,
    user_id uuid NOT NULL,
    tool_id integer NOT NULL,
    output_images jsonb,
    generation_count integer,
    credits_used integer,
    api_model_used text,
    generation_time_ms integer,
    error_message text,
    created_at timestamp with time zone,
    guest_id text NOT NULL
);

-- Indexes for generation_history
CREATE INDEX idx_generation_history_created_at ON generation_history(created_at);
CREATE INDEX idx_generation_history_user_id ON generation_history(user_id);

-- Table: payment_transactions
DROP TABLE IF EXISTS payment_transactions CASCADE;
CREATE TABLE payment_transactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    transaction_id text NOT NULL,
    order_id text NOT NULL,
    package_id text NOT NULL,
    amount integer,
    credits integer,
    status text,
    payment_method text,
    sepay_response text,
    created_at timestamp with time zone,
    completed_at text
);

-- Indexes for payment_transactions
ALTER TABLE payment_transactions ADD PRIMARY KEY (id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Table: guest_sessions
DROP TABLE IF EXISTS guest_sessions CASCADE;
CREATE TABLE guest_sessions (
    guest_id text NOT NULL,
    ip text,
    last_seen timestamp with time zone,
    device_type text,
    user_type text,
    history jsonb,
    credits integer
);

-- Indexes for guest_sessions


-- IMPORTANT NOTES:
-- 1. Schema was inferred from sample data - please verify all column types
-- 2. Add FOREIGN KEY constraints manually if needed
-- 3. Add UNIQUE constraints where appropriate
-- 4. Configure Row Level Security (RLS) policies if needed
-- 5. Add DEFAULT values for columns as needed

