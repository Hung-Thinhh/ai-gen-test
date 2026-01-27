export const MOCK_APPS = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        slug: 'talking-avatar',
        name: 'Talking Avatar (Lip Sync)',
        description: 'Tạo video nhân vật nói chuyện khớp với file ghi âm.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "kling/ai-avatar-standard" },
        input_schema: [
            { id: "image_url", type: "image", label: "Ảnh Nhân Vật", required: true },
            { id: "audio_url", type: "audio", label: "File Ghi Âm", required: true }
        ],
        badge: 'HOT'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        slug: 'cinematic-text-to-video',
        name: 'Cinematic Text-to-Video',
        description: 'Tạo video điện ảnh từ mô tả văn bản. Chất lượng cao.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo3_fast", aspect_ratio: "16:9" },
        input_schema: [
            { id: "prompt", type: "textarea", label: "Mô tả video", placeholder: "A futuristic city...", required: true }
        ],
        prompt_template: "{{prompt}}",
        badge: 'NEW'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        slug: 'image-animation',
        name: 'Image Animation',
        description: 'Tạo chuyển động cho hình ảnh tĩnh.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo3_fast" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Tĩnh", required: true },
            { id: "prompt", type: "textarea", label: "Mô tả chuyển động", placeholder: "Wind blowing, camera zoom in..." }
        ],
        prompt_template: "{{prompt}}"
    },
    {
        id: '44444444-4444-4444-4444-444444444444',
        slug: 'premium-zen-tvc',
        name: 'Premium Zen TVC',
        description: 'Quảng cáo cao cấp, tĩnh lặng. Phù hợp: trà, rượu, nước hoa, trang sức.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo/v3" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: Trà Ô Long Premium", required: true }
        ],
        prompt_template: "Professional luxury commercial for {{product_name}}. Slow smooth camera dolly movement, soft natural lighting with warm golden tones, steam rising elegantly, minimalist zen background. Premium packaging showcase, mindful peaceful atmosphere. No voiceover, natural ambient sounds only. 4K cinematic quality.",
        badge: 'HOT'
    },
    {
        id: '55555555-5555-5555-5555-555555555555',
        slug: 'fresh-nature-tvc',
        name: 'Fresh Nature TVC',
        description: 'Tươi mát, năng động. Phù hợp: nước giải khát, thực phẩm organic, mỹ phẩm thiên nhiên.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo/v3" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: Nước Ép Táo Xanh", required: true }
        ],
        prompt_template: "Vibrant commercial for {{product_name}}. Dynamic camera movements through fresh green nature, morning dew on leaves, water droplets sparkling in bright daylight. Natural ingredients floating, energetic healthy vibe. Bright saturated green tones, outdoor fresh atmosphere. No voiceover, natural ambient sounds only. 4K quality.",
        badge: 'NEW'
    },
    {
        id: '66666666-6666-6666-6666-666666666666',
        slug: 'modern-lifestyle-tvc',
        name: 'Modern Lifestyle TVC',
        description: 'Hiện đại, trendy. Phù hợp: tech, fashion, cafe, startup products.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo/v3" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: SmartWatch X Pro", required: true }
        ],
        prompt_template: "Cool modern commercial for {{product_name}}. Quick dynamic cuts, urban contemporary setting, high contrast dramatic lighting. Sleek product angles, Instagram-worthy aesthetic, vibrant neon accents. Young lifestyle vibe, trendy music video style. No voiceover, natural ambient sounds only. 4K cinematic.",
        badge: 'NEW'
    },
    {
        id: '77777777-7777-7777-7777-777777777777',
        slug: 'soft-minimalist-tvc',
        name: 'Soft Minimalist TVC',
        description: 'Nhẹ nhàng, tối giản. Phù hợp: mỹ phẩm, nước hoa, sản phẩm cho bé, trang sức tinh tế.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo3_fast", aspect_ratio: "16:9" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: Nước Hoa Lavender", required: true }
        ],
        prompt_template: "Gentle minimalist commercial for {{product_name}}. Soft pastel colors, delicate floating movements, white clean background. Subtle lighting with dreamy glow, powder and flower petals gently falling. Calm peaceful atmosphere, refined elegant presentation. No voiceover, natural ambient sounds only. 4K quality.",
        badge: 'NEW'
    },
    {
        id: '88888888-8888-8888-8888-888888888888',
        slug: 'clean-pure-tvc',
        name: 'Clean & Pure TVC',
        description: 'Trong sáng, thuần khiết. Phù hợp: sữa, nước tinh khiết, skincare, organic baby products.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo3_fast", aspect_ratio: "16:9" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: Sữa Tươi Organic", required: true }
        ],
        prompt_template: "Pure clean commercial for {{product_name}}. Crystal clear lighting, white pristine environment, gentle milk or water splash. Soft focus bokeh, natural purity aesthetic. Fresh morning light, innocent gentle vibe. Laboratory clean atmosphere. No voiceover, natural ambient sounds only. 4K cinematic.",
        badge: 'NEW'
    },
    {
        id: '99999999-9999-9999-9999-999999999999',
        slug: 'product-explosion-tvc',
        name: 'Product Explosion TVC',
        description: 'Hiệu ứng sản phẩm nổ tung, nguyên liệu bay trong không khí. Phù hợp: thực phẩm, đồ uống, mỹ phẩm.',
        thumbnail_url: 'https://res.cloudinary.com/dmxmzannb/video/upload/v1769417333/Firstperson_view_of_1080p_202601261543_wqyu7o.mp4',
        model_config: { model: "veo3_fast", aspect_ratio: "16:9" },
        input_schema: [
            { id: "image_urls", type: "image", label: "Ảnh Sản Phẩm", required: true },
            { id: "product_name", type: "text", label: "Tên Sản Phẩm", placeholder: "VD: Nutella, Oat Milk", required: true }
        ],
        prompt_template: "Photorealistic cinematic commercial for {{product_name}}. Sunlit kitchen setting with morning light streaming through curtains. Product jar/bottle begins vibrating, then bursts open—releasing explosion of swirling ingredients, components flying and orbiting mid-air in slow motion. Elements assemble into perfect product showcase on wooden table. Slow orbital camera movement from low angle to overhead reveal. Ingredients catch golden sunlight, creating dreamy glow. Gravity-defying product assembly, particles and droplets suspended beautifully. Final shot: beautifully arranged product with steam and glow. No voiceover, natural ambient sounds only. 16:9 cinematic, high detail, no text.",
        badge: 'HOT'
    }
];

// Helper function to get app by slug
export function getAppBySlug(slug: string) {
    return MOCK_APPS.find(app => app.slug === slug);
}
