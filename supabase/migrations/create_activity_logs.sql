-- 1. Reset
drop view if exists public.analytics_logs_view;
drop table if exists public.user_activity_logs;

-- 2. Create Table
create table public.user_activity_logs (
    id uuid default uuid_generate_v4() primary key,
    -- REFERENCE PUBLIC.EMPLOYEES because users are not in auth.users (Custom Login)
    user_id uuid references public.employees(id) on delete cascade not null,
    action_type text not null,
    path text,
    details jsonb, 
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Security (OPEN TO ANON because Custom Auth is used)
alter table public.user_activity_logs enable row level security;

-- Grant access to ANONYMOUS (public)
grant all on public.user_activity_logs to anon;
grant all on public.user_activity_logs to authenticated;
grant all on public.user_activity_logs to service_role;

-- Policies (Permissive because DB cannot verify Custom Auth token)
create policy "Allow Public Insert" on public.user_activity_logs
    for insert with check (true);

create policy "Allow Public Select" on public.user_activity_logs
    for select using (true);

-- 4. Create View for Frontend
create or replace view public.analytics_logs_view as
select l.id, l.user_id, l.action_type, l.path, l.created_at, e.full_name, e.avatar_url
from public.user_activity_logs l
left join public.employees e on l.user_id = e.id;

grant select on public.analytics_logs_view to anon;
grant select on public.analytics_logs_view to authenticated;
grant select on public.analytics_logs_view to service_role;
