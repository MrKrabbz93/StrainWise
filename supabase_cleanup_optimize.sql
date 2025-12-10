-- Database Optimization Script
-- Run this periodically or via pg_cron extension if available

-- 1. Clean up old community activity (> 90 days log retention)
DELETE FROM public.community_activity
WHERE created_at < NOW() - INTERVAL '90 days';

-- 2. Optimize Query Planner
VACUUM (VERBOSE, ANALYZE) public.strains;
VACUUM (VERBOSE, ANALYZE) public.profiles;
VACUUM (VERBOSE, ANALYZE) public.reviews;

-- 3. (Optional) Create Index for "Sommelier" Lookups
CREATE INDEX IF NOT EXISTS idx_reviews_user_rating 
ON public.reviews(user_id, rating);

-- 4. Check Table Sizes (Diagnostic)
SELECT
    relname as Table,
    pg_size_pretty(pg_total_relation_size(relid)) As Size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as External_Size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
