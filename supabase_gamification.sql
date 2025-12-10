-- Add Gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank text DEFAULT 'Seedling',
ADD COLUMN IF NOT EXISTS prestige integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';

-- Create Community Activity table for Shoutouts
CREATE TABLE IF NOT EXISTS public.community_activity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    type text NOT NULL, -- 'new_strain', 'rank_up', 'review'
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Community Activity
ALTER TABLE public.community_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view community activity."
    ON community_activity FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own activity."
    ON community_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- (Optional) Policy for system/service_role to clean up old activity
-- This is usually handled by a cron job or edge function
