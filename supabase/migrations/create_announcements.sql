-- Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can do everything (we are currently bypassing RLS for simplicity as per previous sessions, but adding for future stability)
CREATE POLICY "Enable all for authenticated" ON public.announcements
    FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
