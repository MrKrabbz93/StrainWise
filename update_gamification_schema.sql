-- Add 'submitted_by' to track contributions
ALTER TABLE public.strains 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.dispensaries 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);

-- Add 'contributions_count' to profiles for gamification tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contributions_count integer DEFAULT 0;

-- Ensure XP column exists (safety check)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
