-- Add missing columns to strains table to support user contributions
ALTER TABLE public.strains 
ADD COLUMN IF NOT EXISTS contributed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS image_url text;

-- Policy to allow authenticated users to insert strains (if not already existing)
CREATE POLICY "Users can add new strains"
    ON public.strains FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
