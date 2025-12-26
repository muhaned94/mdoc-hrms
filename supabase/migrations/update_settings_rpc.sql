-- Function to update employee settings (Avatar/Password)
-- SECURITY DEFINER allows it to run with elevated privileges, bypassing RLS
create or replace function update_employee_settings(
  p_employee_id uuid,
  p_avatar_url text default null,
  p_visible_password text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update employees
  set 
    avatar_url = coalesce(p_avatar_url, avatar_url),
    visible_password = coalesce(p_visible_password, visible_password)
  where id = p_employee_id;
end;
$$;
