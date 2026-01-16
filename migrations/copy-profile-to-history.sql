-- ==========================================
-- COPY DATA FROM PROFILE TO HISTORY
-- ==========================================
-- This script copies all rows from 'profile' table to 'history' table

-- Option 1: Simple INSERT SELECT (if columns match exactly)
INSERT INTO history
SELECT * FROM profile;

-- Option 2: INSERT SELECT with specific columns (recommended)
-- Replace column names with actual columns from your tables
INSERT INTO history (
    user_id,
    username,
    email,
    created_at,
    updated_at
    -- Add other columns as needed
)
SELECT 
    user_id,
    username,
    email,
    created_at,
    updated_at
    -- Add other columns as needed
FROM profile;

-- Option 3: INSERT SELECT with column mapping (if columns are different)
INSERT INTO history (
    history_user_id,
    history_name,
    history_email,
    history_date
    -- Map to history table columns
)
SELECT 
    user_id,
    username,
    email,
    created_at
    -- Map from profile table columns
FROM profile;

-- Option 4: Copy only rows that don't exist in history (avoid duplicates)
INSERT INTO history (
    user_id,
    username,
    email,
    created_at
)
SELECT 
    p.user_id,
    p.username,
    p.email,
    p.created_at
FROM profile p
WHERE NOT EXISTS (
    SELECT 1 FROM history h 
    WHERE h.user_id = p.user_id
);

-- Option 5: Copy with additional transformations
INSERT INTO history (
    user_id,
    username,
    email,
    action_type,
    action_date
)
SELECT 
    user_id,
    username,
    email,
    'profile_migrated' as action_type,
    CURRENT_TIMESTAMP as action_date
FROM profile;

-- Verify the copy
SELECT COUNT(*) as profile_count FROM profile;
SELECT COUNT(*) as history_count FROM history;
