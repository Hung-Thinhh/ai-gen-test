-- Add input_prompt column to generation_history table
-- This stores the full prompt used for generation, for reproduction purposes

ALTER TABLE generation_history 
ADD COLUMN IF NOT EXISTS input_prompt TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN generation_history.input_prompt IS 'Full prompt used for image generation, includes GENERATE A NEW IMAGE directive and all instructions';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generation_history_input_prompt ON generation_history(input_prompt);

SELECT 'input_prompt column added successfully' AS status;
