-- Add incentive column if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'employees' and column_name = 'incentive') then
    alter table employees add column incentive numeric default 0;
  end if;
end $$;

-- Update the RPC function to handle the new column
-- Drop first to allow return type change if needed
drop function if exists create_employee(uuid, jsonb);

create or replace function create_employee(
    p_admin_id uuid,
    p_employee_data jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_admin_role text;
    v_new_id uuid;
begin
    -- 1. Verify Admin
    select role into v_admin_role
    from employees
    where id = p_admin_id;

    if v_admin_role != 'admin' then
        raise exception 'Unauthorized: Only admins can create employees';
    end if;

    -- 2. Insert Employee
    insert into employees (
        id,
        company_id,
        full_name,
        birth_date,
        hire_date,
        job_title,
        certificate,
        specialization,
        position,
        work_schedule,
        work_location,
        nominal_salary,
        total_salary,
        incentive, -- New Column
        years_of_service,
        leave_balance,
        visible_password,
        role,
        avatar_url
    ) values (
        (p_employee_data->>'id')::uuid,
        p_employee_data->>'company_id',
        p_employee_data->>'full_name',
        (p_employee_data->>'birth_date')::date,
        (p_employee_data->>'hire_date')::date,
        p_employee_data->>'job_title',
        p_employee_data->>'certificate',
        p_employee_data->>'specialization',
        p_employee_data->>'position',
        p_employee_data->>'work_schedule',
        p_employee_data->>'work_location',
        coalesce((p_employee_data->>'nominal_salary')::numeric, 0),
        coalesce((p_employee_data->>'total_salary')::numeric, 0),
        coalesce((p_employee_data->>'incentive')::numeric, 0), -- New Value
        coalesce((p_employee_data->>'years_of_service')::numeric, 0),
        coalesce((p_employee_data->>'leave_balance')::numeric, 0),
        p_employee_data->>'visible_password',
        coalesce(p_employee_data->>'role', 'user'),
        p_employee_data->>'avatar_url'
    )
    returning id into v_new_id;

    return json_build_object('id', v_new_id, 'status', 'success');
end;
$$;
