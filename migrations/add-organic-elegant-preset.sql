-- ==========================================
-- ADD ORGANIC & ELEGANT PRESET
-- ==========================================
-- Insert the Organic & Elegant style preset (previously hardcoded fallback)

INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata)
VALUES
(1, 'style_preset',
 'Organic & Elegant', 'Hữu cơ & Thanh lịch',
 'SCENE: Elegant organic setting with nature elements. **KEY VISUALS:** Fresh green leaves, colorful flowers, and natural botanical elements artfully arranged around the product. Soft, natural materials like wood, linen, or stone surfaces. **CRITICAL INSTRUCTIONS:** Natural morning or golden hour lighting. Depth of field with soft bokeh on background elements. Color palette should emphasize natural greens, earth tones, and organic textures. Atmosphere: fresh, pure, eco-friendly, premium natural aesthetic. Full HD commercial quality.',
 '{"description": "Natural leaves, flowers, organic setting", "description_vi": "Lá cây tươi, hoa, bối cảnh hữu cơ"}'::jsonb)

ON CONFLICT (tool_custom_id, category, name) 
DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    metadata = EXCLUDED.metadata;
