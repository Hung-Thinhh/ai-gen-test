-- ==========================================
-- UNIFIED STUDIO SYSTEM - MAIN MIGRATION
-- ==========================================
-- Creates tables for scalable multi-tool studio system

-- 1. Tool Types Registry
CREATE TABLE IF NOT EXISTS tool_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  component VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial tool types
INSERT INTO tool_types (code, name, name_vi, component, sort_order) VALUES
('photo', 'Photo Studio', 'Studio Chụp Ảnh', 'PhotoStudioGenerator', 1),
('poster', 'Poster Creator', 'Thiết Kế Poster', 'PosterStudioGenerator', 2),
('video', 'Video Generator', 'Tạo Video', 'VideoStudioGenerator', 3),
('effect', 'Effect Studio', 'Hiệu Ứng', 'EffectStudioGenerator', 4)
ON CONFLICT (code) DO NOTHING;

-- 2. Categories (Shared across all tool types)
CREATE TABLE IF NOT EXISTS cate_tool_custom (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_id INTEGER REFERENCES cate_tool_custom(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed common categories
INSERT INTO cate_tool_custom (name, name_vi, slug, icon, sort_order) VALUES
('F&B', 'Thực phẩm & Đồ uống', 'fb', '🍔', 1),
('Fashion & Beauty', 'Thời trang & Làm đẹp', 'fashion-beauty', '👗', 2),
('Technology', 'Công nghệ', 'tech', '💻', 3),
('Education', 'Giáo dục', 'education', '📚', 4),
('Travel', 'Du lịch', 'travel', '✈️', 5),
('Health & Fitness', 'Sức khỏe & Thể thao', 'health-fitness', '💪', 6),
('Beverages', 'Đồ Uống', 'beverages', '🧋', 7)
ON CONFLICT (slug) DO NOTHING;

-- 3. Unified Studios Table
CREATE TABLE IF NOT EXISTS tool_custom (
  id SERIAL PRIMARY KEY,
  tool_type_id INTEGER NOT NULL REFERENCES tool_types(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES cate_tool_custom(id) ON DELETE SET NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  
  -- Flexible Prompt Configuration (JSONB)
  prompts JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- UI Configuration
  ui_config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  status VARCHAR(20) DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  tags TEXT[],
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite unique constraint
  UNIQUE(tool_type_id, slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tool_custom_tool_type ON tool_custom(tool_type_id);
CREATE INDEX IF NOT EXISTS idx_tool_custom_category ON tool_custom(category_id);
CREATE INDEX IF NOT EXISTS idx_tool_custom_status ON tool_custom(status);
CREATE INDEX IF NOT EXISTS idx_tool_custom_slug ON tool_custom(slug);
CREATE INDEX IF NOT EXISTS idx_tool_custom_tags ON tool_custom USING gin(tags);

-- 4. Prompt Templates (Reusable across studios)
CREATE TABLE IF NOT EXISTS prompt_templates (
  id SERIAL PRIMARY KEY,
  tool_type_id INTEGER REFERENCES tool_types(id) ON DELETE CASCADE,
  category VARCHAR(100),
  
  name VARCHAR(255) NOT NULL,
  name_vi VARCHAR(255),
  prompt_text TEXT NOT NULL,
  preview_image_url TEXT,
  
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_tool_type ON prompt_templates(tool_type_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tool_custom
DROP TRIGGER IF EXISTS update_tool_custom_updated_at ON tool_custom;
CREATE TRIGGER update_tool_custom_updated_at
    BEFORE UPDATE ON tool_custom
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to prompt_templates
DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE tool_types IS 'Registry of available tool types (photo, poster, video, effects)';
COMMENT ON TABLE cate_tool_custom IS 'Shared categories across all tool types';
COMMENT ON TABLE tool_custom IS 'Unified studios table for all tool types with flexible JSONB configuration';
COMMENT ON TABLE prompt_templates IS 'Reusable prompt templates that can be shared across studios';
COMMENT ON COLUMN tool_custom.prompts IS 'JSONB field containing tool-specific prompt configurations (backgrounds, lighting, etc.)';
COMMENT ON COLUMN tool_custom.ui_config IS 'JSONB field for UI customization (upload slots, text options, etc.)';
