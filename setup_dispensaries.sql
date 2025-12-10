-- Create Dispensaries Table
CREATE TABLE IF NOT EXISTS public.dispensaries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    lat double precision,
    lng double precision,
    rating numeric DEFAULT 5.0,
    inventory text[] DEFAULT '{}', -- Array of Strain IDs
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access"
    ON public.dispensaries FOR SELECT
    USING (true);

-- Insert Sample Dispensaries (for Map Demo)
INSERT INTO public.dispensaries (name, address, lat, lng, rating, inventory) VALUES 
('Green Horizon', '123 Cannabis Way, Portland, OR', 45.5152, -122.6784, 4.8, '{}'),
('Elevated Minds', '420 Higher St, Seattle, WA', 47.6062, -122.3321, 4.9, '{}'),
('The Healing Center', '777 Wellness Blvd, Los Angeles, CA', 34.0522, -118.2437, 4.7, '{}');
