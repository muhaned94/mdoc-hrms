-- 1. Reset Table
drop view if exists public.analytics_logs_view;
drop table if exists public.user_activity_logs;

-- 2. Create Table (Ref auth.users for Safety)
create table public.user_activity_logs (
    id uuid default uuid_generate_v4() primary key,
    -- Reference auth.users to guarantee inserts work for any logged-in user
    user_id uuid references auth.users not null,
    action_type text not null,
    path text,
    details jsonb, 
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Security
alter table public.user_activity_logs enable row level security;

grant all on public.user_activity_logs to authenticated;
grant all on public.user_activity_logs to service_role;

-- 4. Policies
create policy "Admins can view all logs" on public.user_activity_logs for select
    using ( exists ( select 1 from public.employees where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert own logs" on public.user_activity_logs for insert
    with check ( auth.uid() = user_id );

create policy "Users can view own logs" on public.user_activity_logs for select
    using ( auth.uid() = user_id );

-- 5. Create View for Frontend (Solves the Join Error)
create or replace view public.analytics_logs_view as
select 
    l.id,
    l.user_id,
    l.action_type,
    l.path,
    l.created_at,
    e.full_name,
    e.avatar_url
from public.user_activity_logs l
left join public.employees e on l.user_id = e.id;

-- Grant access to view
grant select on public.analytics_logs_view to authenticated;
grant select on public.analytics_logs_view to service_role;
