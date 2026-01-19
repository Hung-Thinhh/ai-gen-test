-- ==========================================
-- QUICK SEED: 14 Style Presets for Milk Tea
-- Run this directly in your database
-- ==========================================

-- Insert 14 style presets
INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
VALUES
-- 1. Studio Professional
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset', 
 'Studio Professional', 'Studio Chuyên Nghiệp',
 'CREATE A NEW {posterType} featuring {productDesc}. EXTRACT the product and place it in a completely NEW professional studio environment. Apply: {bgPrompt}. Use {lightPrompt}. Shoot at {anglePrompt}. Add reflections, shadows, and professional retouching. Full HD quality. {notes}',
 '{"description": "Serious professional studio photography", "description_vi": "Chụp ảnh studio nghiêm túc, chuyên nghiệp"}'::jsonb),

-- 2. Organic & Elegant  
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Organic & Elegant', 'Hữu cơ & Thanh lịch',
 'CREATE A NEW {posterType} featuring {productDesc}. EXTRACT the product and PLACE it in an elegant organic setting with fresh green leaves, colorful flowers, and natural elements surrounding it. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. Full HD quality. {notes}',
 '{"description": "Product with natural leaves and flowers", "description_vi": "Sản phẩm với lá cây, hoa tươi xung quanh"}'::jsonb),

-- 3. Dynamic & Fresh
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Dynamic & Fresh', 'Động lực & Tươi mới',
 'CREATE A NEW DYNAMIC {posterType} featuring {productDesc}. GENERATE an exciting scene with dramatic liquid splash, water droplets frozen in mid-air, ice cubes flying, and dynamic motion effects. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. High-speed photography look. Full HD quality. {notes}',
 '{"description": "Water splash, flying ingredients", "description_vi": "Splash nước, nguyên liệu bay"}'::jsonb),

-- 4. Gourmet & Dramatic
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Gourmet & Dramatic', 'Ẩm thực & Kịch tính',
 'CREATE A NEW professional food photography {posterType} featuring {productDesc}. CONSTRUCT a gourmet scene with fresh ingredients, herbs, steam effects, and appetizing presentation. Apply dramatic {bgPrompt}. {lightPrompt}. {anglePrompt}. Magazine-quality food advertising. Full HD quality. {notes}',
 '{"description": "Professional food photography", "description_vi": "Food photography chuyên nghiệp"}'::jsonb),

-- 5. Miniature World
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Miniature World', 'Thế giới thu nhỏ',
 'CREATE A NEW MAGICAL {posterType} featuring {productDesc} as the giant centerpiece in a whimsical miniature 3D fantasy world. ADD tiny cute cartoon characters interacting with the product, magical particles, fantasy landscape. {bgPrompt}. {lightPrompt}. {anglePrompt}. Dreamlike atmosphere. Full HD quality. {notes}',
 '{"description": "3D fantasy landscape with cartoon characters", "description_vi": "Cảnh quan fantasy 3D với nhân vật hoạt hình"}'::jsonb),

-- 6. Swirl & Splash
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Swirl & Splash', 'Xoáy tròn & Splash',
 'CREATE A NEW ARTISTIC {posterType} featuring {productDesc}. GENERATE dramatic colorful liquid swirls spiraling around the product in circular motion, paint splashes, smoky effects. {bgPrompt}. {lightPrompt}. {anglePrompt}. Abstract artistic advertising style. Full HD quality. {notes}',
 '{"description": "Artistic liquid swirl wrapping around product", "description_vi": "Chất lỏng xoáy tròn bao quanh sản phẩm"}'::jsonb),

-- 7. Tech Futuristic
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Tech Futuristic', 'Công nghệ Tương lai',
 'CREATE A NEW FUTURISTIC {posterType} featuring {productDesc}. PLACE product in a high-tech environment with holographic UI elements, neon blue/purple lighting, digital grid patterns, floating particles, sleek reflective surfaces. {bgPrompt}. {lightPrompt}. {anglePrompt}. Sci-fi tech advertising style. Full HD quality. {notes}',
 '{"description": "Hologram effects, neon lights, cyber space", "description_vi": "Hiệu ứng hologram, ánh sáng neon, không gian cyber"}'::jsonb),

