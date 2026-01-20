-- Create table for business claims
create table if not exists business_claims (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  dispensary_id uuid references dispensaries(id) not null,
  business_email text not null,
  phone text,
  role text,
  status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent multiple pending claims for same dispensary by same user
  unique(user_id, dispensary_id)
);

-- Enable RLS
alter table business_claims enable row level security;

-- Policies
create policy "Users can insert their own claims"
  on business_claims for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own claims"
  on business_claims for select
  using (auth.uid() = user_id);
