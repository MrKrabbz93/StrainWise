
-- Create Response Cache Table
create table if not exists public.response_cache (
  id uuid default gen_random_uuid() primary key,
  prompt_hash text not null,
  system_hash text,
  model text not null,
  response text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null
);

-- Index for fast lookups
create index if not exists idx_response_cache_hashes on public.response_cache(prompt_hash, system_hash);

-- Enable RLS (Service Role only for now, or public read if generic?)
alter table public.response_cache enable row level security;

create policy "Service role can read cache" on public.response_cache for select using (true);
create policy "Service role can insert cache" on public.response_cache for insert with check (true);
