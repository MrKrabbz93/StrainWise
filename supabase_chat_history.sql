-- CHAT HISTORY TABLE
create table public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  role text not null, -- 'user' or 'assistant'
  content text not null,
  persona text default 'helpful', -- 'helpful', 'connoisseur', 'scientist'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for Chat History
alter table public.chat_history enable row level security;

create policy "Users can view own chat history."
  on chat_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert own chat messages."
  on chat_history for insert
  with check ( auth.uid() = user_id );

-- Index for faster queries by user and time
create index idx_chat_history_user_created on public.chat_history(user_id, created_at);
