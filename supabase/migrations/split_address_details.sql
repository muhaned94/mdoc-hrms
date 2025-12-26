-- Split Address into Detailed Fields
alter table public.employees 
add column if not exists governorate text,
add column if not exists city text,
add column if not exists mahalla text,
add column if not exists zgaq text,
add column if not exists dar text;

-- We can keep the old 'address' column as a fallback or computed field, 
-- but for now we'll add these new ones.
