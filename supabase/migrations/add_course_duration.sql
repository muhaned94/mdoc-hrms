-- Migration: Add duration column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration TEXT;
