-- ============================================
-- BLOG FEATURE - DATABASE SCHEMA
-- Run this in Neon Console
-- ============================================

-- 1. Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- 2. Blog Tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

-- 3. Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id VARCHAR(50) REFERENCES users(user_id),
    category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    
    -- SEO Fields
    meta_title VARCHAR(100),
    meta_description VARCHAR(160),
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);

-- 4. Blog Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 5. Seed default category
INSERT INTO blog_categories (name, slug, description) VALUES 
('Hướng dẫn', 'huong-dan', 'Các bài hướng dẫn sử dụng'),
('Tin tức', 'tin-tuc', 'Tin tức và cập nhật mới'),
('Mẹo hay', 'meo-hay', 'Mẹo và thủ thuật hữu ích')
ON CONFLICT (slug) DO NOTHING;

-- 6. Seed default tags
INSERT INTO blog_tags (name, slug) VALUES 
('AI', 'ai'),
('Hình ảnh', 'hinh-anh'),
('Hướng dẫn', 'huong-dan'),
('Mẹo', 'meo')
ON CONFLICT (slug) DO NOTHING;
