-- ==========================================
-- ADD tool_custom_id TO prompt_templates
-- ==========================================
-- Add foreign key to link prompts with specific tools

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_templates' 
        AND column_name = 'tool_custom_id'
    ) THEN
        ALTER TABLE prompt_templates 
        ADD COLUMN tool_custom_id INTEGER REFERENCES tool_custom(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added tool_custom_id column to prompt_templates';
    ELSE
        RAISE NOTICE 'Column tool_custom_id already exists';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tool_custom ON prompt_templates(tool_custom_id);

-- Verify
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompt_templates' 
ORDER BY ordinal_position;
