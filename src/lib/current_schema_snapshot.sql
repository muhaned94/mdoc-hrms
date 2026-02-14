-- ============================================================================
-- MASTER DATABASE REBUILD SCRIPT - MDOC HRMS (Updated Snapshot)
-- ============================================================================
-- This script WIPES and REBUILDS the entire database schema from scratch.
-- It includes all tables, functions, and policies found in the project.
-- 
-- WARNING: THIS WILL DELETE ALL EXISTING DATA IN THE 'public' SCHEMA.
-- ============================================================================

-- 1. RESET SCHEMA
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE TABLES

-- Table: Employees
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL, -- Login ID
    full_name TEXT NOT NULL,
    birth_date DATE,
    hire_date DATE,
    leave_balance INT DEFAULT 0,
    years_of_service INT DEFAULT 0,
    job_title TEXT,
    certificate TEXT,
    specialization TEXT,
    position TEXT,
    work_schedule TEXT CHECK (work_schedule IN ('morning', 'shift')),
    work_location TEXT,
    nominal_salary NUMERIC,
    total_salary NUMERIC,
    visible_password TEXT, -- Plain text password (as requested)
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contact Details
    phone_number TEXT,
    email TEXT,
    
    -- Personal Details
    marital_status TEXT,
    spouse_name TEXT,
    gender TEXT,
    university_name TEXT,
    college_name TEXT,
    graduation_year INTEGER,
    graduation_certificate_url TEXT,

    -- Detailed Address
    address TEXT,

    -- Extras
    bonus_service_months INT DEFAULT 0,

    -- Official Documents
    national_id_url TEXT,
    residency_card_url TEXT,
    marriage_contract_url TEXT,
    ration_card_url TEXT,

    -- User Preferences
    theme_preference TEXT DEFAULT 'light'
);

-- Table: Departments
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level TEXT CHECK (level IN ('directorate', 'assistant', 'department', 'section', 'division', 'unit', 'office')),
    parent_id UUID REFERENCES public.departments(id),
    manager_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Courses
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    course_date DATE,
    duration TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Appreciation Letters
CREATE TABLE public.appreciation_letters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    bonus_months INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Admin Orders (Files)
CREATE TABLE public.admin_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Salary Slips
CREATE TABLE public.salary_slips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    month_year DATE,
    file_url TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Circulars
CREATE TABLE public.circulars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- No strict FK to avoid auth issues
);

-- Table: Messages
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID,
    receiver_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Activity Logs
CREATE TABLE public.user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    path TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Reports
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('complaint', 'bug_report', 'other')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('normal', 'high', 'critical')) DEFAULT 'normal',
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Table: Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Announcements
CREATE TABLE public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_location TEXT DEFAULT 'all',
    expiration_date DATE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Table: Announcement Views
CREATE TABLE public.announcement_views (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, employee_id)
);

-- Table: System Settings
CREATE TABLE public.system_settings (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  company_name TEXT DEFAULT 'MDOC HRMS',
  theme TEXT DEFAULT 'light',
  allow_password_change BOOLEAN DEFAULT TRUE,
  allow_profile_picture_change BOOLEAN DEFAULT TRUE,
  allow_backup_download BOOLEAN DEFAULT FALSE,
  login_method TEXT DEFAULT 'both', -- 'password', 'qr', 'both'
  course_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS (And Configure Open Policies for Custom Auth)

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appreciation_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views DISABLE ROW LEVEL SECURITY;

-- 5. FUNCTIONS

-- Helper: Check for Admin
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user (via Custom Auth JWT email claim) is an admin
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (select auth.jwt() ->> 'email')
    AND role = 'admin'
  );
END;
$$;

