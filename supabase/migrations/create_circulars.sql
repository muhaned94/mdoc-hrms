-- Create Circulars Table
CREATE TABLE IF NOT EXISTS public.circulars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT, -- store the path in storage to delete it later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read
CREATE POLICY "Enable read access for all users" ON public.circulars
    FOR SELECT USING (true);

-- Only admins/authenticated can insert/delete (simplified for now to authenticated, assuming admin check is in UI or backend logic if strictly needed, but for this project context 'authenticated' often covers employees too. We might want to restrict write to specific users later, but usually the 'admin' app is the one doing writes.)
-- Ideally:
-- CREATE POLICY "Enable insert for admins only" ON public.circulars FOR INSERT WITH CHECK ( ... );
-- For now, let's allow authenticated users to INSERT/DELETE (Admin layout protects the UI).
CREATE POLICY "Enable insert for authenticated" ON public.circulars
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON public.circulars
    FOR DELETE USING (auth.role() = 'authenticated');


-- Storage Bucket for Circulars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('circulars', 'circulars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Public read access
CREATE POLICY "Give public access to circulars" ON storage.objects
  FOR SELECT USING (bucket_id = 'circulars');

-- Authenticated upload access
CREATE POLICY "Enable upload for authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'circulars' AND auth.role() = 'authenticated');

-- Authenticated delete access
CREATE POLICY "Enable delete for authenticated users" ON storage.objects
  FOR DELETE USING (bucket_id = 'circulars' AND auth.role() = 'authenticated');
