-- Migration: Add 5 New Product Concepts (Fashion, Food, Tech, Jewelry, Furniture)
-- Description: Inserts new tool_custom records and their associated prompt_templates based on the approved design.

DO $$
DECLARE
    v_tool_type_id INTEGER;
    v_cat_id INTEGER;
    v_fashion_id INTEGER;
    v_food_id INTEGER;
    v_tech_id INTEGER;
    v_jewelry_id INTEGER;
    v_furniture_id INTEGER;
BEGIN
    -- 1. Get Tool Type ID (Assuming 'poster-creator' or ID 1)
    SELECT id INTO v_tool_type_id FROM tool_types WHERE code = 'poster-creator' LIMIT 1;
    IF v_tool_type_id IS NULL THEN
        SELECT id INTO v_tool_type_id FROM tool_types ORDER BY id ASC LIMIT 1; -- Fallback to first tool type
    END IF;

    -- Get Category ID if exists (optional), else NULL
    SELECT id INTO v_cat_id FROM cate_tool_custom WHERE slug = 'marketing' LIMIT 1;

    -- =================================================================================================
    -- 1. FASHION & FOOTWEAR
    -- =================================================================================================
    INSERT INTO tool_custom (tool_type_id, category_id, name, slug, description, domain_prompts, ui_config, status, sort_order)
    VALUES (
        v_tool_type_id, v_cat_id, 
        'Thời Trang & Giày Dép', 'fashion-footwear-poster', 
        'Tạo poster thời trang, giày sneaker, túi xách phong cách', 
        'High-end commercial fashion photography, urban lifestyle aesthetic, dynamic composition, focus on texture and material quality (leather, fabric, stitching), professional studio lighting or natural street lighting, 8k resolution, trendy and modern vibe.',
        '{"aspect_ratios": ["1:1", "9:16", "4:5", "16:9"], "default_styles": ["Urban Streetwear", "Luxury Studio"]}'::jsonb,
        'active', 10
    ) RETURNING id INTO v_fashion_id;

    -- Inserts Prompts for Fashion
    INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata) VALUES
    (v_fashion_id, 'style_preset', 'Urban Streetwear', 'Đường phố năng động', 
    'floating sneaker, dynamic action shot, blurred urban city street background with neon lights, wet asphalt reflections, graffiti art elements, high contrast street lighting, energetic motion blur, hypebeast aesthetic.', '{}'::jsonb),
    
    (v_fashion_id, 'style_preset', 'Luxury Studio', 'Studio sang trọng', 
    'product placed on a pristine white geometric podium, soft shadows, clean minimal background, high-key lighting, fashion magazine editorial style, sharp details, elegant and sophisticated atmosphere.', '{}'::jsonb),
    
    (v_fashion_id, 'style_preset', 'Abstract Pop-art', 'Nghệ thuật màu sắc', 
    'product surrounded by colorful floating geometric shapes, vibrant pastel background, pop-art style, creative studio lighting, playful and trendy composition, memphis design elements.', '{}'::jsonb);


    -- =================================================================================================
    -- 2. FOOD & CUISINE
    -- =================================================================================================
    INSERT INTO tool_custom (tool_type_id, category_id, name, slug, description, domain_prompts, ui_config, status, sort_order)
    VALUES (
        v_tool_type_id, v_cat_id, 
        'Đồ Ăn & Ẩm Thực', 'food-cuisine-poster', 
        'Tạo poster quảng cáo món ăn ngon mắt, hấp dẫn', 
        'Professional food photography, appetizing and delicious aesthetic, focus on freshness and texture, macro details, mouth-watering presentation, authentic ingredients surroundings, warm and inviting atmosphere, culinary art style.',
        '{"aspect_ratios": ["1:1", "4:5", "16:9"], "default_styles": ["Rustic Wooden Table"]}'::jsonb,
        'active', 20
    ) RETURNING id INTO v_food_id;

    -- Inserts Prompts for Food
    INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata) VALUES
    (v_food_id, 'style_preset', 'Rustic Wooden Table', 'Bàn gỗ mộc mạc', 
    'food served on a rustic dark wooden table, scattered fresh herbs and spices, soft natural side lighting, steam rising from the hot food, shallow depth of field (bokeh background), cozy restaurant vibe.', '{}'::jsonb),
    
    (v_food_id, 'style_preset', 'Fresh & Splash', 'Tươi mát bùng nổ', 
    'flying food ingredients, water splashes and droplets, dynamic freeze-motion shot, bright background, fresh vegetables and fruits floating around, high speed photography, energetic and healthy feel.', '{}'::jsonb),
    
    (v_food_id, 'style_preset', 'Dark Moody Dining', 'Sang trọng tối màu', 
    'food on black slate plate, dramatic chiaroscuro lighting, deep shadows, rich colors, elegant fine dining atmosphere, cinematic food shot, garnished with gold leaf or microgreens.', '{}'::jsonb);


    -- =================================================================================================
    -- 3. TECH & GADGETS
    -- =================================================================================================
    INSERT INTO tool_custom (tool_type_id, category_id, name, slug, description, domain_prompts, ui_config, status, sort_order)
    VALUES (
        v_tool_type_id, v_cat_id, 
        'Công Nghệ & Gaming', 'tech-gadgets-poster', 
        'Poster quảng cáo đồ công nghệ, gaming gear, điện thoại', 
        'Futuristic tech product photography, sleek and modern industrial design, emphasis on material finish (matte, glossy, metallic), sharp focus, high-tech environment, precision engineering aesthetic, 8k render quality.',
        '{"aspect_ratios": ["16:9", "1:1", "9:16"], "default_styles": ["Cyberpunk Neon"]}'::jsonb,
        'active', 30
    ) RETURNING id INTO v_tech_id;

    -- Inserts Prompts for Tech
    INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata) VALUES
    (v_tech_id, 'style_preset', 'Cyberpunk Neon', 'Thành phố tương lai', 
    'product in a cyberpunk city setting, glowing neon blue and purple lights, wet reflective surfaces, futuristic tech interface elements in background, cinematic night atmosphere, sci-fi vibe.', '{}'::jsonb),
    
    (v_tech_id, 'style_preset', 'Clean Minimalist Desk', 'Bàn làm việc tối giản', 
    'product on a clean white modern desk setup, surrounded by macbook and minimal stationery, soft daylight from window, apple style aesthetic, bright and organized workspace, productivity vibe.', '{}'::jsonb),
    
    (v_tech_id, 'style_preset', '3D Abstract Flow', 'Trừu tượng 3D', 
    'product floating amidst abstract 3D liquid metal forms and glass shards, ray-tracing reflections, studio lighting with rim light, surreal tech art composition, premium material showcase.', '{}'::jsonb);


    -- =================================================================================================
    -- 4. JEWELRY & LUXURY
    -- =================================================================================================
    INSERT INTO tool_custom (tool_type_id, category_id, name, slug, description, domain_prompts, ui_config, status, sort_order)
    VALUES (
        v_tool_type_id, v_cat_id, 
        'Trang Sức & Đồng Hồ', 'jewelry-luxury-poster', 
        'Hình ảnh sang trọng cho trang sức, đồng hồ, phụ kiện cao cấp', 
        'High-end luxury jewelry photography, macro lens focus, sparkling light reflections, emphasis on brilliance and clarity of gems/metals, sophisticated and elegant composition, premium brand aesthetic.',
        '{"aspect_ratios": ["1:1", "4:5"], "default_styles": ["Silk & Satin"]}'::jsonb,
        'active', 40
    ) RETURNING id INTO v_jewelry_id;

    -- Inserts Prompts for Jewelry
    INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata) VALUES
    (v_jewelry_id, 'style_preset', 'Silk & Satin', 'Lụa mềm mại', 
    'jewelry resting on draped champagne-colored silk fabric, soft folds and curves, warm golden lighting, elegant and romantic atmosphere, soft focus background, premium fashion accessory shot.', '{}'::jsonb),
    
    (v_jewelry_id, 'style_preset', 'Black Reflection', 'Đen huyền bí', 
    'product on polished black granite surface, sharp mirror reflection, dramatic rim lighting highlighting the edges, starburst sparkles on gems, minimal dark background, masculine luxury.', '{}'::jsonb),
    
    (v_jewelry_id, 'style_preset', 'Nature & Stone', 'Thiên nhiên thô mộc', 
    'jewelry placed on natural raw textured stone or rock, surrounded by moss or dried flowers, contrast between refined luxury and raw nature, organic lighting, earthy tones.', '{}'::jsonb);


    -- =================================================================================================
    -- 5. FURNITURE & HOME
    -- =================================================================================================
    INSERT INTO tool_custom (tool_type_id, category_id, name, slug, description, domain_prompts, ui_config, status, sort_order)
    VALUES (
        v_tool_type_id, v_cat_id, 
        'Nội Thất & Decor', 'furniture-living-poster', 
        'Poster quảng cáo nội thất, đồ decor và không gian sống', 
        'Interior design photography, architectural digest style, cozy and livable atmosphere, perfectly balanced composition, natural lighting, focus on lifestyle and comfort, high dynamic range.',
        '{"aspect_ratios": ["4:5", "16:9", "1:1"], "default_styles": ["Scandinavian Sunlight"]}'::jsonb,
        'active', 50
    ) RETURNING id INTO v_furniture_id;

    -- Inserts Prompts for Furniture
    INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata) VALUES
    (v_furniture_id, 'style_preset', 'Scandinavian Sunlight', 'Bắc Âu nắng sớm', 
    'product in a bright scandinavian living room, white walls and light wood floor, soft morning sunlight streaming through sheer curtains, plants and cozy textiles, airy and peaceful vibe.', '{}'::jsonb),
    
    (v_furniture_id, 'style_preset', 'Cozy Evening', 'Buổi tối ấm cúng', 
    'product in a dimly lit cozy corner, warm string lights and candles in background, bokeh effect, warm color temperature, hygge atmosphere, comfortable and relaxing mood.', '{}'::jsonb),
    
    (v_furniture_id, 'style_preset', 'Industrial Loft', 'Gác mái công nghiệp', 
    'product in a modern industrial loft apartment, brick walls and concrete floor, large metal windows, stylish leather furniture, dramatic daylight, bold and edgy interior style.', '{}'::jsonb);

END $$;
