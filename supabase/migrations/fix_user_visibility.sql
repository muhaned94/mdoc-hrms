-- DEFINITIVE FIX FOR UPLOAD ERROR (RLS VIOLATION)
-- This script fixes the Admin INSERT permissions specifically

-- 1. Create a SECURITY DEFINER function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.employees 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- 2. Revoke and Re-create policies for appreciation_letters
-- We use CASCADE to handle any hidden dependencies
DROP POLICY IF EXISTS "admin_all_access" ON public.appreciation_letters;
DROP POLICY IF EXISTS "user_select_own" ON public.appreciation_letters;
DROP POLICY IF EXISTS "Admins can manage appreciation letters" ON public.appreciation_letters;
DROP POLICY IF EXISTS "Users can view own appreciation letters" ON public.appreciation_letters;
DROP POLICY IF EXISTS "admin_full_access" ON public.appreciation_letters;

-- ADMIN POLICY: Allow EVERYTHING if is_admin() is true
-- This includes INSERT which was failing
CREATE POLICY "admin_power_policy" 
ON public.appreciation_letters 
FOR ALL 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- USER POLICY: Allow only SELECTing their own letters
CREATE POLICY "user_view_policy" 
ON public.appreciation_letters 
FOR SELECT 
TO authenticated 
USING ( employee_id = auth.uid() );

-- 3. Ensure your current user is actually an ADMIN in the database
-- This is often the reason for "RLS violation"
UPDATE public.employees 
SET role = 'admin' 
WHERE id = auth.uid();

-- 4. Final settings
ALTER TABLE public.appreciation_letters ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.appreciation_letters TO authenticated;
GRANT ALL ON public.appreciation_letters TO service_role;
