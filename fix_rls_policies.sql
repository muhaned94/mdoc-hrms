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

-- 1. Reports: Select (View)
-- Users can view their own, Admins can view all.
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

-- 2. Reports: Insert (Create)
-- Users can insert reports for themselves.
create policy "Reports Insert Policy" on public.reports for insert
with check (
    exists (
        select 1 from public.employees
        where id = user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- 3. Reports: Update
-- Only Admins can update reports (to resolve them).
create policy "Reports Update Policy" on public.reports for update
using (
    exists (
        select 1 from public.employees
        where email = (select auth.jwt() ->> 'email')
        and role = 'admin'
    )
);

-- 4. Notifications: Select
-- Users view their own.
create policy "Notifications Select Policy" on public.notifications for select
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- 5. Notifications: Update
-- Users can mark as read.
create policy "Notifications Update Policy" on public.notifications for update
using (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and email = (select auth.jwt() ->> 'email')
    )
);

-- 6. Notifications: Insert
-- Allow authenticated users (system/admins) to create notifications.
create policy "Notifications Insert Policy" on public.notifications for insert
with check (
    auth.role() = 'authenticated'
);
