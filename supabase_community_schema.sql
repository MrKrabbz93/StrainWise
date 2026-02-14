-- 🛰️ COMMUNITY & JOURNAL SCHEMA MIGRATION
-- This script creates missing tables for Community and Journal features.

-- 1. STRAIN JOURNALS (Public Reviews & Private Logs)
CREATE TABLE IF NOT EXISTS public.strain_journals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    strain_id TEXT NOT NULL, -- Name or ID
    strain_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    dosage TEXT,
    effects TEXT[], -- Array of strings
    notes TEXT,
    review TEXT, -- For public feed
    activity_tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active', -- 'active', 'flagged', 'hidden'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. JOURNAL LIKES (For Community Feed)
CREATE TABLE IF NOT EXISTS public.journal_likes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    journal_id BIGINT REFERENCES public.strain_journals(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, journal_id) -- One like per user per post
);

-- 3. CONTENT REPORTS (Moderation)
CREATE TABLE IF NOT EXISTS public.content_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users NOT NULL,
    journal_id BIGINT REFERENCES public.strain_journals(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COMMUNITY ACTIVITY (Global Feed Highlights)
CREATE TABLE IF NOT EXISTS public.community_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL, -- 'rank_up', 'new_favorite', 'milestone'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE RLS
ALTER TABLE public.strain_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_activity ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Strain Journals
DROP POLICY IF EXISTS "Public journals are viewable by everyone" ON strain_journals;
CREATE POLICY "Public journals are viewable by everyone" ON strain_journals 
    FOR SELECT USING (is_public = true AND status = 'active');

DROP POLICY IF EXISTS "Users can view own journals" ON strain_journals;
CREATE POLICY "Users can view own journals" ON strain_journals 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journals" ON strain_journals;
CREATE POLICY "Users can insert own journals" ON strain_journals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journals" ON strain_journals;
CREATE POLICY "Users can update own journals" ON strain_journals 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journals" ON strain_journals;
CREATE POLICY "Users can delete own journals" ON strain_journals 
    FOR DELETE USING (auth.uid() = user_id);

-- Journal Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON journal_likes;
CREATE POLICY "Likes are viewable by everyone" ON journal_likes 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle own likes" ON journal_likes;
CREATE POLICY "Users can toggle own likes" ON journal_likes 
    FOR ALL USING (auth.uid() = user_id);

-- Content Reports
DROP POLICY IF EXISTS "Users can submit reports" ON content_reports;
CREATE POLICY "Users can submit reports" ON content_reports 
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view reports" ON content_reports;
CREATE POLICY "Admins can view reports" ON content_reports 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.account_type = 'admin'
        )
    );

-- Community Activity
DROP POLICY IF EXISTS "Activity is viewable by everyone" ON community_activity;
CREATE POLICY "Activity is viewable by everyone" ON community_activity 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert activity" ON community_activity;
CREATE POLICY "System can insert activity" ON community_activity 
    FOR INSERT WITH CHECK (true);

-- 7. ADMIN PRIVILEGES (Global View)
-- Allow admins to see ALL profiles for the Dashboard stats
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles AS p
            WHERE p.id = auth.uid() AND p.account_type = 'admin'
        )
    );

-- 🛡️ MIGRATION COMPLETE
