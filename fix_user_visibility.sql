-- Definitive Fix for User Visibility
-- This script ensures users can see their own appreciation letters

-- 1. Create a non-recursive is_admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins manage letters" ON public.appreciation_letters;
DROP POLICY IF EXISTS "Users view own letters" ON public.appreciation_letters;
DROP POLICY IF EXISTS "Admins can manage appreciation letters" ON public.appreciation_letters;
DROP POLICY IF EXISTS "Users can view own appreciation letters" ON public.appreciation_letters;

-- 3. Create clean policies
-- Admins: All access
CREATE POLICY "admin_all_access" ON public.appreciation_letters
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users: Select own records
CREATE POLICY "user_select_own" ON public.appreciation_letters
FOR SELECT TO authenticated
USING (employee_id = auth.uid());

-- 4. Enable RLS (or keep it disabled if you prefer, but this is the right way)
ALTER TABLE public.appreciation_letters ENABLE ROW LEVEL SECURITY;

-- 5. IMPORTANT: If the above doesn't work, it might be the storage bucket.
-- Ensure the 'documents' bucket is public or has a policy for 'authenticated' users.
