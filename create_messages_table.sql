-- Create Messages Table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id), -- Nullable if system message
  receiver_id uuid references public.employees(id) on delete cascade not null,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
-- Admin can view all messages (or at least ones they sent, but for now allow all for admin power)
create policy "Admins can view all messages" on public.messages
  for select
  using (
    auth.uid() in (select id from public.employees where role = 'admin')
  );

-- Admin can insert messages
create policy "Admins can insert messages" on public.messages
  for insert
  with check (
    auth.uid() in (select id from public.employees where role = 'admin')
  );

-- Users can view their own messages
create policy "Users can view own messages" on public.messages
  for select
  using (
    receiver_id = auth.uid()
  );

-- Users can update (mark as read) their own messages
create policy "Users can update own messages" on public.messages
  for update
  using (
    receiver_id = auth.uid()
  );

-- Add simple function to count unread messages
create or replace function public.get_unread_messages_count()
returns integer
language sql
security definer
as $$
  select count(*)::integer
  from public.messages
  where receiver_id = auth.uid() and is_read = false;
$$;
