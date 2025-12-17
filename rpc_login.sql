-- Secure Login Function
-- This function runs with system privileges (SECURITY DEFINER)
-- It allows the frontend to check credentials without having direct access to the table
create or replace function public.login_employee(p_company_id text, p_password text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select row_to_json(e)
  into result
  from public.employees e
  where e.company_id = p_company_id
  and e.visible_password = p_password
  limit 1;

  return result;
end;
$$;

-- Grant access to anon (public) so the login page can call it
grant execute on function public.login_employee(text, text) to anon;
grant execute on function public.login_employee(text, text) to authenticated;
grant execute on function public.login_employee(text, text) to service_role;
