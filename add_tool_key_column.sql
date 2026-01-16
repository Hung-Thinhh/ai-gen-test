-- Migration to add tool_key column to generation_history table
ALTER TABLE generation_history ADD COLUMN IF NOT EXISTS tool_key TEXT;
