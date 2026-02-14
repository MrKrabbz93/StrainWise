-- Reconcile Strains Schema
ALTER TABLE IF EXISTS public.strains ADD COLUMN IF NOT EXISTS aroma text;
ALTER TABLE IF EXISTS public.strains ADD COLUMN IF NOT EXISTS cbd text;
ALTER TABLE IF EXISTS public.strains ADD COLUMN IF NOT EXISTS medical_uses text[];
ALTER TABLE IF EXISTS public.strains ADD COLUMN IF NOT EXISTS flavors text[];

-- Ensure RLS is sane
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public strains are viewable by everyone" ON public.strains;
CREATE POLICY "Public strains are viewable by everyone" ON public.strains FOR SELECT USING (true);
