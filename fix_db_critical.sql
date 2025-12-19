-- =================================================================
-- CRITICAL DATABASE FIX
-- This script fixes the "Infinite Recursion" error that is crashing:
-- 1. The Profile Page
-- 2. The Employee List
-- 3. The Complaints System
-- =================================================================

-- 1. Create a "Security Definer" function to safely check for Admin.
-- This creates a "Backdoor" that allows checking the role WITHOUT triggering the RLS loop.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (select auth.jwt() ->> 'email')
    AND role = 'admin'
  );
END;
$$;

-- 2. RESET Row Level Security on Employees Table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on employees to be safe
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all" ON public.employees;

-- Create the ONE correct policy for SELECTION (Viewing)
CREATE POLICY "Employees View Policy" ON public.employees FOR SELECT
USING (
    -- Rule 1: User can see their OWN record
    lower(email) = lower(auth.jwt() ->> 'email')
    OR
    -- Rule 2: Admins (checked safely) can see EVERYONE
    public.is_app_admin()
);

-- 3. Fix Reports & Notifications Policies to use the Safe Function too

-- Drop old Report policies
DROP POLICY IF EXISTS "Reports Select Policy" ON public.reports;
DROP POLICY IF EXISTS "Reports Insert Policy" ON public.reports;
DROP POLICY IF EXISTS "Reports Update Policy" ON public.reports;

-- Recreate Report Policies
CREATE POLICY "Reports Select Policy" ON public.reports FOR SELECT
USING (
    -- User sees their own reports
    exists (
        select 1 from public.employees
        where id = reports.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
    OR 
    -- Admin sees all
    public.is_app_admin()
);

CREATE POLICY "Reports Insert Policy" ON public.reports FOR INSERT
WITH CHECK (
    -- User creates for themselves
    exists (
        select 1 from public.employees
        where id = user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Reports Update Policy" ON public.reports FOR UPDATE
USING ( public.is_app_admin() );

-- Drop old Notification policies
DROP POLICY IF EXISTS "Notifications Select Policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications Update Policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications Insert Policy" ON public.notifications;

-- Recreate Notification Policies
CREATE POLICY "Notifications Select Policy" ON public.notifications FOR SELECT
USING (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Notifications Update Policy" ON public.notifications FOR UPDATE
USING (
    exists (
        select 1 from public.employees
        where id = notifications.user_id
        and lower(email) = lower(auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Notifications Insert Policy" ON public.notifications FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );
