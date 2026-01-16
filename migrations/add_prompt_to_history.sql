-- Add input_prompt column to generation_history table
ALTER TABLE generation_history ADD COLUMN IF NOT EXISTS input_prompt TEXT;

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_generation_history_input_prompt ON generation_history USING gin(to_tsvector('english', input_prompt));

COMMENT ON COLUMN generation_history.input_prompt IS 'The prompt/input text that was used to generate the image(s)';
