-- Fix username inconsistency ("Gunr" vs "Gunnr")
-- Intended target: Update profiles to use the standardized handle.

UPDATE profiles 
SET username = 'Gunnr' 
WHERE username = 'Gunr';

-- Optional: If you want to force it for a specific email
UPDATE profiles
SET username = 'Gunnr'
WHERE email = 'gunnr@example.com' OR email = 'gunr@example.com';
