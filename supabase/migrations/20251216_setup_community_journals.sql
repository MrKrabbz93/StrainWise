
-- 1. Add is_public column safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'is_public') THEN
        ALTER TABLE public.strain_journals ADD COLUMN is_public boolean DEFAULT false;
    END IF;
END $$;

-- 2. Basic RLS
ALTER TABLE public.strain_journals ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Access
DROP POLICY IF EXISTS "Public can read public journals" ON public.strain_journals;
CREATE POLICY "Public can read public journals" 
ON public.strain_journals 
FOR SELECT 
USING (is_public = true);

-- 4. Policy: User Management (Self)
DROP POLICY IF EXISTS "Users can manage own journals" ON public.strain_journals;
CREATE POLICY "Users can manage own journals" 
ON public.strain_journals 
FOR ALL 
USING (auth.uid() = user_id);
