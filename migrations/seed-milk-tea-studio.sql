-- ==========================================
-- MILK TEA POSTER STUDIO - SEED DATA
-- ==========================================
-- This is a simplified seed for testing the concept
-- Can be integrated into unified schema later

-- Assuming tool_types and cate_tool_custom tables already exist from unified schema
-- If not, create them first

-- Insert Milk Tea Poster Studio
INSERT INTO tool_custom (
  tool_type_id,
  category_id,
  name,
  slug,
  description,
  preview_image_url,
  prompts,
  ui_config,
  status,
  sort_order,
  tags
) VALUES (
  (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1),
  (SELECT id FROM cate_tool_custom WHERE slug = 'fb' LIMIT 1),
  'Thiết Kế Poster Trà Sữa',
  'milk-tea-poster',
  'Tạo poster chuyên nghiệp cho trà sữa, bubble tea với style hiện đại và thu hút',
  '/assets/studios/milk-tea-preview.jpg',
  '{
    "background_styles": [
      {
        "id": "bg_pastel_mint",
        "name": "Pastel Mint Green",
        "name_vi": "Xanh Bạc Hà Nhẹ",
        "prompt": "soft pastel mint green gradient background, cream undertones, smooth seamless backdrop with gentle lighting, matcha-inspired color palette, professional beverage photography setup"
      },
      {
        "id": "bg_pink_cream",
        "name": "Pink & Cream",
        "name_vi": "Hồng Kem",
        "prompt": "soft pink and cream color palette, gentle gradient background, romantic pastel tones, strawberry milk tea inspired, warm diffused lighting"
      },
      {
        "id": "bg_brown_coffee",
        "name": "Brown Coffee Tone",
        "name_vi": "Nâu Cà Phê",
        "prompt": "warm brown and coffee tones, earthy colors, wooden surface texture, cozy cafe atmosphere, milk tea with coffee fusion aesthetic"
      },
      {
        "id": "bg_vibrant_tropical",
        "name": "Vibrant Tropical",
        "name_vi": "Nhiệt Đới Rực Rỡ",
        "prompt": "vibrant tropical colors, fresh fruit tea tones (mango yellow, berry purple, kiwi green), energetic summer vibe, bold gradient background"
      },
      {
        "id": "bg_white_minimal",
        "name": "Clean White Minimal",
        "name_vi": "Trắng Tối Giản",
        "prompt": "pure white minimalist background, clean studio setup, soft shadows, modern simplicity, premium bubble tea aesthetic"
      }
    ],
    "decorative_elements": [
      {
        "id": "deco_tea_leaves",
        "name": "Tea Leaves",
        "name_vi": "Lá Trà",
        "prompt": "fresh green tea leaves scattered elegantly around the product, natural organic props, tea garden aesthetic"
      },
      {
        "id": "deco_tapioca",
        "name": "Tapioca Pearls",
        "name_vi": "Trân Châu",
        "prompt": "glossy black tapioca pearls bouncing dynamically, bubble tea signature element, playful composition"
      },
      {
        "id": "deco_fruit_slices",
        "name": "Fresh Fruit",
        "name_vi": "Hoa Quả Tươi",
        "prompt": "fresh fruit slices (strawberry, mango, passion fruit, lychee), tropical garnish, colorful natural props"
      },
      {
        "id": "deco_ice_splash",
        "name": "Ice & Splash",
        "name_vi": "Đá & Splash",
        "prompt": "ice cubes flying, water splash effect, condensation droplets on cup, refreshing cold beverage atmosphere"
      },
      {
        "id": "deco_none",
        "name": "No Decoration",
        "name_vi": "Không Trang Trí",
        "prompt": "clean minimal composition, focus solely on the product, no distracting elements"
      }
    ],
    "lighting_styles": [
      {
        "id": "light_soft_natural",
        "name": "Soft Natural",
        "name_vi": "Tự Nhiên Mềm",
        "prompt": "soft natural window light from side, gentle shadows, warm afternoon ambiance"
      },
      {
        "id": "light_studio_pro",
        "name": "Professional Studio",
        "name_vi": "Studio Chuyên Nghiệp",
        "prompt": "professional 3-point studio lighting setup, even illumination, commercial quality"
      },
      {
        "id": "light_golden_hour",
        "name": "Golden Hour",
        "name_vi": "Giờ Vàng",
        "prompt": "warm golden hour sunlight, magical atmosphere, dreamy lighting, Instagram-worthy glow"
      },
      {
        "id": "light_bright_fresh",
        "name": "Bright & Fresh",
        "name_vi": "Sáng Tươi",
        "prompt": "bright fresh lighting, high-key photography, clean and vibrant, energetic mood"
      }
    ],
    "aspect_ratios": [
      "1:1 (Instagram Post)",
      "9:16 (Instagram Story)",
      "4:5 (Instagram Feed)",
      "16:9 (Facebook Cover)"
    ]
  }'::jsonb,
  '{
    "upload_slots": {
      "product": {
        "required": true,
        "label": "Ảnh Trà Sữa",
        "label_en": "Milk Tea Photo",
        "description": "Tải ảnh sản phẩm trà sữa / bubble tea của bạn",
        "description_en": "Upload your milk tea / bubble tea product photo"
      },
      "reference": {
        "required": false,
        "label": "Bố Cục Tham Khảo",
        "label_en": "Reference Layout",
        "description": "Ảnh poster mẫu để copy phong cách và bố cục",
        "description_en": "Sample poster to copy style and layout"
      }
    },
    "text_options": {
      "enabled": true,
      "fields": ["headline", "subheadline", "cta"],
      "max_headline_length": 50,
      "max_subheadline_length": 100,
      "max_cta_length": 20
    },
    "default_selections": {
      "background": "bg_pastel_mint",
      "decoration": "deco_tapioca",
      "lighting": "light_soft_natural",
      "aspect_ratio": "1:1 (Instagram Post)"
    }
  }'::jsonb,
  'active',
  1,
  ARRAY['milk-tea', 'bubble-tea', 'beverage', 'drink', 'poster', 'f&b']
);

-- Optional: Add example prompts for inspiration
INSERT INTO prompt_templates (tool_type_id, category, name, name_vi, prompt_text, tags)
VALUES
  ((SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'inspiration', 'Summer Milk Tea', 'Trà Sữa Mùa Hè', 
   'Create a vibrant summer-themed milk tea poster with tropical fruits, ice cubes, and bright colors', 
   ARRAY['summer', 'tropical', 'refreshing']),
   
  ((SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'inspiration', 'Elegant Matcha', 'Trà Xanh Thanh Lịch',
   'Design an elegant matcha latte poster with green tea leaves, minimalist aesthetic, and soft pastel colors',
   ARRAY['matcha', 'elegant', 'minimalist']),
   
  ((SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'inspiration', 'Brown Sugar Boba', 'Trân Châu Đường Nâu',
   'Create a cozy brown sugar boba poster with warm tones, tapioca pearls, and cafe atmosphere',
   ARRAY['boba', 'cozy', 'brown-sugar']);

-- Add to existing categories if not exist
INSERT INTO cate_tool_custom (name, name_vi, slug, icon, sort_order)
VALUES ('Beverages', 'Đồ Uống', 'beverages', '🧋', 15)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE tool_custom IS 'Unified studios table for all tool types (photo, poster, video, effects)';
COMMENT ON COLUMN tool_custom.prompts IS 'JSONB field containing tool-specific prompt configurations';
COMMENT ON COLUMN tool_custom.ui_config IS 'JSONB field for UI customization per studio';
