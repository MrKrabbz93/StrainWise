-- Enable RLS on strains table (if not already enabled)
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;

-- Drop existing "select" policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Strains are viewable by everyone" ON public.strains;

-- Create policy to allow public read access
CREATE POLICY "Strains are viewable by everyone" 
ON public.strains 
FOR SELECT 
TO public 
USING (true);

-- Also ensure the service_role has full access for administrative tasks
DROP POLICY IF EXISTS "Service role full access to strains" ON public.strains;
CREATE POLICY "Service role full access to strains" 
ON public.strains 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
