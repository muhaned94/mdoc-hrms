-- =================================================================
-- FIX RESTORE RLS ERRORS
-- This script ensures that all tables used in the backup/restore system
-- have the necessary policies to allow high-level operations (upsert).
-- =================================================================

-- 1. user_activity_logs
-- Add UPDATE policy for activity logs
DROP POLICY IF EXISTS "Allow Public Update" ON public.user_activity_logs;
CREATE POLICY "Allow Public Update" ON public.user_activity_logs
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. circulars
-- Add UPDATE policy for circulars
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.circulars;
CREATE POLICY "Enable update for authenticated" ON public.circulars
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. courses
-- Ensure RLS policies exist for courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
CREATE POLICY "Users can view own courses" ON public.courses
    FOR SELECT USING (employee_id = auth.uid());

-- 4. admin_orders
-- Ensure RLS policies exist for admin_orders
DROP POLICY IF EXISTS "Admins can manage admin_orders" ON public.admin_orders;
CREATE POLICY "Admins can manage admin_orders" ON public.admin_orders
    FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Users can view own admin_orders" ON public.admin_orders;
CREATE POLICY "Users can view own admin_orders" ON public.admin_orders
    FOR SELECT USING (employee_id = auth.uid());

-- 5. salary_slips
-- Ensure RLS policies exist for salary_slips
DROP POLICY IF EXISTS "Admins can manage salary_slips" ON public.salary_slips;
CREATE POLICY "Admins can manage salary_slips" ON public.salary_slips
    FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Users can view own salary_slips" ON public.salary_slips;
CREATE POLICY "Users can view own salary_slips" ON public.salary_slips
    FOR SELECT USING (employee_id = auth.uid());

-- 6. appreciation_letters (Already has some, but let's ensure UPDATE is covered by ALL)
-- It already used 'FOR ALL', so it should be fine.

-- 7. messages
-- Ensure Admins can UPDATE messages (needed for upsert during restore)
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
CREATE POLICY "Admins can update messages" ON public.messages
    FOR UPDATE USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- 8. announcement_views
-- Ensure RLS policies exist for announcement_views
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage views" ON public.announcement_views;
CREATE POLICY "Admins can manage views" ON public.announcement_views
    FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Users can insert views" ON public.announcement_views;
CREATE POLICY "Users can insert views" ON public.announcement_views
    FOR INSERT WITH CHECK (true);
