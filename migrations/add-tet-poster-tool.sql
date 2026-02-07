-- TẾT POSTER TOOL - Thiết kế poster ngày Tết
-- Sử dụng chung template MilkTeaPosterGenerator với config riêng cho Tết

-- Insert Tết Poster Tool
INSERT INTO tool_custom (
    tool_type_id,
    category_id,
    name,
    name_vi,
    slug,
    description,
    description_vi,
    preview_image_url,
    domain_prompts,
    ui_config,
    status,
    sort_order,
    metadata
) VALUES (
    (SELECT id FROM tool_types WHERE code = 'poster' LIMIT 1),
    (SELECT id FROM cate_tool_custom WHERE slug = 'poster' LIMIT 1),
    'Tết Poster Studio',
    'Thiết Kế Poster Tết',
    'tet-poster',
    'Create stunning Vietnamese Lunar New Year (Tết) posters with traditional backgrounds: peach blossoms, apricot flowers, lucky money envelopes, and festive fireworks. Lucky red and gold color schemes for a prosperous new year.',
    'Tạo poster Tết Nguyên Đán với bối cảnh truyền thống: hoa đào, hoa mai, lì xì đỏ, pháo hoa. Màu sắc may mắn đỏ - vàng cho năm mới thịnh vượng.',
    '/assets/studios/tet-poster-preview.jpg',
    '{
        "context": "Vietnamese Lunar New Year (Tết Nguyên Đán) aesthetics: Traditional Vietnamese Tet celebration with dominant RED (may mắn) and GOLD (prosperity) colors. Include peach blossoms (hoa đào - North) or apricot blossoms (hoa mai - South), lucky money envelopes (lì xì), lanterns, and festive decorations. Warm, familial, prosperous atmosphere.",
        "backgrounds": {
            "Hoa đào (Miền Bắc)": "traditional Vietnamese Tet background with blooming pink peach blossoms (hoa đào), red and gold decorations, traditional Northern Vietnamese Tet atmosphere",
            "Hoa mai (Miền Nam)": "traditional Vietnamese Tet background with bright yellow apricot blossoms (hoa mai), Southern Vietnamese Tet celebration setting",
            "Mâm ngũ quả": "traditional Vietnamese Tet offering tray (mâm ngũ quả) with colorful fruits, red tablecloth, ancestral worship setting",
            "Pháo hoa Tết": "Vietnamese New Year fireworks celebration at night, sparkling lights, festive atmosphere, red and gold sky",
            "Ông Đồ viết chữ": "traditional Vietnamese calligraphy scene (ông đồ), red paper, brushes, ink, spring festival atmosphere",
            "Lì xì đỏ": "traditional Vietnamese lucky money envelopes (lì xì) in red with gold patterns, prosperity symbols",
            "Đèn lồng Tết": "traditional Vietnamese Tet lanterns in red and gold, hanging decorations, warm festive lighting",
            "Cây nêu ngày Tết": "traditional Vietnamese Tet bamboo pole (cây nêu) with decorations, village entrance, rural Tet setting",
            "Chợ hoa Tết": "bustling Vietnamese Tet flower market, colorful blooms, festive crowd, pre-Tet excitement",
            "Bánh chưng xanh": "traditional Vietnamese square sticky rice cake (bánh chưng) with green banana leaf, Tet food setting"
        },
        "lighting": {
            "Ánh sáng vàng may mắn": "warm golden lighting symbolizing prosperity and luck, soft glow",
            "Đèn lồng ấm áp": "warm lantern lighting, cozy festive atmosphere, soft orange glow",
            "Ánh nắng xuân": "bright spring sunlight, fresh morning light of Lunar New Year",
            "Pháo hoa lung linh": "sparkling firework lighting, colorful reflections, night celebration",
            "Nến truyền thống": "traditional candlelight, warm flickering flames, intimate setting"
        },
        "angles": {
            "Góc chụp Tết truyền thống": "traditional Tet photography angle, respectful and festive",
            "Góc nhìn từ trên": "overhead flat-lay with Tet decorations, symmetrical arrangement",
            "Góc 45 độ sang trọng": "elegant 45-degree angle showcasing product with Tet background",
            "Góc cận cảnh": "close-up macro shot highlighting product details with blurred Tet background"
        },
        "posterTypes": {
            "Poster Tết quảng cáo": "Vietnamese Lunar New Year promotional poster, festive advertising",
            "Banner chúc mừng năm mới": "Happy New Year greeting banner, Chúc Mừng Năm Mới theme",
            "Poster khuyến mãi Tết": "Tet holiday sale promotion, special offers, festive discount",
            "Thiệp chúc Tết": "traditional Vietnamese Tet greeting card design, respectful and elegant",
            "Poster sự kiện đầu năm": "New Year event poster, opening ceremony, fortune celebration"
        }
    }'::jsonb,
    '{
        "component": "MilkTeaPosterGenerator",
        "title": "Thiết Kế Poster Tết",
        "subtitle": "Tạo poster Tết Nguyên Đán với AI",
        "theme": {
            "primaryColor": "#D32F2F",
            "secondaryColor": "#FBC02D",
            "gradient": "from-red-600 via-yellow-500 to-red-600"
        }
    }'::jsonb,
    'active',
    3,
    '{
        "icon": "🧧",
        "tags": ["tet", "lunar-new-year", "vietnamese", "poster", "festival"],
        "featured": true
    }'::jsonb
);

