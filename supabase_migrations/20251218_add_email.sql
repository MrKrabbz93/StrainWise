-- Add email column for B2B outreach
ALTER TABLE dispensaries 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS outreach_status text DEFAULT 'pending'; -- pending, sent, bounced, replied

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_dispensaries_email ON dispensaries(email);
