-- Function to check admin status securely (bypassing RLS)
create or replace function public.is_admin() 
returns boolean 
language sql 
security definer 
set search_path = public
as $$
  select exists (
    select 1 from employees 
    where id = auth.uid() 
    and role = 'admin'
  );
$$;

-- Drop existing policies to avoid conflicts
drop policy if exists "Admins can view all messages" on public.messages;
drop policy if exists "Admins can insert messages" on public.messages;
drop policy if exists "Users can view own messages" on public.messages;
drop policy if exists "Users can update own messages" on public.messages;

-- Re-create policies using the secure function
create policy "Admins can view all messages" on public.messages
  for select
  using (
    is_admin() or receiver_id = auth.uid()
  );

create policy "Admins can insert messages" on public.messages
  for insert
  with check (
    is_admin()
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
