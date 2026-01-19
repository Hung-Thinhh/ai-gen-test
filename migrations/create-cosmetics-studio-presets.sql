-- ==========================================
-- CREATE COSMETICS STUDIO WITH PRESETS
-- ==========================================
-- This creates a complete studio for cosmetics/beauty products
-- with domain context and 5 specialized style presets

-- Note: Assumes tool_custom_id = 2 for Cosmetics Studio
-- Adjust the tool_custom_id if needed based on your database

-- ==========================================
-- 1. DOMAIN CONTEXT for Cosmetics
-- ==========================================
-- Domain context will be stored in tool_custom.domain_prompts column
-- This is just for reference - update the tool_custom record directly

/*
Beauty & Cosmetics aesthetics:
CONTEXT: Luxurious commercial photography for skincare, makeup, and beauty products.
KEY ELEMENTS:
- ELEGANCE & PURITY: Products must look premium, clean, and sophisticated.
- TEXTURE SHOWCASE: Highlight smooth cream textures, silky powders, glossy lipsticks, elegant packaging.
- LIGHTING: Soft, diffused lighting that creates a dream-like glow. Subtle highlights on product surfaces.
- PROPS: Flower petals (rose, orchid), marble surfaces, silk ribbons, soft brushes, powder puffs, golden accents, crystal elements.
- COLOR PALETTE: Pastel tones, rose gold, champagne, soft pinks, elegant whites, sophisticated neutrals.
FORBIDDEN: Do NOT add ice/water/condensation (F&B props), tech circuits, food items, or beverage glasses.
VIBE: Elegant, luxurious, feminine, pure, premium, spa-like, dreamy.
*/

-- ==========================================
-- 2. STYLE PRESETS for Cosmetics
-- ==========================================

INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata)
VALUES

-- 1. Luxury Rose Gold
(2, 'style_preset',
 'Luxury Rose Gold', 'Hồng Vàng Sang Trọng',
 'SCENE: Ultra-premium rose gold luxury setting. **KEY VISUALS:** Rose gold metallic accents, champagne-colored silk drapes, crystal elements, soft pink rose petals scattered artfully. Marble or frosted glass surface. **CRITICAL INSTRUCTIONS:** Use soft, warm lighting with subtle rose gold reflections. Create a dreamy bokeh effect in background. Atmosphere: expensive, exclusive, haute couture beauty. Color palette dominated by rose gold, champagne, soft pinks, and ivory. Full HD commercial quality.',
 '{"description": "Rose gold luxury, silk, crystals, premium", "description_vi": "Hồng vàng cao cấp, lụa, pha lê, sang trọng"}'::jsonb),

-- 2. Fresh Morning Dew
(2, 'style_preset',
 'Fresh Morning Dew', 'Sương Mai Tươi Mát',
 'SCENE: Clean, fresh, spa-like morning atmosphere. **KEY VISUALS:** Delicate water droplets on product surface (NOT condensation - more like morning dew), fresh white orchid or jasmine flowers, smooth white stones, light wooden elements. Soft natural morning light. **CRITICAL INSTRUCTIONS:** Color palette: whites, light greens, natural wood tones, clear water. Atmosphere: pure, refreshing, spa, natural skincare. Depth of field with soft focus on background flowers. Full HD commercial quality.',
 '{"description": "Morning dew, orchids, spa, pure white", "description_vi": "Sương mai, hoa lan, spa, trắng tinh khiết"}'::jsonb),

-- 3. Velvet Elegance
(2, 'style_preset',
 'Velvet Elegance', 'Nhung Thanh Lịch',
 'SCENE: Rich, velvety, high-fashion editorial style. **KEY VISUALS:** Deep burgundy or emerald green velvet fabric as backdrop or surface. Gold jewelry elements (subtle), vintage perfume bottles as props (if relevant), dramatic shadows. **CRITICAL INSTRUCTIONS:** Lighting: dramatic side lighting creating elegant shadows. Color palette: deep jewel tones (burgundy, emerald, sapphire) with gold accents. Atmosphere: sophisticated, editorial, Vogue-like, timeless elegance. Full HD commercial quality.',
 '{"description": "Velvet, jewel tones, editorial, dramatic", "description_vi": "Nhung, tone ngọc quý, biên tập, kịch tính"}'::jsonb),

-- 4. Marble Minimalist
(2, 'style_preset',
 'Marble Minimalist', 'Đá Cẩm Thạch Tối Giản',
 'SCENE: Clean minimalist aesthetic with marble surfaces. **KEY VISUALS:** White or grey marble surface with natural veining. Minimal props: one or two geometric gold elements, a single fresh flower (white rose or calla lily). Clean composition with lots of negative space. **CRITICAL INSTRUCTIONS:** High-key lighting. Low contrast but sharp product focus. Color palette: white, grey, soft neutrals, subtle gold. Atmosphere: modern, clean, luxury minimalism, Scandinavian aesthetic. Full HD commercial quality.',
 '{"description": "White marble, minimalist, clean lines, gold accents", "description_vi": "Cẩm thạch trắng, tối giản, đường nét sạch, điểm vàng"}'::jsonb),

-- 5. Peony Garden Dream
(2, 'style_preset',
 'Peony Garden Dream', 'Vườn Mẫu Đơn Mộng Mơ',
 'SCENE: Romantic, dreamy garden with peony flowers. **KEY VISUALS:** Soft pink and white peony flowers (large, lush blooms) surrounding the product. Soft pastel color palette. Ethereal, diffused lighting creating a magical atmosphere. Silk ribbons (optional). **CRITICAL INSTRUCTIONS:** Use soft focus and dreamy bokeh. Color palette: soft pinks, blush, ivory, lavender. Atmosphere: romantic, feminine, spring garden, enchanted. Lighting should be soft and flattering like golden hour filtered through petals. Full HD commercial quality.',
 '{"description": "Peony flowers, romantic, soft pink, dreamy", "description_vi": "Hoa mẫu đơn, lãng mạn, hồng nhạt, mộng mơ"}'::jsonb);

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 
    name,
    name_vi,
    LEFT(prompt_text, 80) as preview,
    metadata->>'description_vi' as description
FROM prompt_templates 
WHERE tool_custom_id = 2 AND category = 'style_preset'
ORDER BY id;
