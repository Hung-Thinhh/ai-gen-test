-- ==========================================
-- ADD DOMAIN CONTEXT FOR MILK TEA TOOL
-- ==========================================
-- Store the domain-specific context as a prompt template

INSERT INTO prompt_templates (tool_custom_id, category, name, name_vi, prompt_text, metadata)
VALUES
(1, 'domain_context',
 'Milk Tea & Beverage', 'Trà sữa & Đồ uống',
 'Milk Tea & Beverage aesthetics:
CONTEXT: Specialized commercial photography for bubble tea, milk tea, and modern beverages.
KEY ELEMENTS:
- APPETITE APPEAL: The drink must look irresistibly refreshing and delicious.
- TEXTURE VISIBILITY: Highlight the creamy texture of milk tea, the glossy chewiness of boba/pearls/toppings, and the condensation on the cup if cold.
- FRESHNESS INDICATORS: Use condensation droplets on the cup, ice cubes with realistic transparency, fresh ingredient props (tea leaves, fruit slices).
- LIGHTING: Soft, flattering lighting that enhances the drink''s color and translucency. Avoid harsh shadows on the key product.
- PROPS: Tea leaves, tapioca pearls (boba), fresh milk splashes, fruit ingredients relevant to the flavor.
FORBIDDEN: Do NOT add cosmetic props (brushes, powder), tech elements, or mismatched items like alcohol/wine glasses (unless specified).
VIBE: Youthful, trendy, refreshing, sweet, and premium.',
 '{"is_default": true, "description": "Domain context for milk tea products", "description_vi": "Ngữ cảnh cho sản phẩm trà sữa"}'::jsonb)

ON CONFLICT (tool_custom_id, category, name) 
DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    metadata = EXCLUDED.metadata;
