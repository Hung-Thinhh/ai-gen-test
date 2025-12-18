-- ============================================
-- SEED DATA: Tools & Packages
-- Run AFTER schema and RLS policies
-- ============================================

-- ============================================
-- TOOLS
-- ============================================

INSERT INTO tools (
    tool_key,
    display_name,
    description,
    base_credit_cost,
    api_model,
    category,
    is_active,
    sort_order
) VALUES
('free-generation', 
 '{"vi": "Tạo ảnh tự do", "en": "Free Generation"}',
 '{"vi": "Tạo ảnh từ văn bản mô tả", "en": "Create images from text description"}',
 2, 'gemini-2.0-flash-image', 'image-generation', true, 1),

('poster-creator',
 '{"vi": "Tạo Poster", "en": "Poster Creator"}',
 '{"vi": "Tạo poster quảng cáo sản phẩm", "en": "Create product advertising posters"}',
 4, 'gemini-2.0-flash-image', 'image-generation', true, 2),

('avatar-creator',
 '{"vi": "Tạo Avatar", "en": "Avatar Creator"}',
 '{"vi": "Tạo avatar cá nhân hóa", "en": "Create personalized avatars"}',
 3, 'gemini-2.0-flash-image', 'image-generation', true, 3),

('portrait-generator',
 '{"vi": "Tạo Chân Dung", "en": "Portrait Generator"}',
 '{"vi": "Tạo chân dung nghệ thuật", "en": "Generate artistic portraits"}',
 3, 'gemini-2.0-flash-image', 'image-generation', true, 4);

-- ============================================
-- PACKAGES
-- ============================================

INSERT INTO packages (
    package_key,
    display_name,
    description,
    package_type,
    price_vnd,
    original_price_vnd,
    credits_included,
    bonus_credits,
    duration_days,
    features,
    badge_text,
    is_featured,
    sort_order
) VALUES
-- Credit Packs
('starter-100',
 '{"vi": "Gói Khởi Đầu", "en": "Starter Pack"}',
 '{"vi": "100 Credits - Phù hợp thử nghiệm", "en": "100 Credits - Perfect for trial"}',
 'credits', 99000, NULL, 100, 0, NULL,
 '["basic_tools", "1k_resolution"]'::jsonb,
 NULL, false, 1),

('popular-500',
 '{"vi": "Gói Phổ Biến", "en": "Popular Pack"}',
 '{"vi": "500 Credits + 50 Bonus", "en": "500 Credits + 50 Bonus"}',
 'credits', 449000, 499000, 500, 50, NULL,
 '["all_tools", "4k_resolution"]'::jsonb,
 'PHỔ BIẾN', true, 2),

('value-1000',
 '{"vi": "Gói Siêu Tiết Kiệm", "en": "Best Value Pack"}',
 '{"vi": "1000 Credits + 200 Bonus", "en": "1000 Credits + 200 Bonus"}',
 'credits', 799000, 999000, 1000, 200, NULL,
 '["all_tools", "4k_resolution", "priority_support"]'::jsonb,
 'TIẾT KIỆM NHẤT', true, 3),

-- Subscriptions
('weekly-basic',
 '{"vi": "Tuần Cơ Bản", "en": "Weekly Basic"}',
 '{"vi": "200 Credits/tuần", "en": "200 Credits/week"}',
 'subscription', 69000, NULL, 200, 0, 7,
 '["all_tools", "4k_resolution"]'::jsonb,
 NULL, false, 4),

('monthly-pro',
 '{"vi": "Tháng Pro", "en": "Monthly Pro"}',
 '{"vi": "1000 Credits/tháng + Ưu tiên", "en": "1000 Credits/month + Priority"}',
 'subscription', 249000, 299000, 1000, 100, 30,
 '["all_tools", "4k_resolution", "priority_support", "no_watermark"]'::jsonb,
 'TỐT NHẤT', true, 5),

('yearly-premium',
 '{"vi": "Năm Premium", "en": "Yearly Premium"}',
 '{"vi": "15000 Credits/năm - Tiết kiệm 40%", "en": "15000 Credits/year - Save 40%"}',
 'subscription', 1999000, 3588000, 15000, 3000, 365,
 '["all_tools", "8k_resolution", "priority_support", "no_watermark", "api_access"]'::jsonb,
 'GIẢM 40%', true, 6);