-- Login Function
CREATE OR REPLACE FUNCTION public.login_employee(p_company_id TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(e)
  INTO result
  FROM public.employees e
  WHERE e.company_id = p_company_id
  AND e.visible_password = p_password
  LIMIT 1;

  RETURN result;
END;
$$;

-- Create Employee Function
CREATE OR REPLACE FUNCTION public.create_employee(
    p_admin_id UUID,
    p_employee_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  new_id UUID;
  result JSON;
BEGIN
  -- Verify the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = p_admin_id AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create employees';
  END IF;

  -- Insert the data
  INSERT INTO public.employees (
    id, company_id, full_name, birth_date, hire_date, leave_balance, years_of_service,
    job_title, certificate, specialization, position, work_schedule, work_location,
    nominal_salary, total_salary, visible_password, role,
    email, phone_number,
    marital_status, spouse_name, gender,
    university_name, college_name, graduation_year, graduation_certificate_url,
    address
  ) VALUES (
    (p_employee_data->>'id')::UUID,
    p_employee_data->>'company_id',
    p_employee_data->>'full_name',
    (p_employee_data->>'birth_date')::DATE,
    (p_employee_data->>'hire_date')::DATE,
    (p_employee_data->>'leave_balance')::INT,
    (p_employee_data->>'years_of_service')::INT,
    p_employee_data->>'job_title',
    p_employee_data->>'certificate',
    p_employee_data->>'specialization',
    p_employee_data->>'position',
    p_employee_data->>'work_schedule',
    p_employee_data->>'work_location',
    (p_employee_data->>'nominal_salary')::NUMERIC,
    (p_employee_data->>'total_salary')::NUMERIC,
    p_employee_data->>'visible_password',
    p_employee_data->>'role',
    p_employee_data->>'email',
    p_employee_data->>'phone_number',
    p_employee_data->>'marital_status',
    p_employee_data->>'spouse_name',
    p_employee_data->>'gender',
    p_employee_data->>'university_name',
    p_employee_data->>'college_name',
    (p_employee_data->>'graduation_year')::INT,
    p_employee_data->>'graduation_certificate_url',
    p_employee_data->>'address'
  )
  RETURNING row_to_json(employees.*) INTO result;

  RETURN result;
END;
$$;

-- Unread Messages Count
CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::INTEGER
  FROM public.messages
  WHERE receiver_id = auth.uid() AND is_read = false;
$$;

-- Record Announcement View (Full Implementation)
CREATE OR REPLACE FUNCTION public.record_announcement_view(ann_id UUID, emp_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.announcement_views (announcement_id, employee_id)
    VALUES (ann_id, emp_id)
    ON CONFLICT (announcement_id, employee_id) DO NOTHING;

    UPDATE public.announcements
    SET view_count = (
        SELECT COUNT(*)
        FROM public.announcement_views
        WHERE announcement_id = ann_id
    )
    WHERE id = ann_id;
END;
$$;

-- Update Employee Settings (Avatar & Password)
CREATE OR REPLACE FUNCTION public.update_employee_settings(
    p_employee_id UUID,
    p_avatar_url TEXT DEFAULT NULL,
    p_visible_password TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.employees
    SET
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        visible_password = COALESCE(p_visible_password, visible_password)
    WHERE id = p_employee_id;
END;
$$;

-- 6. POLICIES (OPEN / CUSTOM AUTH COMPATIBLE)

-- Employees: Self View or Admin View
CREATE POLICY "Employees View Policy" ON public.employees FOR SELECT
USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR
    public.is_app_admin()
);

-- General Feature Policies (Open Read, Auth Write)
CREATE POLICY "Public Read Circulars" ON public.circulars FOR SELECT USING (true);
CREATE POLICY "Auth Write Circulars" ON public.circulars FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Circulars" ON public.circulars FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Auth Write Announcements" ON public.announcements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public Read Settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Auth Update Settings" ON public.system_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Insert Settings" ON public.system_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Personal Data (Owned by User)
CREATE POLICY "User Reports" ON public.reports FOR ALL USING (user_id = auth.uid() OR public.is_app_admin());
CREATE POLICY "User Notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "User Messages" ON public.messages FOR ALL USING (receiver_id = auth.uid() OR sender_id = auth.uid() OR public.is_app_admin());
CREATE POLICY "User Slips" ON public.salary_slips FOR SELECT USING (employee_id = auth.uid() OR public.is_app_admin());
CREATE POLICY "User Courses" ON public.courses FOR SELECT USING (employee_id = auth.uid() OR public.is_app_admin());
CREATE POLICY "User Letters" ON public.appreciation_letters FOR SELECT USING (employee_id = auth.uid() OR public.is_app_admin());
CREATE POLICY "User Admin Orders" ON public.admin_orders FOR SELECT USING (employee_id = auth.uid() OR public.is_app_admin());

-- Logs (Open)
CREATE POLICY "Public Logs" ON public.user_activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('circulars', 'circulars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('salary-slips', 'salary-slips', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('admin_orders', 'admin_orders', true) ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- 8. CREATE REQUESTED ADMIN USER
-- ID: 1000, Password: 12345
INSERT INTO public.employees (
    id,
    company_id, -- This is the Login ID "1000"
    full_name,
    visible_password,
    role,
    email,
    job_title,
    work_schedule,
    hire_date,
    created_at
) VALUES (
    uuid_generate_v4(), -- Internal UUID
    '1000',             -- Requested Login ID
    'System Administrator',
    '12345',            -- Requested Password
    'admin',
    'admin@system.com',
    'Super Admin',
    'morning',
    CURRENT_DATE,
    NOW()
) ON CONFLICT (company_id) DO NOTHING;

-- 9. DEFAULT SETTINGS
INSERT INTO public.system_settings (id, company_name)
VALUES (1, 'MDOC HRMS')
ON CONFLICT (id) DO NOTHING;

-- 10. RE-GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- END OF MASTER REBUILD SCRIPT
