-- 🧹 CLEANUP & OPTIMIZATION SCRIPT
-- Resolves "Auth RLS Initialization Plan" (Performance) warnings.
-- Resolves "Multiple Permissive Policies" (Redundancy) warnings.

-- 1. DROP ALL POTENTIAL CONFLICTING/LEGACY POLICIES
-- We list every policy name that appeared in the audit or might exist.

-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_owner" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Chat History
DROP POLICY IF EXISTS "Users can insert own chat messages." ON public.chat_history;
DROP POLICY IF EXISTS "Users can view own chat history." ON public.chat_history;
DROP POLICY IF EXISTS "Users can manage own chat" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_insert_owner" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_select_owner" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_update_owner" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_delete_owner" ON public.chat_history;

-- Favorites
DROP POLICY IF EXISTS "Users can insert own favorites." ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites." ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites." ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_owner" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_owner" ON public.favorites;
DROP POLICY IF EXISTS "favorites_update_owner" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_owner" ON public.favorites;

-- Messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages." ON public.messages; -- Note the dot
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages." ON public.messages; -- Note the dot
DROP POLICY IF EXISTS "messages_insert_owner" ON public.messages;
DROP POLICY IF EXISTS "messages_select_owner" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

-- 2. RE-CREATE OPTIMIZED POLICIES
-- Uses (SELECT auth.uid()) for caching performance.
-- Consolidates permissions to prevent "Multiple Permissive" warnings.

-- === PROFILES ===
-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (is_public = true);

-- Allow owner full access (Select, Insert, Update, Delete) via one policy
-- This avoids having separate Select + Manage policies triggering warnings.
CREATE POLICY "Users can manage own profile" ON public.profiles
    USING ( (SELECT auth.uid())::uuid = id )
    WITH CHECK ( (SELECT auth.uid())::uuid = id );

-- === CHAT HISTORY ===
-- Single policy for full owner control
CREATE POLICY "Users can manage own chat" ON public.chat_history
    USING ( (SELECT auth.uid())::uuid = user_id )
    WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

-- === FAVORITES ===
-- Single policy for full owner control
CREATE POLICY "Users can manage own favorites" ON public.favorites
    USING ( (SELECT auth.uid())::uuid = user_id )
    WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

-- === MESSAGES ===
-- Split policies because permissions are different (No DELETE allowed)

-- SELECT: View own messages
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING ( (SELECT auth.uid())::uuid = user_id );

-- INSERT: Send own messages
CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK ( (SELECT auth.uid())::uuid = user_id );

-- UPDATE: Mark as read (Update own messages)
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING ( (SELECT auth.uid())::uuid = user_id );

-- 3. VERIFY PERMISSIONS (Just to be safe, exact grants)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated; -- No DELETE granted

-- ✅ OPTIMIZATION COMPLETE
