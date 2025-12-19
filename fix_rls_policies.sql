-- ========================================================
-- FIX FOR INFINITE RECURSION (ERROR 42P17)
-- ========================================================

-- 1. Create a helper function that bypasses RLS (SECURITY DEFINER)
-- This allows us to check if a user is an admin without triggering the policy loop.
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
-- 2. Fix Employees Table Policy
-- ========================================================
alter table public.employees enable row level security;

-- Drop the bad policy
drop policy if exists "Employees can view own record" on public.employees;

-- Create the new safe policy
create policy "Employees can view own record" on public.employees for select
using (
    -- User sees their own record
    email = (select auth.jwt() ->> 'email')
    OR
    -- Admins see all (using the safe function)
    public.is_app_admin()
);

-- ========================================================
-- 3. Fix Reports & Notifications (Update to use safe function)
-- ========================================================

-- Drop old policies
drop policy if exists "Reports Select Policy" on public.reports;
drop policy if exists "Reports Insert Policy" on public.reports;
drop policy if exists "Reports Update Policy" on public.reports;
drop policy if exists "Notifications Select Policy" on public.notifications;
drop policy if exists "Notifications Update Policy" on public.notifications;
drop policy if exists "Notifications Insert Policy" on public.notifications;

-- Reports Policies
create policy "Reports Select Policy" on public.reports for select
using (
    -- User sees own reports
    exists (
        select 1 from public.employees
        where id = reports.user_id
        and email = (select auth.jwt() ->> 'email')
    )
    OR
    -- Admin sees all
    public.is_app_admin()
);

create policy "Reports Insert Policy" on public.reports for insert
with check (
    -- User creates for self
    exists (
        select 1 from public.employees
        where id = user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

create policy "Reports Update Policy" on public.reports for update
using (
    -- Only admin updates
    public.is_app_admin()
);

-- Notifications Policies
create policy "Notifications Select Policy" on public.notifications for select
using (
    -- User sees own notifications
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

create policy "Notifications Update Policy" on public.notifications for update
using (
    -- User updates own (e.g. mark read)
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

create policy "Notifications Insert Policy" on public.notifications for insert
with check (
    -- System/Admin can insert
    auth.role() = 'authenticated'
);
