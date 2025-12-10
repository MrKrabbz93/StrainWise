-- Add columns for verification status and source tracking
ALTER TABLE strains
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT;
