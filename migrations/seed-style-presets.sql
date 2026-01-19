-- ==========================================
-- SEED STYLE PRESETS FOR MILK TEA POSTER
-- ==========================================
-- Migrate hardcoded STYLE_PRESETS to database

-- Insert 14 style presets for milk-tea-poster tool
INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT 
  tc.id as tool_custom_id,
  tc.tool_type_id,
  'style_preset' as category,
  vals.name,
  vals.name_vi,
  vals.prompt_text,
  jsonb_build_object('description', vals.description, 'description_vi', vals.description_vi)
FROM tool_custom tc
CROSS JOIN (
  VALUES
    -- 1. Studio Professional
    ('Studio Professional', 'Studio Chuyên Nghiệp', 
     'Serious professional studio photography', 'Chụp ảnh studio nghiêm túc, chuyên nghiệp',
     'CREATE A NEW {posterType} featuring {productDesc}. EXTRACT the product and place it in a completely NEW professional studio environment. Apply: {bgPrompt}. Use {lightPrompt}. Shoot at {anglePrompt}. Add reflections, shadows, and professional retouching. Full HD quality. {notes}'),
    
    -- 2. Organic & Elegant
    ('Organic & Elegant', 'Hữu cơ & Thanh lịch',
     'Product with natural leaves and flowers', 'Sản phẩm với lá cây, hoa tươi xung quanh',
     'CREATE A NEW {posterType} featuring {productDesc}. EXTRACT the product and PLACE it in an elegant organic setting with fresh green leaves, colorful flowers, and natural elements surrounding it. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. Full HD quality. {notes}'),
    
    -- 3. Dynamic & Fresh
    ('Dynamic & Fresh', 'Động lực & Tươi mới',
     'Water splash, flying ingredients', 'Splash nước, nguyên liệu bay',
     'CREATE A NEW DYNAMIC {posterType} featuring {productDesc}. GENERATE an exciting scene with dramatic liquid splash, water droplets frozen in mid-air, ice cubes flying, and dynamic motion effects. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. High-speed photography look. Full HD quality. {notes}'),
    
    -- 4. Gourmet & Dramatic
    ('Gourmet & Dramatic', 'Ẩm thực & Kịch tính',
     'Professional food photography', 'Food photography chuyên nghiệp',
     'CREATE A NEW professional food photography {posterType} featuring {productDesc}. CONSTRUCT a gourmet scene with fresh ingredients, herbs, steam effects, and appetizing presentation. Apply dramatic {bgPrompt}. {lightPrompt}. {anglePrompt}. Magazine-quality food advertising. Full HD quality. {notes}'),
    
    -- 5. Miniature World
    ('Miniature World', 'Thế giới thu nhỏ',
     '3D fantasy landscape with cartoon characters', 'Cảnh quan fantasy 3D với nhân vật hoạt hình',
     'CREATE A NEW MAGICAL {posterType} featuring {productDesc} as the giant centerpiece in a whimsical miniature 3D fantasy world. ADD tiny cute cartoon characters interacting with the product, magical particles, fantasy landscape. {bgPrompt}. {lightPrompt}. {anglePrompt}. Dreamlike atmosphere. Full HD quality. {notes}'),
    
    -- 6. Swirl & Splash
    ('Swirl & Splash', 'Xoáy tròn & Splash',
     'Artistic liquid swirl wrapping around product', 'Chất lỏng xoáy tròn bao quanh sản phẩm',
     'CREATE A NEW ARTISTIC {posterType} featuring {productDesc}. GENERATE dramatic colorful liquid swirls spiraling around the product in circular motion, paint splashes, smoky effects. {bgPrompt}. {lightPrompt}. {anglePrompt}. Abstract artistic advertising style. Full HD quality. {notes}'),
    
    -- 7. Tech Futuristic
    ('Tech Futuristic', 'Công nghệ Tương lai',
     'Hologram effects, neon lights, cyber space', 'Hiệu ứng hologram, ánh sáng neon, không gian cyber',
     'CREATE A NEW FUTURISTIC {posterType} featuring {productDesc}. PLACE product in a high-tech environment with holographic UI elements, neon blue/purple lighting, digital grid patterns, floating particles, sleek reflective surfaces. {bgPrompt}. {lightPrompt}. {anglePrompt}. Sci-fi tech advertising style. Full HD quality. {notes}'),
    
    -- 8. Fashion Editorial
    ('Fashion Editorial', 'Thời trang Biên tập',
     'High-end fashion magazine style', 'Phong cách tạp chí thời trang cao cấp',
     'CREATE A NEW EDITORIAL {posterType} featuring {productDesc}. COMPOSE a sophisticated fashion photography scene with elegant minimalist background, dramatic shadows, artistic composition, premium fabric textures. {bgPrompt}. {lightPrompt}. {anglePrompt}. Vogue-style fashion advertising. Full HD quality. {notes}'),
    
    -- 9. Beauty Luxury
    ('Beauty Luxury', 'Mỹ phẩm Sang trọng',
     'Gold accents, roses, pure water droplets', 'Ánh kim, hoa hồng, giọt nước tinh khiết',
     'CREATE A NEW LUXURIOUS {posterType} featuring {productDesc}. DESIGN an elegant beauty scene with rose gold accents, delicate rose petals, crystal-clear water droplets, soft silk fabric, marble surface, premium cosmetic presentation. {bgPrompt}. {lightPrompt}. {anglePrompt}. High-end beauty advertising. Full HD quality. {notes}'),
    
    -- 10. Lifestyle Minimal
    ('Lifestyle Minimal', 'Lifestyle Tối giản',
     'Minimalist lifestyle, clean space', 'Phong cách sống tối giản, không gian sạch sẽ',
     'CREATE A NEW MINIMALIST {posterType} featuring {productDesc}. COMPOSE a clean lifestyle scene with neutral tones, simple geometric shapes, negative space, natural materials (wood, cotton, ceramics), soft shadows. {bgPrompt}. {lightPrompt}. {anglePrompt}. Scandinavian minimal lifestyle advertising. Full HD quality. {notes}'),
    
    -- 11. Sports Dynamic
    ('Sports Dynamic', 'Thể thao Năng động',
     'Powerful motion, energy, speed', 'Chuyển động mạnh mẽ, năng lượng, tốc độ',
     'CREATE A NEW DYNAMIC {posterType} featuring {productDesc}. GENERATE an energetic sports scene with motion blur, speed lines, sweat droplets flying, athletic energy, bold contrasting colors, dramatic action freeze-frame. {bgPrompt}. {lightPrompt}. {anglePrompt}. Nike-style sports advertising. Full HD quality. {notes}'),
    
    -- 12. Automotive Premium
    ('Automotive Premium', 'Ô tô Cao cấp',
     'Glossy reflections, luxury metal', 'Bóng loáng, phản chiếu, kim loại sang trọng',
     'CREATE A NEW PREMIUM {posterType} featuring {productDesc}. DESIGN a luxury automotive scene with perfect chrome reflections, sleek metallic surfaces, dramatic studio lighting, carbon fiber textures, glossy paint finish. {bgPrompt}. {lightPrompt}. {anglePrompt}. Mercedes-Benz style premium advertising. Full HD quality. {notes}'),
    
    -- 13. Eco Natural
    ('Eco Natural', 'Sinh thái Tự nhiên',
     'Green nature, sustainable, organic', 'Thiên nhiên xanh, bền vững, hữu cơ',
     'CREATE A NEW ECO-FRIENDLY {posterType} featuring {productDesc}. COMPOSE a natural sustainable scene with lush green plants, bamboo, recycled materials, earth tones, natural sunlight, organic textures, eco-conscious presentation. {bgPrompt}. {lightPrompt}. {anglePrompt}. Sustainable eco advertising. Full HD quality. {notes}'),
    
    -- 14. Urban Street
    ('Urban Street', 'Đường phố Đô thị',
     'Graffiti, concrete, streetwear style', 'Graffiti, bê tông, phong cách streetwear',
     'CREATE A NEW URBAN {posterType} featuring {productDesc}. PLACE product in gritty street environment with graffiti wall, concrete textures, urban decay aesthetic, bold typography, street art elements, raw authentic vibe. {bgPrompt}. {lightPrompt}. {anglePrompt}. Supreme-style streetwear advertising. Full HD quality. {notes}')
) AS vals(name, name_vi, description, description_vi, prompt_text)
WHERE tc.slug = 'milk-tea-poster'
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as inserted_presets 
FROM prompt_templates pt
JOIN tool_custom tc ON pt.tool_custom_id = tc.id
WHERE tc.slug = 'milk-tea-poster' AND pt.category = 'style_preset';
