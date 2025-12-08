-- 🔧 PERMISSION REPAIR SCRIPT
-- The previous lockdown might have been too strict or permissions were missing for 'authenticated' users.
-- This script explicitly GRANTS rights to logged-in users so they can manage their own data.

-- 1. Grant access to Authenticated Users (Logged in)
-- They still need to pass RLS policies, but they need table-level permission first.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- Grant access to sequences if needed (for auto-increment, though we use UUIDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Ensure RLS is still active (Safety Check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 🛡️ PERMISSIONS RESTORED
