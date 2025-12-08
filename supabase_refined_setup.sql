-- 🚀 REFINED SUPABASE SETUP SCRIPT
-- Based on Supabase AI review.
-- Run this to apply the safest, most robust security configuration.

-- 0. GRANT SCHEMA USAGE (authenticated only)
GRANT USAGE ON SCHEMA public TO authenticated;

-- 1. TABLE PERMISSIONS (specific)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
-- messages: SELECT, INSERT, and UPDATE (for marking as read)
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- 2. ENABLE RLS (Idempotent checks)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_history') THEN
    ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3. POLICIES

-- PROFILES
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
  USING ( (SELECT auth.uid())::uuid = id )
  WITH CHECK ( (SELECT auth.uid())::uuid = id );

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT
  USING ( is_public = true );

-- CHAT_HISTORY
DROP POLICY IF EXISTS "Users can manage own chat" ON public.chat_history;
CREATE POLICY "Users can manage own chat" ON public.chat_history
  USING ( (SELECT auth.uid())::uuid = user_id )
  WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

-- FAVORITES
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
  USING ( (SELECT auth.uid())::uuid = user_id )
  WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

-- MESSAGES
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT
  USING ( (SELECT auth.uid())::uuid = user_id );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT
  WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE
  USING ( (SELECT auth.uid())::uuid = user_id );

-- 4. SEQUENCES (grant usage/select to authenticated)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. REVOKE ANON ACCESS (Explicit Safety)
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.chat_history FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.favorites FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.messages FROM anon;

-- ✅ REFINED SETUP COMPLETE
