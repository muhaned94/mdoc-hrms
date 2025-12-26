-- Fix Storage RLS Policies
-- Requires buckets: 'documents', 'salary-slips', 'avatars' to exist.
-- This script makes them publicly readable and writeable (for MVP Custom Auth).

-- 1. Documents Bucket
insert into storage.buckets (id, name, public) 
values ('documents', 'documents', true) 
on conflict (id) do update set public = true;

drop policy if exists "Public Access Documents" on storage.objects;
create policy "Public Access Documents" 
on storage.objects for all 
using ( bucket_id = 'documents' ) 
with check ( bucket_id = 'documents' );

-- 2. Salary Slips Bucket
insert into storage.buckets (id, name, public) 
values ('salary-slips', 'salary-slips', true) 
on conflict (id) do nothing;

drop policy if exists "Public Access Slips" on storage.objects;
create policy "Public Access Slips" 
on storage.objects for all 
using ( bucket_id = 'salary-slips' ) 
with check ( bucket_id = 'salary-slips' );

-- 3. Avatars Bucket
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true) 
on conflict (id) do update set public = true;

drop policy if exists "Public Access Avatars" on storage.objects;
create policy "Public Access Avatars" 
on storage.objects for all 
using ( bucket_id = 'avatars' ) 
with check ( bucket_id = 'avatars' );
