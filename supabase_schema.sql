-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  avatar_url text,
  bio text,
  interests text,
  is_public boolean default false,
  account_type text default 'user', -- 'user', 'small_business', 'corporate', 'government'
  subscription_status text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( is_public = true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view own profile."
  on profiles for select
  using ( auth.uid() = id );

-- FAVORITES TABLE
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  strain_name text not null,
  type text,
  visual_profile text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for Favorites
alter table public.favorites enable row level security;

create policy "Users can view own favorites."
  on favorites for select
  using ( auth.uid() = user_id );

create policy "Users can insert own favorites."
  on favorites for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own favorites."
  on favorites for delete
  using ( auth.uid() = user_id );

-- MESSAGES TABLE (Inbox)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  sender text default 'Chronos AI',
  subject text,
  body text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for Messages
alter table public.messages enable row level security;

create policy "Users can view own messages."
  on messages for select
  using ( auth.uid() = user_id );

-- Allow system/service_role to insert messages (for Welcome Email)
-- Note: In a real app, you'd have a backend function doing this. 
-- For now, we allow authenticated users to insert to simulate the "AI" sending it during their own session, 
-- or we rely on the client-side logic we built (which runs as the user).
create policy "Users can insert messages (simulation)."
  on messages for insert
  with check ( auth.uid() = user_id );
