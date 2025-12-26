-- Drop the problematic recursive policy
drop policy if exists "Admins can view all data" on public.employees;

-- Create a secure function to check admin status without triggering RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer -- This runs with the privileges of the creator (system), bypassing RLS
as $$
  select exists (
    select 1 
    from public.employees 
    where id = auth.uid() 
    and role = 'admin'
  );
$$;

-- Create the new non-recursive policies

-- 1. Admins can do EVERYTHING (Select, Insert, Update, Delete)
create policy "Admins can do everything" 
on public.employees 
for all 
using ( public.is_admin() );

-- 2. Users can VIEW their own profile
create policy "Users can view own profile" 
on public.employees 
for select 
using ( auth.uid() = id );

-- 3. Users can UPDATE their own avatar (optional, depending on requirements)
create policy "Users can update own profile" 
on public.employees 
for update 
using ( auth.uid() = id );

-- Fix policies for other tables too (Courses, Orders, Slips)

-- Courses
alter table public.courses enable row level security;
create policy "Admins manage courses" on public.courses for all using ( public.is_admin() );
create policy "Users view own courses" on public.courses for select using ( employee_id = auth.uid() );

-- Admin Orders
alter table public.admin_orders enable row level security;
create policy "Admins manage orders" on public.admin_orders for all using ( public.is_admin() );
create policy "Users view own orders" on public.admin_orders for select using ( employee_id = auth.uid() );

-- Salary Slips
alter table public.salary_slips enable row level security;
create policy "Admins manage slips" on public.salary_slips for all using ( public.is_admin() );
create policy "Users view own slips" on public.salary_slips for select using ( employee_id = auth.uid() );
