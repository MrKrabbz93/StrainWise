-- Add lead tracking columns to dispensaries table
ALTER TABLE public.dispensaries 
ADD COLUMN IF NOT EXISTS outreach_status text DEFAULT 'pending', -- 'pending', 'engaged', 'converted', 'rejected'
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lead_notes text,
ADD COLUMN IF NOT EXISTS country text;

-- Add index for outreach status
CREATE INDEX IF NOT EXISTS idx_dispensaries_outreach_status ON public.dispensaries(outreach_status);
CREATE INDEX IF NOT EXISTS idx_dispensaries_twitter_handle ON public.dispensaries(twitter_handle);
