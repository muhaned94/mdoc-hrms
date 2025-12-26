-- ROLLBACK SCRIPT: Restore full visibility and disable security blocks
-- Run this if you want to bypass all RLS errors and see/edit your data immediately

-- Disable RLS on all tables to restore "State before problems"
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appreciation_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips DISABLE ROW LEVEL SECURITY;

-- Drop problematic helper functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Grant full access to authenticated users as a fallback
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.appreciation_letters TO authenticated;
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.admin_orders TO authenticated;
GRANT ALL ON public.salary_slips TO authenticated;
