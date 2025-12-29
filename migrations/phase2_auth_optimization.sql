-- =====================================================
-- Phase 2 Auth Performance Optimization
-- Database Indexing and Query Optimization
-- =====================================================

-- 1. Add index on users.user_id for faster lookups
-- This is the primary key used in role queries
CREATE INDEX IF NOT EXISTS idx_users_user_id 
ON users(user_id);

-- 2. Add index on users.role for faster filtering
-- Useful for admin queries and role-based access
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- 3. Add composite index for common query pattern
-- Optimizes queries that filter by user_id and select role
CREATE INDEX IF NOT EXISTS idx_users_user_id_role 
ON users(user_id, role);

-- 4. Optimize RLS policies for better performance
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create optimized policy with explicit type casting
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid()::text = user_id);

-- 5. Add index on guest_sessions for faster guest credit lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_id 
ON guest_sessions(guest_id);

-- 6. Analyze tables to update statistics for query planner
ANALYZE users;
ANALYZE guest_sessions;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'guest_sessions')
ORDER BY tablename, indexname;

-- Check table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE tablename IN ('users', 'guest_sessions');

-- Test query performance (EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT role 
FROM users 
WHERE user_id = 'test-user-id';

-- =====================================================
-- Rollback (if needed)
-- =====================================================

-- Drop indexes if you need to rollback
-- DROP INDEX IF EXISTS idx_users_user_id;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_users_user_id_role;
-- DROP INDEX IF EXISTS idx_guest_sessions_guest_id;
