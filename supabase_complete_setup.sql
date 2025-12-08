-- 🛠️ COMPLETE SETUP & LOCKDOWN SCRIPT
-- This script will:
-- 1. Create any missing tables required by StrainWise.
-- 2. Apply necessary RLS policies so the app works for logged-in users.
-- 3. Enforce "Operation Lockdown" (Revoke all anonymous access).

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLE CREATION (Idempotent)
-- ==========================================

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  avatar_url text,
  bio text,
  interests text,
  is_public boolean default false,
  account_type text default 'user',
  subscription_status text default 'free',
  username text unique,
  tutorial_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHAT HISTORY
create table if not exists public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  role text not null,
  content text not null,
  persona text default 'helpful',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FAVORITES
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  strain_name text not null,
  type text,
  visual_profile text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGES
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  sender text default 'StrainWise AI',
  subject text,
  body text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. RLS POLICIES (Enable App Functionality)
-- ==========================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.chat_history enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
-- Try to enable RLS on strains/dispensaries if they exist (ignore errors if not)
do $$ begin execute 'alter table public.strains enable row level security'; exception when others then null; end $$;
do $$ begin execute 'alter table public.dispensaries enable row level security'; exception when others then null; end $$;

-- PROFILES POLICIES
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( is_public = true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

drop policy if exists "Users can view own profile." on profiles;
create policy "Users can view own profile." on profiles for select using ( auth.uid() = id );

-- CHAT HISTORY POLICIES
drop policy if exists "Users can view own chat history." on chat_history;
create policy "Users can view own chat history." on chat_history for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert own chat messages." on chat_history;
create policy "Users can insert own chat messages." on chat_history for insert with check ( auth.uid() = user_id );

-- FAVORITES POLICIES
drop policy if exists "Users can view own favorites." on favorites;
create policy "Users can view own favorites." on favorites for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert own favorites." on favorites;
create policy "Users can insert own favorites." on favorites for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can delete own favorites." on favorites;
create policy "Users can delete own favorites." on favorites for delete using ( auth.uid() = user_id );

-- MESSAGES POLICIES
drop policy if exists "Users can view own messages." on messages;
create policy "Users can view own messages." on messages for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert messages." on messages;
create policy "Users can insert messages." on messages for insert with check ( auth.uid() = user_id );

-- ==========================================
-- 3. OPERATION LOCKDOWN (Revoke Anon Access)
-- ==========================================

-- Revoke all write access from the 'anon' role (public internet users)
-- This ensures that even if RLS fails, the database rejects the request.

REVOKE DELETE, UPDATE, INSERT ON public.profiles FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.chat_history FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.favorites FROM anon;
REVOKE DELETE, UPDATE, INSERT ON public.messages FROM anon;

-- Safely revoke from strains/dispensaries if they exist
do $$ 
begin 
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'strains') then
    execute 'REVOKE DELETE, UPDATE, INSERT ON public.strains FROM anon';
  end if;
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'dispensaries') then
    execute 'REVOKE DELETE, UPDATE, INSERT ON public.dispensaries FROM anon';
  end if;
end $$;

-- 🛡️ SETUP COMPLETE & SECURED
