-- Enable UUID extension for seed data
create extension if not exists "uuid-ossp";

-- Since we are using Custom Auth (Manual Session), standard RLS blocks access.
-- We will DISABLE Row Level Security to allow the application to Read/Write data.
-- Security is now handled by the Application Logic (Frontend Routes + Admin Checks).

alter table public.employees disable row level security;
alter table public.courses disable row level security;
alter table public.admin_orders disable row level security;
alter table public.salary_slips disable row level security;

-- Alternatively, you can Drop all policies if disabling doesn't work effectively immediately
-- drop policy if exists "Admins can view all data" on public.employees;
-- drop policy if exists "Users can view own data" on public.employees;
