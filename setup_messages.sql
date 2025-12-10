-- Create Messages Table for User Inbox
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    sender text DEFAULT 'StrainWise System', -- Could be 'System', 'AI', or another user_id
    subject text NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = user_id);

-- System or Admin sends messages (service_role), or maybe users can send to each other?
-- For now, allow users to insert if they want to 'message' others (future feature), 
-- but strictly, this is usually system-generated.
-- Let's allow authenticated users to insert for now to enable peer-to-peer logic later.
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    
-- Update security script to include this if not already there, 
-- but this script handles its own basic policy.
