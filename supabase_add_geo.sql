-- Add geographic coordinates to dispensaries table
ALTER TABLE public.dispensaries 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for geo searches
CREATE INDEX IF NOT EXISTS idx_dispensaries_lat_lng ON public.dispensaries(latitude, longitude);
