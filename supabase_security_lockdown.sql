-- 🔒 OPERATION LOCKDOWN: SECURITY HARDENING SCRIPT (UPDATED)
-- Run this in your Supabase SQL Editor.

-- 1. FORCE ENABLE RLS (Row Level Security)
-- Core Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
-- New Feature Tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_activity ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES (Ensure Basics Exist)
-- Strains: Public Read
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strains' AND policyname = 'Public Read Strains') THEN
        CREATE POLICY "Public Read Strains" ON public.strains FOR SELECT USING (true);
    END IF;
END $$;

-- 3. REVOKE ANONYMOUS ACCESS (Defense in Depth)
-- Zero Trust for "anon" role on critical tables.
REVOKE DELETE, UPDATE, INSERT ON public.profiles FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.chat_history FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.favorites FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.messages FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.strains FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.dispensaries FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.reviews FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.community_activity FROM anon;

-- 🛡️ AUDIT COMPLETE
