-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    strain_name text NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated Users Insert"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users Update Own Reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users Delete Own Reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Create index on strain_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_strain_name ON public.reviews (strain_name);
