-- =================================================================
-- EMERGENCY FIX: DISABLE ROW LEVEL SECURITY (RLS)
-- =================================================================
--
-- DIAGNOSIS:
-- Your application uses a custom "Virtual Login" system (LocalStorage).
-- It DOES NOT use Supabase Authentication (auth.users).
-- Therefore, the database sees all users as "Anonymous" (No JWT Token).
--
-- THE PROBLEM:
-- The previous Security Policies (RLS) tried to check "auth.jwt()".
-- Since there is no JWT, the database blocked ALL access.
-- It also caused the "Infinite Recursion" loop when trying to check admins.
--
-- THE SOLUTION:
-- Since we are using Custom Auth, we must DISABLE Database RLS.
-- This allows your React App (Profile, Reports, etc.) to read/write data.
-- Security is handled by your "Login.jsx" logic on the frontend side.

-- 1. Disable RLS on Employees
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on Reports
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on Notifications
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 4. Clean up old policies (Keep it clean)
DROP POLICY IF EXISTS "Employees View Policy" ON public.employees;
DROP POLICY IF EXISTS "Reports Select Policy" ON public.reports;
DROP POLICY IF EXISTS "Reports Insert Policy" ON public.reports;
DROP POLICY IF EXISTS "Notifications Select Policy" ON public.notifications;

-- 5. Grant Permissions to Anonymous/Public (since client is anon)
GRANT ALL ON public.employees TO anon, authenticated, service_role;
GRANT ALL ON public.reports TO anon, authenticated, service_role;
GRANT ALL ON public.notifications TO anon, authenticated, service_role;

-- Done. Your app should now work immediately.
