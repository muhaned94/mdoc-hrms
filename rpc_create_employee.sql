-- Secure Admin Insert Function
-- Since we are using "Fake Auth" (Visible Passwords), RLS doesn't know we are Admins.
-- We must use an RPC function to perform admin actions securely.

create or replace function public.create_employee(
    p_admin_id uuid, -- ID of the admin performing the action (for verification)
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
    role
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
    p_employee_data->>'role'
  )
  returning row_to_json(employees.*) into result;

  return result;
end;
$$;

grant execute on function public.create_employee(uuid, jsonb) to anon;
grant execute on function public.create_employee(uuid, jsonb) to service_role;
