-- ==========================================
-- ADD 5 NEW MILK TEA SPECIFIC STYLE PRESETS (CLEAN VERSION)
-- ==========================================
-- These presets ONLY contain the artistic style description.
-- Variables like {domain}, {bgPrompt}, etc. will be added by the code.

INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata)
VALUES
-- 1. Brown Sugar Lava
(1, 'style_preset',
 'Brown Sugar Lava', 'Đường Đen Lava',
 'SCENE: A rich, appetizing close-up setting focused on "tiger stripe" syrup effects. **KEY VISUALS:** Emphasize the rich caramel brown sugar streaks cascading down the cup. Include realistic ice cubes, condensation, and glistening tapioca pearls (boba) as props. **CRITICAL INSTRUCTIONS:** Match lighting to a warm, moody cafe atmosphere. Caramel tones should glow. Shadows should be soft but define the cup shape. Ensure the "dirty" milk tea look is appetizing, not messy. Full HD commercial quality.',
 '{"description": "Rich brown sugar streaks, moody cafe vibe", "description_vi": "Vân đường đen chảy quyến rũ, vibe quán cafe"}'::jsonb),

-- 2. Summer Fruit Splash
(1, 'style_preset',
 'Summer Fruit Splash', 'Trái Cây Nhiệt Đới',
 'SCENE: High-energy summer vibe with splashing freshness. **KEY VISUALS:** Dynamic water/tea splashes around the cup. Floating fresh fruit slices (orange, lemon, peach, strawberry) partially submerged or flying. Sunlight refracting through the drink and ice cubes. **CRITICAL INSTRUCTIONS:** Use high-speed photography aesthetic. Motion blur on splashes. Sharp focus on product. Colors must be vibrant, saturated, and thirst-quenching. Full HD commercial quality.',
 '{"description": "Fresh fruit tea, splashes, sunlight", "description_vi": "Trà trái cây tươi mát, splash nước, nắng vàng"}'::jsonb),

-- 3. Zen Garden Matcha
(1, 'style_preset',
 'Zen Garden Matcha', 'Vườn Thiền Matcha',
 'SCENE: Peaceful Japanese Zen garden aesthetic. **KEY VISUALS:** Soft, diffused natural light (morning). Props: fine matcha powder sprinkled artistically, a bamboo whisk (chasen), fresh tea leaves, smooth stones. **CRITICAL INSTRUCTIONS:** Color palette: hues of green, stone grey, light wood. Atmosphere: calm, premium, organic. Soft shadows. Depth of field should blur the background zen patterns gently. Full HD commercial quality.',
 '{"description": "Japanese Zen style, matcha, bamboo, stone", "description_vi": "Phong cách Nhật Bản, matcha, tre, đá cuội"}'::jsonb),

-- 4. Korean Cafe Minimalist
(1, 'style_preset',
 'Korean Cafe Minimalist', 'Cafe Tối Giản Hàn Quốc',
 'SCENE: Clean, bright, "Instagrammable" Korean cafe style. **KEY VISUALS:** Harsh direct sunlight creating aesthetic shadows from palm leaves or blinds (gojits). Minimal props: a magazine, dried flowers in a vase, simple glassware. **CRITICAL INSTRUCTIONS:** High key lighting. Low contrast but distinct shadows. Pastel or neutral color palette (creams, whites, beiges). Clean composition with negative space. Full HD commercial quality.',
 '{"description": "Clean white/beige tones, aesthetic shadows, minimal", "description_vi": "Tone trắng/be, bóng đổ nghệ thuật, tối giản"}'::jsonb),

-- 5. Royal Taro & Cream
(1, 'style_preset',
 'Royal Taro & Cream', 'Khoai Môn & Kem',
 'SCENE: Luxurious, soft, dreamy setting. **KEY VISUALS:** Color palette: Soft Lavenders, Purples, and Cream Whites. Props: Real taro chunks, distinct layers of cream cheese, purple swirls. Soft, ethereal lighting. **CRITICAL INSTRUCTIONS:** Focus on the creamy texture and the pastel purple hues. Magical/Dreamy atmosphere but realistic product focus. Full HD commercial quality.',
 '{"description": "Soft purple taro, creamy texture, premium", "description_vi": "Tím khoai môn, chất kem mịm, sang trọng"}'::jsonb);
