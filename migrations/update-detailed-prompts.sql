-- ==========================================
-- UPDATE STYLE PRESETS WITH DETAILED PROMPTS
-- For Milk Tea Poster Tool
-- ==========================================

-- Update existing presets with improved prompts
UPDATE prompt_templates
SET prompt_text = CASE name
    WHEN 'Studio Professional' THEN
        'GENERATE A NEW IMAGE: **DOMAIN/INDUSTRY CONTEXT:** {domain}. CREATE A NEW {posterType} featuring the product in the image. EXTRACT the product and place it in a completely NEW professional studio environment. Apply: {bgPrompt}. Use {lightPrompt}. Shoot at {anglePrompt}. **CRITICAL INSTRUCTIONS FOR REALISTIC INTEGRATION:** 1. **SEAMLESS INTEGRATION IS MANDATORY:** The product MUST look like it was ACTUALLY PHOTOGRAPHED in the scene, NOT composited. Match the product''s lighting EXACTLY to the environment lighting. Create NATURAL shadows that match the scene''s light source. Add subtle reflections from the environment onto the product surface. 2. **LIGHTING CONSISTENCY:** Shadows must fall in the SAME direction. Add ambient occlusion where product meets surfaces. 3. **ENVIRONMENTAL INTERACTION:** Add realistic reflections on glossy product surfaces. Create natural shadows underneath and around the product. Add atmospheric effects consistently. 4. **COLOR HARMONY:** The product''s colors should be influenced by the environment''s ambient color. Ensure white balance is consistent. 5. **OUTPUT QUALITY:** Full HD, professional commercial photography quality. Sharp focus on product with appropriate depth of field. The result must be indistinguishable from a real professional photo shoot. {notes} Additional Instructions: Style: studio_professional'
    
    WHEN 'Organic & Elegant' THEN
        'GENERATE A NEW IMAGE: **DOMAIN/INDUSTRY CONTEXT:** {domain}. CREATE A NEW {posterType} featuring the product in the image. EXTRACT the product and PLACE it in an elegant organic setting with fresh green leaves, colorful flowers, and natural elements surrounding it. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. **CRITICAL INSTRUCTIONS FOR REALISTIC INTEGRATION:** 1. **SEAMLESS INTEGRATION IS MANDATORY:** The product MUST look like it was ACTUALLY PHOTOGRAPHED in the scene, NOT composited. Match the product''s lighting EXACTLY to the environment lighting. Create NATURAL shadows that match the scene''s light source. Add subtle reflections from the environment onto the product surface. 2. **LIGHTING CONSISTENCY:** Shadows must fall in the SAME direction. Add ambient occlusion where product meets surfaces. Include subtle rim lighting if scene has backlighting. 3. **ENVIRONMENTAL INTERACTION:** Add realistic reflections on glossy product surfaces showing the environment. Create natural shadows underneath and around the product. Natural elements (leaves, flowers) should interact with the product realistically. 4. **COLOR HARMONY:** The product''s colors should be influenced by the environment''s ambient color. Ensure white balance is consistent. Add subtle green color spill from leaves onto product edges. 5. **OUTPUT QUALITY:** Full HD, professional commercial photography quality. Sharp focus on product with appropriate depth of field. The result must be indistinguishable from a real professional photo shoot. {notes} Additional Instructions: Style: organic_elegant'
    
    WHEN 'Dynamic & Fresh' THEN
        'GENERATE A NEW IMAGE: **DOMAIN/INDUSTRY CONTEXT:** {domain}. CREATE A NEW DYNAMIC {posterType} featuring the product in the image. GENERATE an exciting scene with dramatic liquid splash, water droplets frozen in mid-air, ice cubes flying, and dynamic motion effects. Apply: {bgPrompt}. {lightPrompt}. {anglePrompt}. **CRITICAL INSTRUCTIONS FOR REALISTIC INTEGRATION:** 1. **SEAMLESS INTEGRATION IS MANDATORY:** The product MUST look like it was ACTUALLY PHOTOGRAPHED with high-speed photography, NOT composited. Match the product''s lighting to the dynamic scene. Create NATURAL splash interactions with the product. 2. **DYNAMIC ELEMENTS:** Water droplets must realistically interact with product surface. Ice cubes should have correct physics and lighting. Splash patterns must originate from or interact with the product naturally. 3. **LIGHTING FOR MOTION:** Use high-speed photography lighting setup. Freeze motion with sharp focus. Add motion blur only where appropriate. 4. **COLOR HARMONY:** Keep beverage colors vibrant and appetizing. Ensure water/ice has correct transparency and refraction. 5. **OUTPUT QUALITY:** Full HD, professional high-speed photography quality. The result must look like a real studio splash photography session. {notes} Additional Instructions: Style: dynamic_fresh'
    
    ELSE prompt_text
END
WHERE tool_custom_id = 1 AND category = 'style_preset';

-- Verify updates
SELECT name, LEFT(prompt_text, 100) as prompt_preview 
FROM prompt_templates 
WHERE tool_custom_id = 1 AND category = 'style_preset'
ORDER BY id;
