-- Add document columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS national_id_url text,
ADD COLUMN IF NOT EXISTS residency_card_url text,
ADD COLUMN IF NOT EXISTS marriage_contract_url text,
ADD COLUMN IF NOT EXISTS ration_card_url text;

-- Create storage bucket for documents if it doesn't exist
-- Note: This is an RPC/SQL way, but often managed in Supabase dashboard.
-- However, we can ensure the bucket exists via SQL if the extensions are enabled.
insert into storage.buckets (id, name, public)
select 'documents', 'documents', true
where not exists (
    select 1 from storage.buckets where id = 'documents'
);

-- Policy to allow authenticated users to upload their own documents
create policy "Users can upload their own documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to view their own documents
create policy "Users can view their own documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow admins to view all documents
create policy "Admins can view all documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents' AND
  exists (
    select 1 from public.employees
    where id = auth.uid() AND role = 'admin'
  )
);
