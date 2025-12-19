-- Drop existing policies to avoid conflicts
drop policy if exists "Reports Select Policy" on public.reports;
drop policy if exists "Reports Insert Policy" on public.reports;
drop policy if exists "Reports Update Policy" on public.reports;
drop policy if exists "Notifications Select Policy" on public.notifications;
drop policy if exists "Notifications Update Policy" on public.notifications;
drop policy if exists "Notifications Insert Policy" on public.notifications;

-- Drop old policy names just in case
drop policy if exists "Users can view own reports" on public.reports;
drop policy if exists "Users can create reports" on public.reports;
drop policy if exists "Admins can view all reports" on public.reports;
drop policy if exists "Admins can update reports" on public.reports;
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "System can insert notifications" on public.notifications;
drop policy if exists "Employees can view own record" on public.employees;

-- ========================================================
-- 1. Employees Table: Allow users to find their own ID
-- ========================================================
alter table public.employees enable row level security;

create policy "Employees can view own record" on public.employees for select
using (
    email = (select auth.jwt() ->> 'email')
    OR
    exists (
        select 1 from public.employees
        where email = (select auth.jwt() ->> 'email')
        and role = 'admin'
    )
);

-- ========================================================
-- 2. Reports Table
-- ========================================================

-- Select (View)
create policy "Reports Select Policy" on public.reports for select
using (
    -- User owns the report (matched by email)
    exists (
        select 1 from public.employees
        where id = reports.user_id
        and email = (select auth.jwt() ->> 'email')
    )
    OR
    -- Current user is Admin
    exists (
        select 1 from public.employees
        where email = (select auth.jwt() ->> 'email')
        and role = 'admin'
    )
);

-- Insert (Create)
create policy "Reports Insert Policy" on public.reports for insert
with check (
    exists (
        select 1 from public.employees
        where id = user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- Update
create policy "Reports Update Policy" on public.reports for update
using (
    exists (
        select 1 from public.employees
        where email = (select auth.jwt() ->> 'email')
        and role = 'admin'
    )
);

-- ========================================================
-- 3. Notifications Table
-- ========================================================

-- Select
create policy "Notifications Select Policy" on public.notifications for select
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- Update
create policy "Notifications Update Policy" on public.notifications for update
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- Insert
create policy "Notifications Insert Policy" on public.notifications for insert
with check (
    auth.role() = 'authenticated'
);
