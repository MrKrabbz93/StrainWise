-- 🔒 OPERATION LOCKDOWN: SECURITY HARDENING SCRIPT
-- Run this in your Supabase SQL Editor to enforce strict security.

-- 1. FORCE ENABLE RLS (Row Level Security)
-- This ensures no table is left exposed.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;

-- 2. REVOKE ANONYMOUS ACCESS (Defense in Depth)
-- Even if an RLS policy is accidentally created, the 'anon' role (public users)
-- will be denied permission to modify data at the database level.

-- Profiles: Anon cannot touch.
REVOKE DELETE, UPDATE, INSERT ON public.profiles FROM anon;

-- Chat History: Anon cannot touch.
REVOKE DELETE, UPDATE, INSERT ON public.chat_history FROM anon;

-- Favorites: Anon cannot touch.
REVOKE DELETE, UPDATE, INSERT ON public.favorites FROM anon;

-- Messages: Anon cannot touch.
REVOKE DELETE, UPDATE, INSERT ON public.messages FROM anon;

-- Strains/Dispensaries: Anon cannot touch (Read-only via RLS is fine, but no writes).
REVOKE DELETE, UPDATE, INSERT ON public.strains FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.dispensaries FROM anon;

-- 3. AUDIT NOTES
-- Current Policy Status:
-- [x] PROFILES: DELETE is implicitly DENIED for everyone (No policy exists).
-- [x] CHAT_HISTORY: DELETE is implicitly DENIED for everyone (No policy exists).
-- [x] MESSAGES: DELETE is implicitly DENIED for everyone (No policy exists).
-- [x] FAVORITES: DELETE is allowed ONLY for the record owner (auth.uid() = user_id).

-- 🛡️ SYSTEM SECURE
