-- Add domain_prompts column to tool_custom if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_custom' AND column_name = 'domain_prompts') THEN 
        ALTER TABLE tool_custom ADD COLUMN domain_prompts TEXT;
        RAISE NOTICE 'Added domain_prompts column to tool_custom';
    END IF;
END $$;
