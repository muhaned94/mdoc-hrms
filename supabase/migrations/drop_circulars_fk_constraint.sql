-- Drop the foreign key constraint to allow uploads even if the user ID is not perfectly synced
ALTER TABLE public.circulars DROP CONSTRAINT IF EXISTS circulars_created_by_fkey;