-- 8. Fashion Editorial
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Fashion Editorial', 'Thời trang Biên tập',
 'CREATE A NEW EDITORIAL {posterType} featuring {productDesc}. COMPOSE a sophisticated fashion photography scene with elegant minimalist background, dramatic shadows, artistic composition, premium fabric textures. {bgPrompt}. {lightPrompt}. {anglePrompt}. Vogue-style fashion advertising. Full HD quality. {notes}',
 '{"description": "High-end fashion magazine style", "description_vi": "Phong cách tạp chí thời trang cao cấp"}'::jsonb),

-- 9. Beauty Luxury
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Beauty Luxury', 'Mỹ phẩm Sang trọng',
 'CREATE A NEW LUXURIOUS {posterType} featuring {productDesc}. DESIGN an elegant beauty scene with rose gold accents, delicate rose petals, crystal-clear water droplets, soft silk fabric, marble surface, premium cosmetic presentation. {bgPrompt}. {lightPrompt}. {anglePrompt}. High-end beauty advertising. Full HD quality. {notes}',
 '{"description": "Gold accents, roses, pure water droplets", "description_vi": "Ánh kim, hoa hồng, giọt nước tinh khiết"}'::jsonb),

-- 10. Lifestyle Minimal
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Lifestyle Minimal', 'Lifestyle Tối giản',
 'CREATE A NEW MINIMALIST {posterType} featuring {productDesc}. COMPOSE a clean lifestyle scene with neutral tones, simple geometric shapes, negative space, natural materials (wood, cotton, ceramics), soft shadows. {bgPrompt}. {lightPrompt}. {anglePrompt}. Scandinavian minimal lifestyle advertising. Full HD quality. {notes}',
 '{"description": "Minimalist lifestyle, clean space", "description_vi": "Phong cách sống tối giản, không gian sạch sẽ"}'::jsonb),

-- 11. Sports Dynamic
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Sports Dynamic', 'Thể thao Năng động',
 'CREATE A NEW DYNAMIC {posterType} featuring {productDesc}. GENERATE an energetic sports scene with motion blur, speed lines, sweat droplets flying, athletic energy, bold contrasting colors, dramatic action freeze-frame. {bgPrompt}. {lightPrompt}. {anglePrompt}. Nike-style sports advertising. Full HD quality. {notes}',
 '{"description": "Powerful motion, energy, speed", "description_vi": "Chuyển động mạnh mẽ, năng lượng, tốc độ"}'::jsonb),

-- 12. Automotive Premium
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Automotive Premium', 'Ô tô Cao cấp',
 'CREATE A NEW PREMIUM {posterType} featuring {productDesc}. DESIGN a luxury automotive scene with perfect chrome reflections, sleek metallic surfaces, dramatic studio lighting, carbon fiber textures, glossy paint finish. {bgPrompt}. {lightPrompt}. {anglePrompt}. Mercedes-Benz style premium advertising. Full HD quality. {notes}',
 '{"description": "Glossy reflections, luxury metal", "description_vi": "Bóng loáng, phản chiếu, kim loại sang trọng"}'::jsonb),

-- 13. Eco Natural
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Eco Natural', 'Sinh thái Tự nhiên',
 'CREATE A NEW ECO-FRIENDLY {posterType} featuring {productDesc}. COMPOSE a natural sustainable scene with lush green plants, bamboo, recycled materials, earth tones, natural sunlight, organic textures, eco-conscious presentation. {bgPrompt}. {lightPrompt}. {anglePrompt}. Sustainable eco advertising. Full HD quality. {notes}',
 '{"description": "Green nature, sustainable, organic", "description_vi": "Thiên nhiên xanh, bền vững, hữu cơ"}'::jsonb),

-- 14. Urban Street
(1, (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1), 'style_preset',
 'Urban Street', 'Đường phố Đô thị',
 'CREATE A NEW URBAN {posterType} featuring {productDesc}. PLACE product in gritty street environment with graffiti wall, concrete textures, urban decay aesthetic, bold typography, street art elements, raw authentic vibe. {bgPrompt}. {lightPrompt}. {anglePrompt}. Supreme-style streetwear advertising. Full HD quality. {notes}',
 '{"description": "Graffiti, concrete, streetwear style", "description_vi": "Graffiti, bê tông, phong cách streetwear"}'::jsonb);

-- Verify
SELECT COUNT(*) as style_preset_count 
FROM prompt_templates 
WHERE tool_custom_id = 1 AND category = 'style_preset';
