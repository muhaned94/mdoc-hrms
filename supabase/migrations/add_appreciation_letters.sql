-- Add bonus_service_months to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS bonus_service_months int DEFAULT 0;

-- Create Appreciation Letters table
CREATE TABLE IF NOT EXISTS public.appreciation_letters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  bonus_months int CHECK (bonus_months IN (1, 6)) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.appreciation_letters ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage appreciation letters" 
ON public.appreciation_letters FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can view their own letters
CREATE POLICY "Users can view own appreciation letters"
ON public.appreciation_letters FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid()
);
