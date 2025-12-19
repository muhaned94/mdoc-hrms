-- Create Reports Table
create table if not exists public.reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.employees(id) on delete cascade not null,
    type text check (type in ('complaint', 'bug_report', 'other')) not null,
    title text not null,
    description text not null,
    status text check (status in ('pending', 'resolved', 'dismissed')) default 'pending',
    priority text check (priority in ('normal', 'high', 'critical')) default 'normal',
    admin_response text,
    created_at timestamptz default now(),
    resolved_at timestamptz
);

-- Create Notifications Table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.employees(id) on delete cascade not null,
    title text not null,
    message text not null,
    link text,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- Policies for Reports
-- Users can see their own reports
create policy "Users can view own reports"
    on public.reports for select
    using (auth.uid() = user_id);

-- Users can insert their own reports
create policy "Users can create reports"
    on public.reports for insert
    with check (auth.uid() = user_id);

-- Admins can view all reports (assuming admins have a way to be identified, or we grant full access to authenticated for now and filter in app, 
-- BUT better to restrict. For now, we'll allow Authenticated to View All if they are admins. 
-- Since we handle role checks in app, we can allow 'select' for all authenticated users to simplify, 
-- OR strictly: check if auth.uid() is in employees with role 'admin'.
-- For simplicity and ensuring Admin Dashboard works, let's allow read access to all for now, or check role.
-- Let's stick to: Users view own. Admins view all.
-- To check admin in RLS is complex without claims. 
-- Let's use a simple policy: user_id = auth.uid() OR exists(select 1 from employees where id = auth.uid() and role = 'admin')
create policy "Admins can view all reports"
    on public.reports for select
    using (exists (select 1 from public.employees where id = auth.uid() and role = 'admin'));

-- Admins can update reports (to set status/response)
create policy "Admins can update reports"
    on public.reports for update
    using (exists (select 1 from public.employees where id = auth.uid() and role = 'admin'));

-- Policies for Notifications
-- Users can view their own notifications
create policy "Users can view own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
create policy "Users can update own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

-- Admins/System can insert notifications (anyone authenticated for now to allow trigger/functions)
create policy "System can insert notifications"
    on public.notifications for insert
    with check (true); 
