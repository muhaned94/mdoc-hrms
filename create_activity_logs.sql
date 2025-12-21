-- Create Activity Logs Table
create table if not exists public.user_activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    action_type text not null, -- 'login', 'navigation', 'logout'
    path text,
    details jsonb, -- Browser info, IP (if available), etc.
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_activity_logs enable row level security;

-- Policies
-- Admin can view all logs
create policy "Admins can view all logs"
    on public.user_activity_logs
    for select
    using ( exists ( select 1 from public.employees where id = auth.uid() and role = 'admin' ) );

-- Users can insert their own logs (for tracking)
create policy "Users can insert logs"
    on public.user_activity_logs
    for insert
    with check ( auth.uid() = user_id );

-- Users can view their own logs (optional, maybe used later)
create policy "Users can view own logs"
    on public.user_activity_logs
    for select
    using ( auth.uid() = user_id );
