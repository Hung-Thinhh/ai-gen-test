-- Create packages table if not exists
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_key TEXT UNIQUE NOT NULL, -- 'free', 'month', 'year', 'teams'
    display_name JSONB NOT NULL, -- {"en": "Monthly", "vi": "Gói tháng"}
    description JSONB,           -- {"en": "Perfect for...", "vi": "Phù hợp cho..."}
    price_vnd NUMERIC NOT NULL DEFAULT 0,
    price_monthly_vnd NUMERIC DEFAULT 0,
    price_yearly_vnd NUMERIC DEFAULT 0,
    credits_included INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'VND',
    billing_cycle TEXT CHECK (billing_cycle IN ('one_time', 'monthly', 'yearly', 'lifetime')), -- 'monthly', 'yearly', 'one_time'
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb, -- Array of strings
    category TEXT DEFAULT 'month',     -- 'month', 'year', 'b2b'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON packages FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON packages USING (auth.role() = 'service_role');

-- Seed Data
INSERT INTO packages (package_key, display_name, description, price_vnd, price_monthly_vnd, price_yearly_vnd, credits_included, category, sort_order, features, is_popular, is_featured)
VALUES 
(
    'free', 
    '{"en": "Trial", "vi": "Dùng thử"}', 
    '{"en": "Perfect for trying out", "vi": "Trải nghiệm tính năng cơ bản"}', 
    0, 0, 0, 
    5, 
    'month', 
    1, 
    '["5 credits miễn phí", "Tạo ảnh cơ bản", "Tốc độ tiêu chuẩn"]'::jsonb,
    false,
    false
),
(
    'month_basic', 
    '{"en": "Basic Monthly", "vi": "Cơ bản"}', 
    '{"en": "For hobbies", "vi": "Dành cho người mới bắt đầu"}', 
    99000, 99000, 0, 
    100, 
    'month', 
    2, 
    '["100 credits/tháng", "Tạo ảnh chất lượng cao", "Không giới hạn tính năng"]'::jsonb,
    false,
    false
),
(
    'month_pro', 
    '{"en": "Pro Monthly", "vi": "Chuyên nghiệp"}', 
    '{"en": "Best value", "vi": "Được chọn nhiều nhất"}', 
    199000, 199000, 0, 
    300, 
    'month', 
    3, 
    '["300 credits/tháng", "Tạo ảnh siêu nét", "Ưu tiên xử lý", "Hỗ trợ 24/7"]'::jsonb,
    true,
    true
),
(
    'month_expert', 
    '{"en": "Expert Monthly", "vi": "Chuyên gia"}', 
    '{"en": "Heavy usage", "vi": "Dành cho người dùng thường xuyên"}', 
    499000, 499000, 0, 
    1000, 
    'month', 
    4, 
    '["1000 credits/tháng", "Tất cả tính năng Pro", "Quyền truy cập sớm tính năng mới"]'::jsonb,
    false,
    false
),
(
    'year_basic', 
    '{"en": "Basic Yearly", "vi": "Cơ bản (Năm)"}', 
    '{"en": "Save 20%", "vi": "Tiết kiệm 20%"}', 
    990000, 0, 990000, 
    100, 
    'year', 
    5, 
    '["100 credits/tháng", "Thanh toán 1 lần/năm", "Tiết kiệm 2 tháng"]'::jsonb,
    false,
    false
),
(
    'year_pro', 
    '{"en": "Pro Yearly", "vi": "Chuyên nghiệp (Năm)"}', 
    '{"en": "Best value", "vi": "Tiết kiệm & Phổ biến"}', 
    1990000, 0, 1990000, 
    300, 
    'year', 
    6, 
    '["300 credits/tháng", "Ưu đãi đặc biệt trọn năm", "Hỗ trợ ưu tiên"]'::jsonb,
    true,
    true
),
(
    'teams', 
    '{"en": "Teams", "vi": "Đội nhóm"}', 
    '{"en": "Custom solutions", "vi": "Giải pháp cho doanh nghiệp"}', 
    0, 0, 0, 
    0, 
    'b2b', 
    99, 
    '["Quản lý người dùng", "API Access", "Hỗ trợ riêng", "Hợp đồng tùy chỉnh"]'::jsonb,
    false,
    false
)
ON CONFLICT (package_key) DO UPDATE 
SET 
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_vnd = EXCLUDED.price_vnd,
    credits_included = EXCLUDED.credits_included,
    features = EXCLUDED.features,
    category = EXCLUDED.category,
    is_popular = EXCLUDED.is_popular;
