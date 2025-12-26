-- Drop the Foreign Key constraint that links employees to auth.users
-- This is necessary because we are creating "Custom Users" table that doesn't rely on Supabase Auth
alter table public.employees drop constraint if exists employees_id_fkey;

-- Now you can insert employees with any UUID without needing a matching auth.users account
