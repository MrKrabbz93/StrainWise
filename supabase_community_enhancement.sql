-- ==========================================
-- COMMUNITY HUB ENHANCEMENT SCRIPT
-- ==========================================

-- 1. Ensure strain_journals has is_public and review (alias for notes)
DO $$ 
BEGIN 
    -- Add is_public if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'is_public') THEN
        ALTER TABLE public.strain_journals ADD COLUMN is_public boolean DEFAULT false;
    END IF;

    -- Add strain_name if missing (useful for feed display without complex joins)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'strain_name') THEN
        ALTER TABLE public.strain_journals ADD COLUMN strain_name text;
    END IF;

    -- Add review if missing (alias for notes, or just rename)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'review') THEN
        ALTER TABLE public.strain_journals ADD COLUMN review text;
    END IF;
END $$;

-- 2. CREATE JOURNAL LIKES TABLE
CREATE TABLE IF NOT EXISTS public.journal_likes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_id bigint REFERENCES public.strain_journals(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, journal_id)
);

-- 3. ENABLE RLS
ALTER TABLE public.journal_likes ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR LIKES
DROP POLICY IF EXISTS "Anyone can see likes count" ON public.journal_likes;
CREATE POLICY "Anyone can see likes count" ON public.journal_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle likes" ON public.journal_likes;
CREATE POLICY "Authenticated users can toggle likes" ON public.journal_likes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. UPDATE RLS FOR STRAIN JOURNALS (Ensure public access)
DROP POLICY IF EXISTS "Public can read public journals" ON public.strain_journals;
CREATE POLICY "Public can read public journals" 
ON public.strain_journals 
FOR SELECT 
USING (is_public = true);

-- 6. REVOKE ANON WRITE
REVOKE DELETE, UPDATE, INSERT ON public.journal_likes FROM anon;
