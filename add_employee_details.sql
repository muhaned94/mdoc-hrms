-- Add new columns to employees table for detailed grid
alter table public.employees 
add column if not exists address text,
add column if not exists phone_number text,
add column if not exists email text;
