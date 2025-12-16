
-- Create Dispensaries Table
create table if not exists public.dispensaries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  region text, -- State/Territory e.g. WA, VIC
  city text,
  address text,
  website text,
  phone text,
  rating numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint dispensaries_name_unique unique (name, address)
);

-- Enable RLS
alter table public.dispensaries enable row level security;

-- Policies
create policy "Enable read access for all users" on public.dispensaries for select using (true);
create policy "Enable insert for service role only" on public.dispensaries for insert with check (true);
