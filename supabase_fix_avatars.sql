-- Enable RLS on the bucket (if not already enabled)
alter table storage.objects enable row level security;

-- Create policy to allow ANYONE to upload avatars (Authenticated users)
-- Note: 'authenticated' role includes users logged in via Supabase Auth
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Create policy to allow ANYONE to VIEW avatars (Public access)
create policy "Allow public viewing of avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- Create policy to allow users to update their OWN avatars
create policy "Allow users to update own avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' and owner = auth.uid() );

-- Create policy to allow users to delete their OWN avatars
create policy "Allow users to delete own avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' and owner = auth.uid() );
