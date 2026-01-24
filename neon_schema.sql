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


-- Table: video_apps
DROP TABLE IF EXISTS video_apps CASCADE;
CREATE TABLE video_apps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    thumbnail_url text, -- App icon/cover
    preview_video_url text, -- Demo video result
    
    -- Config Model (Fixed per App)
    model_config jsonb NOT NULL,
    -- Example: { "model": "kling/ai-avatar-standard", "mode": "normal" }
    
    -- Input Fields Config (Dynamic Form)
    input_schema jsonb NOT NULL,
    -- Example: [ { "id": "text", "type": "textarea", "label": "Prompt" } ]
    
    -- Prompt Template (Handlebars style {{var}})
    prompt_template text, 
    
    category text DEFAULT 'general',
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Seed Data: Video Apps
INSERT INTO video_apps (id, name, description, model_config, input_schema, prompt_template, thumbnail_url) VALUES 
(
    '11111111-1111-1111-1111-111111111111', 
    'Talking Avatar (Lip Sync)', 
    'Tạo video nhân vật nói chuyện khớp với file ghi âm.', 
    '{"model": "kling/ai-avatar-standard"}', 
    '[
        {"id": "image_url", "type": "image", "label": "Ảnh Nhân Vật", "required": true},
        {"id": "audio_url", "type": "audio", "label": "File Ghi Âm", "required": true}
    ]', 
    null, -- No prompt needed
    'https://files.catbox.moe/lip_sync_thumb.jpg'
),
(
    '22222222-2222-2222-2222-222222222222', 
    'Cinematic Text-to-Video', 
    'Tạo video điện ảnh từ mô tả văn bản.', 
    '{"model": "veo/v3", "aspect_ratio": "16:9"}', 
    '[
        {"id": "prompt", "type": "textarea", "label": "Mô tả video", "placeholder": "A futuristic city...", "required": true}
    ]', 
    '{{prompt}}', -- Use prompt directly
    'https://files.catbox.moe/t2v_thumb.jpg'
),
(
    '33333333-3333-3333-3333-333333333333', 
    'Image Animation', 
    'Tạo chuyển động cho hình ảnh tĩnh.', 
    '{"model": "veo/v3"}', 
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Tĩnh", "required": true},
        {"id": "prompt", "type": "textarea", "label": "Mô tả chuyển động", "placeholder": "Wind blowing, camera zoom in..."}
    ]', 
    '{{prompt}}',
    'https://files.catbox.moe/i2v_thumb.jpg'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Premium Zen TVC',
    'Quảng cáo cao cấp, tĩnh lặng. Phù hợp: trà, rượu, nước hoa, trang sức.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: Trà Ô Long Premium", "required": true}
    ]',
    'Professional luxury commercial for {{product_name}}. Slow smooth camera dolly movement, soft natural lighting with warm golden tones, steam rising elegantly, minimalist zen background. Premium packaging showcase, mindful peaceful atmosphere. No voiceover, natural ambient sounds only. 4K cinematic quality.',
    'https://files.catbox.moe/premium_zen.jpg'
),
(
    '55555555-5555-5555-5555-555555555555',
    'Fresh Nature TVC',
    'Tươi mát, năng động. Phù hợp: nước giải khát, thực phẩm organic, mỹ phẩm thiên nhiên.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: Nước Ép Táo Xanh", "required": true}
    ]',
    'Vibrant commercial for {{product_name}}. Dynamic camera movements through fresh green nature, morning dew on leaves, water droplets sparkling in bright daylight. Natural ingredients floating, energetic healthy vibe. Bright saturated green tones, outdoor fresh atmosphere. No voiceover, natural ambient sounds only. 4K quality.',
    'https://files.catbox.moe/fresh_nature.jpg'
),
(
    '66666666-6666-6666-6666-666666666666',
    'Modern Lifestyle TVC',
    'Hiện đại, trendy. Phù hợp: tech, fashion, cafe, startup products.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: SmartWatch X Pro", "required": true}
    ]',
    'Cool modern commercial for {{product_name}}. Quick dynamic cuts, urban contemporary setting, high contrast dramatic lighting. Sleek product angles, Instagram-worthy aesthetic, vibrant neon accents. Young lifestyle vibe, trendy music video style. No voiceover, natural ambient sounds only. 4K cinematic.',
    'https://files.catbox.moe/modern_lifestyle.jpg'
),
(
    '77777777-7777-7777-7777-777777777777',
    'Soft Minimalist TVC',
    'Nhẹ nhàng, tối giản. Phù hợp: mỹ phẩm, nước hoa, sản phẩm cho bé, trang sức tinh tế.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: Nước Hoa Lavender", "required": true}
    ]',
    'Gentle minimalist commercial for {{product_name}}. Soft pastel colors, delicate floating movements, white clean background. Subtle lighting with dreamy glow, powder and flower petals gently falling. Calm peaceful atmosphere, refined elegant presentation. No voiceover, natural ambient sounds only. 4K quality.',
    'https://files.catbox.moe/soft_minimal.jpg'
),
(
    '88888888-8888-8888-8888-888888888888',
    'Clean & Pure TVC',
    'Trong sáng, thuần khiết. Phù hợp: sữa, nước tinh khiết, skincare, organic baby products.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: Sữa Tươi Organic", "required": true}
    ]',
    'Pure clean commercial for {{product_name}}. Crystal clear lighting, white pristine environment, gentle milk or water splash. Soft focus bokeh, natural purity aesthetic. Fresh morning light, innocent gentle vibe. Laboratory clean atmosphere. No voiceover, natural ambient sounds only. 4K cinematic.',
    'https://files.catbox.moe/clean_pure.jpg'
),
(
    '99999999-9999-9999-9999-999999999999',
    'Product Explosion TVC',
    'Hiệu ứng sản phẩm nổ tung, nguyên liệu bay trong không khí. Phù hợp: thực phẩm, đồ uống, mỹ phẩm.',
    '{"model": "veo/v3"}',
    '[
        {"id": "image_urls", "type": "image", "label": "Ảnh Sản Phẩm", "required": true},
        {"id": "product_name", "type": "text", "label": "Tên Sản Phẩm", "placeholder": "VD: Nutella, Oat Milk", "required": true}
    ]',
    'Photorealistic cinematic commercial for {{product_name}}. Sunlit kitchen setting with morning light streaming through curtains. Product jar/bottle begins vibrating, then bursts open—releasing explosion of swirling ingredients, components flying and orbiting mid-air in slow motion. Elements assemble into perfect product showcase on wooden table. Slow orbital camera movement from low angle to overhead reveal. Ingredients catch golden sunlight, creating dreamy glow. Gravity-defying product assembly, particles and droplets suspended beautifully. Final shot: beautifully arranged product with steam and glow. No voiceover, natural ambient sounds only. 16:9 cinematic, high detail, no text.',
    'https://files.catbox.moe/explosion_tvc.jpg'
);


