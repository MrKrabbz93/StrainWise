-- Enable PostGIS if available (optional, but good for geo-queries)
-- create extension if not exists postgis; 
-- For simplicity in this demo, we will use simple lat/lng columns, 
-- but in production we'd use a geography column for efficient "nearby" queries.

-- 1. Create Dispensaries Table
create table if not exists public.dispensaries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  city text not null,
  state text, 
  zip text,
  latitude double precision,
  longitude double precision,
  phone text,
  website text,
  hours jsonb, -- Store structured operational hours
  rating numeric default 0,
  is_partner boolean default false, -- If true, we might show them first or have real-time data
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Inventory Table (Many-to-Many link between Dispensaries and Strains)
-- Note: 'strains' table must exist. If storing external strain IDs, we might use a text column instead of FK.
-- Assuming we have a 'strains' table where 'id' is uuid or text. 
-- If 'strains' uses text names as IDs (which it did in some mock contexts), we should align.
-- Ideally proper FK:
create table if not exists public.dispensary_inventory (
  id uuid default gen_random_uuid() primary key,
  dispensary_id uuid references public.dispensaries(id) on delete cascade not null,
  strain_id text not null, -- references strains(id) or strains(name) depending on schema
  product_type text default 'flower', -- flower, cartridge, edible, etc.
  price_metric numeric, -- e.g. price per gram
  price_eighth numeric, -- price per 3.5g
  in_stock boolean default true,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- Index for fast geo-lookup (approximate box) and strain lookup
create index if not exists idx_dispensaries_lat_lng on public.dispensaries(latitude, longitude);
create index if not exists idx_inventory_strain_id on public.dispensary_inventory(strain_id);
create index if not exists idx_inventory_dispensary_id on public.dispensary_inventory(dispensary_id);

-- 3. RLS Policies
alter table public.dispensaries enable row level security;
alter table public.dispensary_inventory enable row level security;

-- Everyone can view dispensaries and inventory
create policy "Public dispensaries are viewable by everyone"
  on public.dispensaries for select
  using ( true );

create policy "Public inventory is viewable by everyone"
  on public.dispensary_inventory for select
  using ( true );

-- Only service role or admins can insert/update (omitted for brevity, secure by default)
