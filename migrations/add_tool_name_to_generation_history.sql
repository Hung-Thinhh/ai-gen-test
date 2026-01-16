-- Add tool_name column to generation_history table
-- This allows storing tool names like 'free-generation', 'studio', etc.
-- while keeping tool_id for backward compatibility

ALTER TABLE generation_history 
ADD COLUMN IF NOT EXISTS tool_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generation_history_tool_name 
ON generation_history(tool_name);

-- Update existing records with tool_id = -1 to have a default tool_name
UPDATE generation_history 
SET tool_name = 'unknown' 
WHERE tool_id = -1 AND tool_name IS NULL;

-- Optional: Add comment
COMMENT ON COLUMN generation_history.tool_name IS 'Human-readable tool identifier (e.g., free-generation, studio, portrait-generator)';
