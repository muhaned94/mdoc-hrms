-- ========================================================
-- FIX FOR INFINITE RECURSION & MISSING PROFILE
-- ========================================================

-- 1. Create a helper function to safely check Admin status
-- This bypasses RLS to prevent the "Infinite recursion" error.
create or replace function public.is_app_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.employees
    where email = (select auth.jwt() ->> 'email')
    and role = 'admin'
  );
end;
$$;

-- ========================================================
-- 2. Employees Table Policy (Profile Access)
-- ========================================================
alter table public.employees enable row level security;

-- Drop old/bad policies
drop policy if exists "Employees can view own record" on public.employees;
drop policy if exists "Enable read access for all users" on public.employees;

-- Create the correct policy
create policy "Employees can view own record" on public.employees for select
using (
    -- User sees their own record (matching email)
    lower(email) = lower(auth.jwt() ->> 'email')
    OR
    -- Admins see all
    public.is_app_admin()
);

-- ========================================================
-- 3. Update Reports & Notifications to use the Safe Function
-- ========================================================

drop policy if exists "Reports Select Policy" on public.reports;
drop policy if exists "Reports Insert Policy" on public.reports;
drop policy if exists "Reports Update Policy" on public.reports;
drop policy if exists "Notifications Select Policy" on public.notifications;
drop policy if exists "Notifications Update Policy" on public.notifications;
drop policy if exists "Notifications Insert Policy" on public.notifications;

-- Reports
create policy "Reports Select Policy" on public.reports for select
using (
    exists (
        select 1 from public.employees
        where id = reports.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
    OR public.is_app_admin()
);

create policy "Reports Insert Policy" on public.reports for insert
with check (
    exists (
        select 1 from public.employees
        where id = user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

create policy "Reports Update Policy" on public.reports for update
using ( public.is_app_admin() );

-- Notifications
create policy "Notifications Select Policy" on public.notifications for select
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

create policy "Notifications Update Policy" on public.notifications for update
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

create policy "Notifications Insert Policy" on public.notifications for insert
with check ( auth.role() = 'authenticated' );