-- Insert Style Presets for Tết Poster
INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Traditional Red Gold',
    'Truyền thống Đỏ - Vàng',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Use TRADITIONAL RED AND GOLD color scheme (đỏ và vàng) - the luckiest colors for Tet. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Include traditional Tet symbols like lucky money envelopes, blooming flowers, or festive decorations. Rich, warm, prosperous atmosphere. Professional commercial photography quality. {notes}',
    '{"icon": "🧧", "iconBg": "#D32F2F", "description": "Màu sắc Tết truyền thống với đỏ và vàng chủ đạo", "description_vi": "Traditional red and gold Tet colors"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Peach Blossom',
    'Hoa Đào Xuân',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Feature BEAUTIFUL PINK PEACH BLOSSOMS (hoa đào) - the iconic Tet flower of Northern Vietnam. Soft pink petals with traditional red and gold decorations. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Fresh, elegant, spring atmosphere. Professional commercial photography. {notes}',
    '{"icon": "🌸", "iconBg": "#F48FB1", "description": "Bối cảnh hoa đào nở rộ đặc trưng miền Bắc", "description_vi": "Northern Vietnam peach blossom theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Apricot Blossom',
    'Hoa Mai Vàng',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Feature BRIGHT YELLOW APRICOT BLOSSOMS (hoa mai) - the iconic Tet flower of Southern Vietnam. Vibrant yellow flowers with green leaves. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Cheerful, sunny, prosperous atmosphere. Professional commercial photography. {notes}',
    '{"icon": "🌼", "iconBg": "#FBC02D", "description": "Bối cảnh hoa mai vàng rực rỡ đặc trưng miền Nam", "description_vi": "Southern Vietnam apricot blossom theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Fireworks',
    'Pháo Hoa Giao Thừa',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Dazzling FIREWORKS CELEBRATION background, sparkling lights in red, gold, and colorful bursts. Night sky celebration atmosphere. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Exciting, festive, grand celebration mood. Professional commercial photography. {notes}',
    '{"icon": "🎆", "iconBg": "#7B1FA2", "description": "Không khí pháo hoa rực rỡ đêm giao thừa", "description_vi": "New Year Eve fireworks celebration"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Lucky Money',
    'Lì Xì May Mắn',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Feature TRADITIONAL RED LUCKY MONEY ENVELOPES (lì xì) with gold patterns and Chinese/Vietnamese characters for luck and prosperity. Symbol of wealth and good fortune. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Auspicious, prosperous, generous atmosphere. Professional commercial photography. {notes}',
    '{"icon": "🧧", "iconBg": "#C62828", "description": "Bối cảnh lì xì đỏ, tài lộc, may mắn", "description_vi": "Lucky money red envelope theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Family Feast',
    'Mâm Cơm Tết',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Traditional TET FAMILY GATHERING atmosphere with ancestral worship elements, traditional foods, family warmth. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Warm, familial, respectful, reunion atmosphere. Professional commercial photography. {notes}',
    '{"icon": "🥢", "iconBg": "#5D4037", "description": "Không khí sum họp gia đình, mâm cơm ngày Tết", "description_vi": "Family reunion feast theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Premium Gift Box',
    'Hộp Quà Cao Cấp',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. LUXURIOUS PREMIUM GIFT BOX presentation on vibrant red background. High-end packaging with gold foil details, elegant ribbon, surrounded by traditional Tet elements like peach blossoms, tea cups, and festive decorations. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Sophisticated, elegant, premium quality atmosphere. Studio product photography with perfect lighting. {notes}',
    '{"icon": "🎁", "iconBg": "#B71C1C", "description": "Hộp quà Tết cao cấp với bao bì sang trọng", "description_vi": "Premium luxury gift box presentation"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Flat Lay Style',
    'Phong Cách Flat Lay',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. OVERHEAD FLAT LAY composition on solid colored background (red, pink, or peach). Symmetrical arrangement with {productDesc} as center piece, surrounded by Tet decorations: lucky envelopes, plum blossoms branches, traditional ornaments, watermelon slices, and festive props. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot from directly above. Clean, modern, Instagram-worthy aesthetic. Professional flat lay photography. {notes}',
    '{"icon": "📐", "iconBg": "#E91E63", "description": "Bố cục phẳng từ trên xuống, phong cách hiện đại", "description_vi": "Modern overhead flat lay composition"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Minimalist Modern',
    'Tối Giản Hiện Đại',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. MINIMALIST MODERN DESIGN with clean solid background in pastel pink, peach, or soft red. Simple composition with {productDesc} and minimal Tet elements: single plum blossom branch, one or two lucky envelopes, subtle gold accents. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Clean, contemporary, elegant simplicity. Soft shadows and gentle lighting. Professional minimalist product photography. {notes}',
    '{"icon": "✨", "iconBg": "#F8BBD0", "description": "Thiết kế tối giản, hiện đại với màu pastel", "description_vi": "Clean minimalist modern aesthetic"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Product Photography',
    'Chụp Sản Phẩm Chuyên Nghiệp',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. PROFESSIONAL PRODUCT PHOTOGRAPHY setup with {productDesc} as hero product. Vibrant red or gradient red-to-orange background. Complementary Tet props: decorative fan, traditional patterns, subtle floral elements. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Commercial advertising quality with perfect focus, depth of field, and studio lighting. Premium e-commerce product shot. {notes}',
    '{"icon": "📸", "iconBg": "#FF5722", "description": "Chụp sản phẩm chuyên nghiệp phong cách quảng cáo", "description_vi": "Professional commercial product photography"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Watermelon & Lucky Symbols',
    'Dưa Hấu & Biểu Tượng May Mắn',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Playful composition with WATERMELON SLICES (symbol of luck and prosperity), lucky red envelopes with cute illustrations, traditional knot decorations, and festive elements on pastel pink or peach background. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Fun, cheerful, youthful Tet vibe. Bright and vibrant colors. Modern lifestyle product photography. {notes}',
    '{"icon": "🍉", "iconBg": "#4CAF50", "description": "Phong cách vui nhộn với dưa hấu và biểu tượng may mắn", "description_vi": "Playful watermelon and lucky symbols theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Elegant Tea Set',
    'Bộ Trà Sang Trọng',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. ELEGANT TEA CEREMONY setup with traditional Vietnamese/Chinese tea set, delicate cups, teapot on red background. Plum blossom branches, traditional patterns, and refined Tet decorations. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Sophisticated, cultural, refined atmosphere. Soft natural lighting. High-end lifestyle product photography. {notes}',
    '{"icon": "🍵", "iconBg": "#8D6E63", "description": "Bối cảnh trà đạo sang trọng, văn hóa truyền thống", "description_vi": "Elegant traditional tea ceremony theme"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'style_preset',
    'Traditional Snacks',
    'Bánh Kẹo Truyền Thống',
    'CREATE A VIETNAMESE TET (LUNAR NEW YEAR) {posterType} featuring {productDesc}. Traditional TET SNACKS AND TREATS presentation: candied fruits, traditional cookies, decorative boxes on vibrant red or warm orange background. Festive packaging with gold patterns, traditional motifs. Background: {bgPrompt}. Lighting: {lightPrompt}. Shot at {anglePrompt}. Warm, nostalgic, appetizing atmosphere. Food photography with mouth-watering appeal. {notes}',
    '{"icon": "🥮", "iconBg": "#FF6F00", "description": "Bánh kẹo Tết truyền thống, mứt ngọt", "description_vi": "Traditional Tet snacks and treats"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

-- Add sample prompts/inspirations
INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'inspiration',
    'Premium Gift Box',
    'Hộp Quà Cao Cấp',
    'Create a luxurious Tet gift box poster with traditional red and gold packaging, surrounded by peach blossoms and lucky decorations',
    '{"image_url": "/assets/inspirations/tet-gift-box.jpg"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

INSERT INTO prompt_templates (tool_custom_id, tool_type_id, category, name, name_vi, prompt_text, metadata)
SELECT
    tc.id,
    tc.tool_type_id,
    'inspiration',
    'Wine Celebration',
    'Rượu Vang Tết',
    'Elegant wine bottle poster for Tet celebration with red tablecloth, gold accents, and festive fireworks background',
    '{"image_url": "/assets/inspirations/tet-wine.jpg"}'::jsonb
FROM tool_custom tc WHERE tc.slug = 'tet-poster';

COMMIT;
