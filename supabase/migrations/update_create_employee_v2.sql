drop function if exists public.create_employee(uuid, jsonb);

create or replace function public.create_employee(
    p_admin_id uuid,
    p_employee_data jsonb
)
returns json
language plpgsql
security definer
as $$
declare
  is_admin boolean;
  new_id uuid;
  result json;
begin
  -- 1. Verify the caller is an admin
  select exists (
    select 1 from public.employees 
    where id = p_admin_id and role = 'admin'
  ) into is_admin;

  if not is_admin then
    raise exception 'Unauthorized: Only admins can create employees';
  end if;

  -- 2. Insert the data
  insert into public.employees (
    id,
    company_id,
    full_name,
    birth_date,
    hire_date,
    leave_balance,
    years_of_service,
    job_title,
    certificate,
    specialization,
    position,
    work_schedule,
    work_location,
    nominal_salary,
    total_salary,
    visible_password,
    role,
    -- New Columns
    email,
    phone_number,
    marital_status,
    spouse_name,
    gender,
    university_name,
    college_name,
    graduation_year,
    graduation_certificate_url,
    -- Detailed Address
    address,
    governorate,
    city,
    mahalla,
    zgaq,
    dar
  ) values (
    (p_employee_data->>'id')::uuid,
    p_employee_data->>'company_id',
    p_employee_data->>'full_name',
    (p_employee_data->>'birth_date')::date,
    (p_employee_data->>'hire_date')::date,
    (p_employee_data->>'leave_balance')::int,
    (p_employee_data->>'years_of_service')::int,
    p_employee_data->>'job_title',
    p_employee_data->>'certificate',
    p_employee_data->>'specialization',
    p_employee_data->>'position',
    p_employee_data->>'work_schedule',
    p_employee_data->>'work_location',
    (p_employee_data->>'nominal_salary')::numeric,
    (p_employee_data->>'total_salary')::numeric,
    p_employee_data->>'visible_password',
    p_employee_data->>'role',
    -- New Values
    p_employee_data->>'email',
    p_employee_data->>'phone_number',
    p_employee_data->>'marital_status',
    p_employee_data->>'spouse_name',
    p_employee_data->>'gender',
    p_employee_data->>'university_name',
    p_employee_data->>'college_name',
    (p_employee_data->>'graduation_year')::int,
    p_employee_data->>'graduation_certificate_url',
    -- Detailed Address Values (Keep existing ones as optional/fallback)
    p_employee_data->>'address',
    p_employee_data->>'governorate',
    p_employee_data->>'city',
    p_employee_data->>'mahalla',
    p_employee_data->>'zgaq',
    p_employee_data->>'dar'
  )
  returning row_to_json(employees.*) into result;

  return result;
end;
$$;
