-- Add submitted_by column to dispensaries table
ALTER TABLE dispensaries ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);

-- Enable RLS for submissions tracking
ALTER TABLE dispensaries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view dispensaries
CREATE POLICY "Allow public read access" ON dispensaries FOR SELECT USING (true);

-- Policy: Authenticated users can submit new dispensaries
CREATE POLICY "Allow authenticated users to submit dispensaries" ON dispensaries FOR INSERT WITH CHECK (auth.uid() = submitted_by);
