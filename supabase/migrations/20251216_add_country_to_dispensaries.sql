
-- Add country column to dispensaries
alter table public.dispensaries 
add column if not exists country text default 'Australia';
