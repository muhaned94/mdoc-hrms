-- ROLLBACK SCRIPT: Restore full visibility
-- Run this if you want to disable all RLS and see your data immediately

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appreciation_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips DISABLE ROW LEVEL SECURITY;

-- Drop the function and its dependent policies
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- (Optional) If you want to keep RLS but allow everything for now:
-- CREATE POLICY "allow_all" ON public.employees FOR ALL USING (true);
