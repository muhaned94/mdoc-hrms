-- Create Employees Table
create table public.employees (
  id uuid references auth.users not null primary key,
  company_id text unique not null,
  full_name text not null,
  birth_date date,
  hire_date date,
  leave_balance int default 0,
  years_of_service int default 0,
  job_title text,
  certificate text,
  specialization text,
  position text,
  work_schedule text check (work_schedule in ('morning', 'shift')),
  work_location text,
  nominal_salary numeric,
  total_salary numeric,
  visible_password text, -- Storing plain text password as requested (INSECURE)
  avatar_url text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Courses Table
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  course_name text not null,
  course_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Admin Orders Table (Files)
create table public.admin_orders (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  title text not null,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Salary Slips Table (Files)
create table public.salary_slips (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  month_year date,
  file_url text not null,
  details jsonb, -- Store detailed salary breakdown if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.employees enable row level security;
alter table public.courses enable row level security;
alter table public.admin_orders enable row level security;
alter table public.salary_slips enable row level security;

-- Policies (Simplified for MVP)
-- Allow admins to see everything
create policy "Admins can view all data" on public.employees for all using (
  auth.uid() in (select id from public.employees where role = 'admin')
);

-- Allow users to see their own data
create policy "Users can view own data" on public.employees for select using (
  auth.uid() = id
);
