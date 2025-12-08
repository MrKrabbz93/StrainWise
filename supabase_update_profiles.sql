-- Add new columns to profiles table
alter table public.profiles 
add column if not exists username text unique,
add column if not exists tutorial_completed boolean default false;

-- Create a function to handle new user signup (optional, but good for Supabase)
-- For now, we rely on the client-side insertion we already built, 
-- but we ensure the RLS policies allow updating these new columns.

create policy "Users can update their own username and tutorial status."
  on profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );
