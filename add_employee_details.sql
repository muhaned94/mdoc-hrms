-- Add New Columns to Employees Table
alter table public.employees 
add column if not exists address text,
add column if not exists email text,
add column if not exists phone_number text,
add column if not exists marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed')),
add column if not exists spouse_name text,
add column if not exists gender text check (gender in ('male', 'female')),
add column if not exists university_name text,
add column if not exists college_name text,
add column if not exists graduation_year int,
add column if not exists graduation_certificate_url text;

-- Add bonus_service_months if not exists
alter table public.employees 
add column if not exists bonus_service_months int default 0;
