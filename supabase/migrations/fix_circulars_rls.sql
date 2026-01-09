-- 1. Fix Circulars Table RLS
------------------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public.circulars;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.circulars;
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.circulars;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON public.circulars;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.circulars;

ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read
CREATE POLICY "Enable read access for all users" ON public.circulars
    FOR SELECT USING (true);

-- Allow authenticated to do everything (simple and robust)
CREATE POLICY "Enable all for authenticated" ON public.circulars
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 2. Fix Storage Bucket RLS
------------------------------------------------
-- Ensure bucket exists (and is public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('circulars', 'circulars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Give public access to circulars" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable all layout for authenticated" ON storage.objects;

-- Create fresh policies
-- Public Read
CREATE POLICY "Give public access to circulars" ON storage.objects
    FOR SELECT USING (bucket_id = 'circulars');

-- Authenticated Full Access (Upload, Update, Delete)
CREATE POLICY "Enable all for authenticated users" ON storage.objects
    FOR ALL USING (bucket_id = 'circulars' AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'circulars' AND auth.role() = 'authenticated');
